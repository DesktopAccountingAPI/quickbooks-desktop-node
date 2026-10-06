// HTTP client core: configuration, headers, retries, idempotency keys, timeouts, long-polling of
// pending requests, async mode and pagination. Hand-written runtime; the generated resource
// classes call into it.

import type { Request } from "../generated/models.ts";
import { VERSION } from "../version.ts";
import { isValidApiKey, maskApiKey } from "./api-key.ts";
import { APIPromise, type RawResult } from "./api-promise.ts";
import {
  ApiConnectionError,
  ApiError,
  ApiTimeoutError,
  DaapiError,
  makeApiError,
  RequestPendingError,
  type ErrorBody,
} from "./errors.ts";
import { buildQuery, readEnv, retryDelay, shouldRetry, sleep } from "./http.ts";
import { PagePromise, type CursorPage } from "./pagination.ts";
import { RequestHandle, type RequestHandleBackend } from "./request-handle.ts";
import { Webhooks } from "./webhooks.ts";

/** The `fetch` signature the client uses. Pass your own to add proxies, instrumentation or test doubles. */
export type Fetch = (input: string, init: RequestInit) => Promise<Response>;

/** Receives one structured line per HTTP attempt. Never receives the API key, headers or bodies. */
export interface Logger {
  debug(message: string, fields: Record<string, unknown>): void;
  warn(message: string, fields: Record<string, unknown>): void;
}

export interface ClientOptions {
  /** Secret key (`sk_live_...` / `sk_test_...`). Default: env `DAAPI_SECRET_KEY`. */
  apiKey?: string | undefined;
  /** API base URL without `/v1`. May contain a path. Default: env `DAAPI_BASE_URL`, else `https://api.desktopaccountingapi.com`. */
  baseUrl?: string | undefined;
  /** Default end user (`eu_...`) for QuickBooks Desktop operations. */
  endUserId?: string | null | undefined;
  /** Client-side timeout per HTTP attempt in milliseconds, and the total wait for a pending request. Default 100 000. */
  timeout?: number | undefined;
  /** Retries after network errors, 429 and retryable 5xx responses. Default 2. */
  maxRetries?: number | undefined;
  /** Server-side sync wait budget in seconds (`Daapi-Timeout-Seconds`, 1-300) on operations that accept it. Default: server default (90, health check 60). */
  serverTimeout?: number | undefined;
  /** Custom `fetch` implementation. Default: `globalThis.fetch`. */
  fetch?: Fetch | undefined;
  /** Optional logger for request attempts and retries. */
  logger?: Logger | undefined;
}

/** Per-call options. They override the client options for one call. */
export interface RequestOptions {
  /** End user for this call. */
  endUserId?: string | undefined;
  /** Idempotency key for a write. Default: a UUIDv4 generated once per call and reused by its retries. */
  idempotencyKey?: string | undefined;
  /** Client-side timeout in milliseconds. */
  timeout?: number | undefined;
  maxRetries?: number | undefined;
  /** `Daapi-Timeout-Seconds` for this call. */
  serverTimeout?: number | undefined;
  /** Aborts the call (including retries and polling). */
  signal?: AbortSignal | undefined;
}

/** Per-call options of a synchronous call (the default). */
export interface SyncRequestOptions extends RequestOptions {
  async?: false | undefined;
}

/** Async mode: send `Prefer: respond-async` and return a {@link RequestHandle} from the `202 Accepted` response. */
export interface AsyncRequestOptions extends RequestOptions {
  async: true;
  /** `Daapi-Queue-Ttl-Seconds` (10-86400): latest time the request may still be sent to QuickBooks. */
  queueTtl?: number | undefined;
}

/** @internal Static description of one operation, generated from the contract. */
export interface OperationSpec {
  id: string;
  method: "GET" | "POST" | "DELETE";
  /** Wire names of the positional path parameters (fixed ones excluded). */
  pathParams: readonly string[];
  /** Takes a params object (query parameters or JSON body). */
  params: boolean;
  /** Sends `Daapi-End-User-Id` (QuickBooks Desktop operations). */
  endUser: boolean;
  /** Sends `Idempotency-Key`. */
  write: boolean;
  /** Accepts `Daapi-Timeout-Seconds`. */
  serverTimeout: boolean;
  /** Accepts `Daapi-Queue-Ttl-Seconds`. */
  queueTtl: boolean;
  /** Documents `202` (async mode). */
  async: boolean;
}

/** @internal */
export interface CallInput {
  path: string;
  query?: object | undefined;
  body?: unknown;
  /** Raw XML body (passthrough). The response is returned as text. */
  xml?: string | undefined;
}

interface Resolved {
  apiKey: string;
  baseUrl: string;
  endUserId: string | undefined;
  timeout: number;
  maxRetries: number;
  serverTimeout: number | undefined;
  fetch: Fetch;
  logger: Logger | undefined;
}

type Mode = "json" | "text" | "async";

/** A 2xx response whose body is still unread (`release` stops its timeout timer), or a pending 504. */
type Attempt = { response: Response; release: () => void } | { pendingRequestId: string; error: ApiError };

/**
 * Per-attempt timeout. Unlike `AbortSignal.timeout`, the timer keeps the process alive while it
 * waits for response headers; it is unref'd while the body is read and cleared afterwards.
 */
function attemptTimer(ms: number): { signal: AbortSignal; clear: () => void; unref: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException(`Timed out after ${ms} ms`, "TimeoutError")), Math.max(1, ms));
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
    unref: () => (timer as { unref?: () => void }).unref?.(),
  };
}

const DEFAULT_BASE_URL = "https://api.desktopaccountingapi.com";
const DEFAULT_TIMEOUT_MS = 100_000;
const DEFAULT_MAX_RETRIES = 2;

function nonNegativeInt(name: string, value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new DaapiError(`${name} must be a non-negative number`);
  return value;
}

/** `AbortSignal.any` (Node.js 20.3+) with a fallback for older runtimes. */
function anySignal(a: AbortSignal, b: AbortSignal): AbortSignal {
  const any = (AbortSignal as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
  if (any) return any([a, b]);
  const controller = new AbortController();
  for (const s of [a, b]) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

function isBrowser(): boolean {
  return typeof (globalThis as { document?: unknown }).document !== "undefined";
}

/**
 * Shared client core. Use the generated `DesktopAccountingApi` class, which adds the resource tree
 * (`client.qbd.invoices`, `client.endUsers`, ...).
 */
export class BaseClient {
  readonly #o: Resolved;
  readonly #input: ClientOptions;
  /** Webhook verification helpers (no API key needed). */
  readonly webhooks: Webhooks = new Webhooks();

  constructor(options: ClientOptions = {}) {
    const apiKey = options.apiKey ?? readEnv("DAAPI_SECRET_KEY");
    if (apiKey === undefined || apiKey === "") {
      throw new DaapiError("Missing API key. Pass { apiKey } or set the DAAPI_SECRET_KEY environment variable.");
    }
    if (!isValidApiKey(apiKey)) {
      throw new DaapiError(
        `Invalid API key ${maskApiKey(apiKey)}: expected sk_live_ or sk_test_ followed by 40 characters with a valid checksum. Copy the key again from the dashboard (DAAPI_SECRET_KEY).`,
      );
    }
    const baseUrl = (options.baseUrl ?? readEnv("DAAPI_BASE_URL") ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    if (!/^https?:\/\//.test(baseUrl)) throw new DaapiError(`baseUrl must be an http(s) URL, got ${JSON.stringify(baseUrl)}`);
    const globalFetch = (globalThis as { fetch?: Fetch }).fetch;
    const fetchImpl = options.fetch ?? (globalFetch ? (url: string, init: RequestInit) => globalFetch(url, init) : undefined);
    if (!fetchImpl) throw new DaapiError("No fetch implementation available; pass { fetch }.");
    this.#input = { ...options };
    this.#o = {
      apiKey,
      baseUrl,
      endUserId: options.endUserId ?? undefined,
      timeout: nonNegativeInt("timeout", options.timeout ?? DEFAULT_TIMEOUT_MS),
      maxRetries: Math.floor(nonNegativeInt("maxRetries", options.maxRetries ?? DEFAULT_MAX_RETRIES)),
      serverTimeout: options.serverTimeout,
      fetch: fetchImpl,
      logger: options.logger,
    };
  }

  /** Base URL in use (without `/v1`). */
  get baseUrl(): string {
    return this.#o.baseUrl;
  }

  /** Default end user, if any. */
  get endUserId(): string | undefined {
    return this.#o.endUserId;
  }

  /** Client-side timeout in milliseconds. */
  get timeout(): number {
    return this.#o.timeout;
  }

  get maxRetries(): number {
    return this.#o.maxRetries;
  }

  /** A copy of this client with some options replaced. Shares the same `fetch` transport. */
  withOptions(options: ClientOptions): this {
    const ctor = this.constructor as new (o: ClientOptions) => this;
    return new ctor({ ...this.#input, apiKey: this.#o.apiKey, fetch: this.#o.fetch, ...options });
  }

  /** A copy of this client whose calls default to this end user's company file. */
  forEndUser(endUserId: string): this {
    if (typeof endUserId !== "string" || endUserId === "") throw new DaapiError("endUserId must be a non-empty string");
    return this.withOptions({ endUserId });
  }

  /** @internal Non-paginated call. Returns a request handle when `options.async` is true. */
  _call<T>(op: OperationSpec, input: CallInput, options?: SyncRequestOptions): APIPromise<T>;
  _call<T>(op: OperationSpec, input: CallInput, options: AsyncRequestOptions): APIPromise<RequestHandle<T>>;
  _call<T>(op: OperationSpec, input: CallInput, options?: SyncRequestOptions | AsyncRequestOptions): APIPromise<T> | APIPromise<RequestHandle<T>>;
  _call<T>(op: OperationSpec, input: CallInput, options: SyncRequestOptions | AsyncRequestOptions = {}): APIPromise<T> | APIPromise<RequestHandle<T>> {
    if (options.async === true) {
      if (!op.async) return new APIPromise<RequestHandle<T>>(Promise.reject(new DaapiError(`${op.id} does not support async mode`)));
      return new APIPromise<RequestHandle<T>>(this.#execute(op, input, options, "async") as Promise<RawResult<RequestHandle<T>>>);
    }
    return new APIPromise<T>(this.#execute(op, input, options, input.xml !== undefined ? "text" : "json") as Promise<RawResult<T>>);
  }

  /** @internal Cursor list. Returns a request handle for the first page when `options.async` is true. */
  _list<T>(op: OperationSpec, input: CallInput, options?: SyncRequestOptions): PagePromise<T>;
  _list<T>(op: OperationSpec, input: CallInput, options: AsyncRequestOptions): APIPromise<RequestHandle<CursorPage<T>>>;
  _list<T>(op: OperationSpec, input: CallInput, options?: SyncRequestOptions | AsyncRequestOptions): PagePromise<T> | APIPromise<RequestHandle<CursorPage<T>>>;
  _list<T>(op: OperationSpec, input: CallInput, options: SyncRequestOptions | AsyncRequestOptions = {}): PagePromise<T> | APIPromise<RequestHandle<CursorPage<T>>> {
    if (options.async === true) return this._call<CursorPage<T>>(op, input, options);
    const limit = (input.query as { limit?: unknown } | undefined)?.limit;
    return new PagePromise<T>((cursor) => {
      // Continuation requests send only the cursor (and limit if the caller set one): the filters live in the cursor.
      const query = cursor === undefined ? input.query : limit === undefined || limit === null ? { cursor } : { cursor, limit };
      return new APIPromise<CursorPage<T>>(this.#execute(op, { path: input.path, query }, options, "json") as Promise<RawResult<CursorPage<T>>>);
    });
  }

  async #execute(op: OperationSpec, input: CallInput, options: SyncRequestOptions | AsyncRequestOptions, mode: Mode): Promise<RawResult<unknown>> {
    const started = Date.now();
    const timeout = nonNegativeInt("timeout", options.timeout ?? this.#o.timeout);
    const maxRetries = Math.floor(nonNegativeInt("maxRetries", options.maxRetries ?? this.#o.maxRetries));
    const headers = this.#baseHeaders(mode === "text" ? "application/xml" : "application/json");
    if (op.endUser) {
      const endUserId = options.endUserId ?? this.#o.endUserId;
      if (!endUserId) {
        throw new DaapiError(
          `${op.id} needs an end user. Pass { endUserId } to the client, use client.forEndUser("eu_..."), or pass { endUserId } in the call options.`,
        );
      }
      headers.set("Daapi-End-User-Id", endUserId);
    }
    if (op.write) headers.set("Idempotency-Key", options.idempotencyKey ?? crypto.randomUUID());
    const serverTimeout = options.serverTimeout ?? this.#o.serverTimeout;
    if (op.serverTimeout && serverTimeout !== undefined) headers.set("Daapi-Timeout-Seconds", String(serverTimeout));
    if (mode === "async") {
      headers.set("Prefer", "respond-async");
      const queueTtl = (options as AsyncRequestOptions).queueTtl;
      if (op.queueTtl && queueTtl !== undefined) headers.set("Daapi-Queue-Ttl-Seconds", String(queueTtl));
    }
    let body: string | undefined;
    if (input.xml !== undefined) {
      headers.set("Content-Type", "application/xml");
      body = input.xml;
    } else if (input.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(input.body);
    }
    const url = this.#o.baseUrl + input.path + buildQuery(input.query);
    const attempt = await this.#send(op.method, url, input.path, headers, body, { timeout, maxRetries, signal: options.signal });

    if ("pendingRequestId" in attempt) {
      if (mode === "async") throw attempt.error;
      // 504 QBD_REQUEST_TIMEOUT after the request was sent: never resubmit; long-poll the request until the call's deadline.
      const done = await this.#waitFor<unknown>(attempt.pendingRequestId, started + timeout, null, { maxRetries, signal: options.signal });
      return { response: done.response, read: async () => done.value };
    }
    const { response, release } = attempt;
    const read = async (): Promise<unknown> => {
      try {
        if (mode === "text") return await this.#readText(response, timeout);
        if (mode === "json") return await this.#readJson(response, timeout);
        if (response.status !== 202) throw new DaapiError(`${op.id}: expected 202 Accepted in async mode, got ${response.status}`);
        const request = (await this.#readJson(response, timeout)) as Request;
        return new RequestHandle<unknown>(request, this.#handleBackend<unknown>(timeout, maxRetries, options.signal));
      } finally {
        release();
      }
    };
    return { response, read };
  }

  #baseHeaders(accept: string): Headers {
    const headers = new Headers({ Authorization: `Bearer ${this.#o.apiKey}`, Accept: accept });
    if (!isBrowser()) headers.set("User-Agent", `desktopaccountingapi-node/${VERSION}`);
    return headers;
  }

  /** Sends one logical request with retries. Returns a 2xx response (body unread) or a pending 504. */
  async #send(
    method: string,
    url: string,
    path: string,
    headers: Headers,
    body: string | undefined,
    opts: { timeout: number; maxRetries: number; signal: AbortSignal | undefined },
  ): Promise<Attempt> {
    const log = this.#o.logger;
    for (let attempt = 0; ; attempt++) {
      const timer = attemptTimer(opts.timeout);
      const timeoutSignal = timer.signal;
      const signal = opts.signal ? anySignal(opts.signal, timeoutSignal) : timeoutSignal;
      const t0 = Date.now();
      let response: Response;
      try {
        const init: RequestInit = { method, headers, signal };
        if (body !== undefined) init.body = body;
        response = await this.#o.fetch(url, init);
      } catch (err) {
        timer.clear();
        if (opts.signal?.aborted) throw new DaapiError("Request aborted by the caller", { cause: err });
        const failure = timeoutSignal.aborted
          ? new ApiTimeoutError(`Request timed out after ${opts.timeout} ms (${method} ${path})`, { cause: err })
          : new ApiConnectionError(`Connection error (${method} ${path}): ${err instanceof Error ? err.message : String(err)}`, { cause: err });
        log?.warn("daapi request failed without a response", { method, path, attempt, durationMs: Date.now() - t0, error: failure.message });
        if (attempt < opts.maxRetries) {
          await sleep(retryDelay(attempt, null), opts.signal);
          continue;
        }
        throw failure;
      }
      const requestId = response.headers.get("daapi-request-id");
      log?.debug("daapi response", { method, path, status: response.status, requestId, attempt, durationMs: Date.now() - t0 });
      if (response.ok) {
        timer.unref();
        return { response, release: timer.clear };
      }

      let text: string;
      try {
        text = await response.text();
      } catch (err) {
        timer.clear();
        if (opts.signal?.aborted) throw new DaapiError("Request aborted by the caller", { cause: err });
        const failure = new ApiConnectionError(`Connection lost while reading the error response (${method} ${path})`, { cause: err });
        if (attempt < opts.maxRetries) {
          await sleep(retryDelay(attempt, null), opts.signal);
          continue;
        }
        throw failure;
      }
      timer.clear();
      let errorBody: ErrorBody | undefined;
      try {
        const parsed = JSON.parse(text) as { error?: unknown };
        if (parsed && typeof parsed.error === "object" && parsed.error !== null) errorBody = parsed.error as ErrorBody;
      } catch {
        errorBody = undefined;
      }
      const error = makeApiError(response.status, errorBody, response.headers, errorBody ? undefined : `HTTP ${response.status} with a non-JSON body from ${method} ${path}`);
      const pendingId = errorBody?.details?.["requestId"];
      if (response.status === 504 && error.code === "QBD_REQUEST_TIMEOUT" && typeof pendingId === "string" && pendingId !== "") {
        return { pendingRequestId: pendingId, error };
      }
      if (attempt < opts.maxRetries && shouldRetry(response.status, response.headers.get("daapi-should-retry"), errorBody?.outcome)) {
        const delay = retryDelay(attempt, response.headers.get("retry-after"));
        log?.warn("daapi retrying", { method, path, status: response.status, code: error.code, requestId, attempt, delayMs: delay });
        await sleep(delay, opts.signal);
        continue;
      }
      throw error;
    }
  }

  async #readText(response: Response, timeout: number): Promise<string> {
    try {
      return await response.text();
    } catch (err) {
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw new ApiTimeoutError(`Timed out after ${timeout} ms while reading the response`, { cause: err });
      }
      throw new ApiConnectionError("Connection lost while reading the response", { cause: err });
    }
  }

  async #readJson(response: Response, timeout: number): Promise<unknown> {
    const text = await this.#readText(response, timeout);
    if (text === "") return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new DaapiError(`Response from ${response.url || "the API"} is not valid JSON (HTTP ${response.status})`, { cause: err });
    }
  }

  /** One `GET /v1/requests/{id}` (optionally long-polling). */
  async #retrieveRequest(id: string, waitSeconds: number | undefined, opts: { maxRetries: number; signal: AbortSignal | undefined }): Promise<{ request: Request; response: Response }> {
    const path = `/v1/requests/${encodeURIComponent(id)}`;
    const timeout = ((waitSeconds ?? 0) + 10) * 1000;
    const url = this.#o.baseUrl + path + buildQuery({ waitSeconds });
    const attempt = await this.#send("GET", url, path, this.#baseHeaders("application/json"), undefined, { timeout, maxRetries: opts.maxRetries, signal: opts.signal });
    if ("pendingRequestId" in attempt) throw attempt.error;
    try {
      const request = (await this.#readJson(attempt.response, timeout)) as Request;
      return { request, response: attempt.response };
    } finally {
      attempt.release();
    }
  }

  /** Long-polls a request until it settles or `deadline` (epoch ms) passes. */
  async #waitFor<T>(id: string, deadline: number, last: Request | null, opts: { maxRetries: number; signal: AbortSignal | undefined }): Promise<{ value: T; response: Response }> {
    let snapshot = last;
    for (;;) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new RequestPendingError(id, snapshot);
      const waitSeconds = Math.min(60, Math.ceil(remaining / 1000));
      const { request, response } = await this.#retrieveRequest(id, waitSeconds, opts);
      snapshot = request;
      const settled = settleRequest<T>(request);
      if (settled) return { value: settled.value, response };
    }
  }

  #handleBackend<R>(timeout: number, maxRetries: number, signal: AbortSignal | undefined): RequestHandleBackend<R> {
    const opts = { maxRetries, signal };
    return {
      defaultTimeout: timeout,
      retrieve: async (id) => (await this.#retrieveRequest(id, undefined, opts)).request,
      waitFor: async (id, deadline, last) => (await this.#waitFor<R>(id, deadline, last, opts)).value,
      settle: (request) => settleRequest<R>(request),
    };
  }
}

/**
 * Typed result of a settled request resource, or its typed error (thrown). Undefined while the
 * request is still queued, waiting or sent.
 */
export function settleRequest<T>(request: Request): { value: T } | undefined {
  switch (request.status) {
    case "succeeded":
      if (request.resultExpired) {
        throw new DaapiError(`Request ${request.id} succeeded, but its result is past the retention period; retrieve the object instead.`);
      }
      return { value: request.result as T };
    case "failed":
    case "canceled":
    case "outcome_unknown":
      throw requestError(request);
    default:
      return undefined;
  }
}

function requestError(request: Request): ApiError {
  const e = request.error as ErrorBody | null;
  if (e) return makeApiError(e.httpStatusCode ?? null, e);
  const fallback: ErrorBody =
    request.status === "outcome_unknown"
      ? { type: "OUTCOME_UNKNOWN_ERROR", code: "QBD_WRITE_OUTCOME_UNKNOWN", message: `Request ${request.id} reached QuickBooks but its outcome is unknown.`, outcome: "unknown", requestId: request.id }
      : { type: "INVALID_REQUEST_ERROR", code: "REQUEST_CANCELED", message: `Request ${request.id} ended with status ${request.status}.`, outcome: request.outcome, requestId: request.id };
  return makeApiError(null, fallback);
}
