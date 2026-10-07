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
  ApiUserAbortError,
  AuthenticationError,
  BadRequestError,
  BillingError,
  ConflictError,
  CursorExpiredError,
  DaapiError,
  IntegrationConnectionError,
  IntegrationError,
  InternalError,
  InternalServerError,
  InvalidRequestError,
  makeApiError,
  NotFoundError,
  OutcomeUnknownError,
  PermissionError,
  RateLimitError,
  RequestPendingError,
  UnprocessableEntityError,
  WebhookVerificationError,
  type ErrorBody,
} from "./errors.ts";
import { buildQuery, readEnv, retryDelay, shouldRetry, sleep } from "./http.ts";
import { PagePromise, type CursorPage } from "./pagination.ts";
import { RequestHandle, type RequestHandleBackend } from "./request-handle.ts";
import { Webhooks } from "./webhooks.ts";

/** The `fetch` signature the client uses. Pass your own to add proxies, instrumentation or test doubles. */
export type Fetch = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Receives one structured line per HTTP attempt. Never receives the API key, headers or bodies.
 * `console` and most logging libraries fit. `info` and `error` are optional.
 */
export interface Logger {
  debug(message: string, fields: Record<string, unknown>): void;
  info?(message: string, fields: Record<string, unknown>): void;
  warn(message: string, fields: Record<string, unknown>): void;
  error?(message: string, fields: Record<string, unknown>): void;
}

/** Minimum level passed to the logger. `off` disables logging. */
export type LogLevel = "debug" | "info" | "warn" | "error" | "off";

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, off: 4 };

/** Header map for `defaultHeaders` and per-call `headers`. A `null` per-call value removes a default header. */
export type HeaderMap = Record<string, string | null | undefined>;

export interface ClientOptions {
  /** Secret key (`sk_live_...` / `sk_test_...`). Default: env `DAAPI_SECRET_KEY`. */
  apiKey?: string | undefined;
  /**
   * API base URL. May contain a path. A trailing `/v1` is removed, so Conductor's form
   * (`https://api.desktopaccountingapi.com/v1`) also works. Default: env `DAAPI_BASE_URL`, else
   * `https://api.desktopaccountingapi.com`.
   */
  baseUrl?: string | undefined;
  /** Alias of `baseUrl` with Conductor's spelling. Passing both with different values throws. */
  baseURL?: string | undefined;
  /** Default end user (`eu_...`) for QuickBooks Desktop operations. */
  endUserId?: string | null | undefined;
  /**
   * Client-side timeout of each HTTP attempt in milliseconds (default 100 000). Each retry gets a
   * fresh attempt timeout, so a call can take longer in total; set `totalTimeout` to cap the whole
   * call. Without `totalTimeout` it is also the wait budget for a request that is still pending
   * after `504 QBD_REQUEST_TIMEOUT`.
   */
  timeout?: number | undefined;
  /**
   * Total time budget of one call in milliseconds: every attempt, retry backoff and the wait for a
   * pending request. A running attempt is cut off when it ends and no retry starts after it.
   * Default: none.
   */
  totalTimeout?: number | undefined;
  /** Retries after network errors, 429 and retryable 5xx responses. Default 2. */
  maxRetries?: number | undefined;
  /** Server-side sync wait budget in seconds (`Daapi-Timeout-Seconds`, 1-300) on operations that accept it. Default: server default (90, health check 60). */
  serverTimeout?: number | undefined;
  /**
   * Headers sent with every request. Headers the SDK manages (`Authorization`, `Accept`,
   * `Content-Type`, `User-Agent`, `Daapi-End-User-Id`, `Conductor-End-User-Id`, `Idempotency-Key`,
   * `Daapi-Timeout-Seconds`, `Prefer`, `Daapi-Queue-Ttl-Seconds`) are not taken from here.
   */
  defaultHeaders?: HeaderMap | undefined;
  /** Custom `fetch` implementation. Default: `globalThis.fetch`. */
  fetch?: Fetch | undefined;
  /**
   * Extra `RequestInit` options for every `fetch` call, for example an undici `dispatcher` for a
   * proxy. `method`, `headers`, `body` and `signal` are always set by the SDK.
   */
  fetchOptions?: RequestInit | undefined;
  /** Logger for request attempts and retries. With `logLevel` or `DAAPI_LOG` set and no logger, `console` is used. */
  logger?: Logger | undefined;
  /** Minimum log level. Default: env `DAAPI_LOG`, else `debug` when a `logger` is given; without either, nothing is logged. */
  logLevel?: LogLevel | undefined;
}

/** Per-call options. They override the client options for one call. */
export interface RequestOptions {
  /** End user for this call. */
  endUserId?: string | undefined;
  /**
   * Alias of `endUserId` with Conductor's name, so calls ported from `conductor-node` keep working.
   * Sends the same `Daapi-End-User-Id` header. Passing both with different values throws.
   */
  conductorEndUserId?: string | undefined;
  /** Idempotency key for a write. Default: a UUIDv4 generated once per call and reused by its retries. */
  idempotencyKey?: string | undefined;
  /** Client-side timeout of each HTTP attempt in milliseconds. */
  timeout?: number | undefined;
  /** Total time budget of this call in milliseconds (see `ClientOptions.totalTimeout`). */
  totalTimeout?: number | undefined;
  maxRetries?: number | undefined;
  /** `Daapi-Timeout-Seconds` for this call. */
  serverTimeout?: number | undefined;
  /** Extra headers for this call; `null` removes a default header. SDK-managed headers are not taken from here. */
  headers?: HeaderMap | undefined;
  /** Extra `RequestInit` options for this call's `fetch` calls, merged over the client's `fetchOptions`. */
  fetchOptions?: RequestInit | undefined;
  /** Aborts the call (including retries and polling). */
  signal?: AbortSignal | undefined;
}

/**
 * Accepted inside the params of QuickBooks Desktop operations, as `conductor-node` expects:
 * `client.qbd.invoices.list({ conductorEndUserId, ...filters })`. It is removed from the query or
 * body and sent as `Daapi-End-User-Id`, like the `endUserId` call option.
 */
export interface ConductorEndUserParam {
  /** End user for this call (Conductor's parameter name). Same as the `endUserId` call option. */
  conductorEndUserId?: string | undefined;
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
  totalTimeout: number | undefined;
  maxRetries: number;
  serverTimeout: number | undefined;
  defaultHeaders: HeaderMap;
  fetch: Fetch;
  fetchOptions: RequestInit | undefined;
  logger: Logger | undefined;
  logLevel: number;
}

/** Per-call transport settings passed down to `#send`. */
interface SendOptions {
  timeout: number;
  maxRetries: number;
  signal: AbortSignal | undefined;
  /** Epoch ms after which no attempt or retry starts (the total timeout), if any. */
  deadline: number | undefined;
  fetchOptions: RequestInit | undefined;
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

/** Removes trailing slashes and one trailing `/v1`: the SDK adds `/v1/...` itself. */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "").replace(/\/v1$/, "");
}

function parseLogLevel(value: string | undefined, source: string, strict: boolean): number | undefined {
  if (value === undefined) return undefined;
  const level = value.trim().toLowerCase();
  if (Object.hasOwn(LOG_LEVELS, level)) return LOG_LEVELS[level as LogLevel];
  if (strict) throw new DaapiError(`${source} must be one of ${Object.keys(LOG_LEVELS).join(", ")}, got ${JSON.stringify(value)}`);
  return undefined;
}

/** Headers the SDK sets itself; default and per-call headers never supply them. */
const MANAGED_HEADERS = ["Daapi-End-User-Id", "Conductor-End-User-Id", "Idempotency-Key", "Daapi-Timeout-Seconds", "Prefer", "Daapi-Queue-Ttl-Seconds", "Content-Type"];

function applyHeaders(target: Headers, extra: HeaderMap | undefined): void {
  if (!extra) return;
  for (const [name, value] of Object.entries(extra)) {
    if (value === undefined) continue;
    if (value === null) target.delete(name);
    else target.set(name, value);
  }
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

  // Error classes as statics, like `conductor-node`'s client class (`Conductor.APIError`), so
  // `err instanceof DesktopAccountingApi.APIError` works without extra imports.
  static readonly DaapiError = DaapiError;
  static readonly ConductorError = DaapiError;
  static readonly ApiError = ApiError;
  static readonly APIError = ApiError;
  static readonly ApiConnectionError = ApiConnectionError;
  static readonly APIConnectionError = ApiConnectionError;
  static readonly ApiTimeoutError = ApiTimeoutError;
  static readonly APIConnectionTimeoutError = ApiTimeoutError;
  static readonly ApiUserAbortError = ApiUserAbortError;
  static readonly APIUserAbortError = ApiUserAbortError;
  static readonly InvalidRequestError = InvalidRequestError;
  static readonly AuthenticationError = AuthenticationError;
  static readonly PermissionError = PermissionError;
  static readonly PermissionDeniedError = PermissionError;
  static readonly BillingError = BillingError;
  static readonly RateLimitError = RateLimitError;
  static readonly IntegrationConnectionError = IntegrationConnectionError;
  static readonly IntegrationError = IntegrationError;
  static readonly OutcomeUnknownError = OutcomeUnknownError;
  static readonly InternalError = InternalError;
  static readonly CursorExpiredError = CursorExpiredError;
  static readonly RequestPendingError = RequestPendingError;
  static readonly WebhookVerificationError = WebhookVerificationError;
  static readonly BadRequestError = BadRequestError;
  static readonly NotFoundError = NotFoundError;
  static readonly ConflictError = ConflictError;
  static readonly UnprocessableEntityError = UnprocessableEntityError;
  static readonly InternalServerError = InternalServerError;

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
    if (options.baseUrl !== undefined && options.baseURL !== undefined && normalizeBaseUrl(options.baseUrl) !== normalizeBaseUrl(options.baseURL)) {
      throw new DaapiError("baseUrl and baseURL are set to different URLs; pass only one.");
    }
    const rawBaseUrl = options.baseUrl ?? options.baseURL;
    const baseUrl = normalizeBaseUrl(rawBaseUrl ?? readEnv("DAAPI_BASE_URL") ?? DEFAULT_BASE_URL);
    if (!/^https?:\/\//.test(baseUrl)) throw new DaapiError(`baseUrl must be an http(s) URL, got ${JSON.stringify(baseUrl)}`);
    const globalFetch = (globalThis as { fetch?: Fetch }).fetch;
    const fetchImpl = options.fetch ?? (globalFetch ? (url: string, init: RequestInit) => globalFetch(url, init) : undefined);
    if (!fetchImpl) throw new DaapiError("No fetch implementation available; pass { fetch }.");
    const level = parseLogLevel(options.logLevel, "logLevel", true) ?? parseLogLevel(readEnv("DAAPI_LOG"), "DAAPI_LOG", false);
    const logger = options.logger ?? (level !== undefined && level < LOG_LEVELS.off ? (console as Logger) : undefined);
    const { baseURL: _alias, ...input } = options;
    if (rawBaseUrl !== undefined) input.baseUrl = rawBaseUrl;
    this.#input = input;
    this.#o = {
      apiKey,
      baseUrl,
      endUserId: options.endUserId ?? undefined,
      timeout: nonNegativeInt("timeout", options.timeout ?? DEFAULT_TIMEOUT_MS),
      totalTimeout: options.totalTimeout === undefined ? undefined : nonNegativeInt("totalTimeout", options.totalTimeout),
      maxRetries: Math.floor(nonNegativeInt("maxRetries", options.maxRetries ?? DEFAULT_MAX_RETRIES)),
      serverTimeout: options.serverTimeout,
      defaultHeaders: { ...options.defaultHeaders },
      fetch: fetchImpl,
      fetchOptions: options.fetchOptions,
      logger,
      logLevel: level ?? LOG_LEVELS.debug,
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

  /** Total time budget of one call in milliseconds, if set. */
  get totalTimeout(): number | undefined {
    return this.#o.totalTimeout;
  }

  /** A copy of this client with some options replaced. Shares the same `fetch` transport. */
  withOptions(options: ClientOptions): this {
    const ctor = this.constructor as new (o: ClientOptions) => this;
    const base: ClientOptions = { ...this.#input, apiKey: this.#o.apiKey, fetch: this.#o.fetch };
    if (options.baseURL !== undefined && options.baseUrl === undefined) delete base.baseUrl;
    return new ctor({ ...base, ...options });
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
    try {
      ({ input, options } = conductorAlias(op, input, options));
    } catch (err) {
      return new APIPromise<T>(Promise.reject(err));
    }
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
    try {
      ({ input, options } = conductorAlias(op, input, options));
    } catch (err) {
      return new PagePromise<T>(() => new APIPromise<CursorPage<T>>(Promise.reject(err)));
    }
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
    const totalOption = options.totalTimeout ?? this.#o.totalTimeout;
    const total = totalOption === undefined ? undefined : nonNegativeInt("totalTimeout", totalOption);
    const deadline = total === undefined ? undefined : started + total;
    const maxRetries = Math.floor(nonNegativeInt("maxRetries", options.maxRetries ?? this.#o.maxRetries));
    const fetchOptions = options.fetchOptions || this.#o.fetchOptions ? { ...this.#o.fetchOptions, ...options.fetchOptions } : undefined;
    const send: SendOptions = { timeout, maxRetries, signal: options.signal, deadline, fetchOptions };
    const headers = this.#baseHeaders(mode === "text" ? "application/xml" : "application/json", options.headers);
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
    const attempt = await this.#send(op.method, url, input.path, headers, body, send);

    if ("pendingRequestId" in attempt) {
      if (mode === "async") throw attempt.error;
      // 504 QBD_REQUEST_TIMEOUT after the request was sent: never resubmit; long-poll the request until the call's deadline.
      const done = await this.#waitFor<unknown>(attempt.pendingRequestId, deadline ?? started + timeout, null, send);
      return { response: done.response, read: async () => done.value };
    }
    const { response, release } = attempt;
    const read = async (): Promise<unknown> => {
      try {
        if (mode === "text") return await this.#readText(response, timeout);
        if (mode === "json") return await this.#readJson(response, timeout);
        if (response.status !== 202) throw new DaapiError(`${op.id}: expected 202 Accepted in async mode, got ${response.status}`);
        const request = (await this.#readJson(response, timeout)) as Request;
        return new RequestHandle<unknown>(request, this.#handleBackend<unknown>(total ?? timeout, send));
      } finally {
        release();
      }
    };
    return { response, read };
  }

  /** Default headers, then per-call headers, then the headers the SDK manages. */
  #baseHeaders(accept: string, extra?: HeaderMap): Headers {
    const headers = new Headers();
    applyHeaders(headers, this.#o.defaultHeaders);
    applyHeaders(headers, extra);
    for (const name of MANAGED_HEADERS) headers.delete(name);
    headers.set("Authorization", `Bearer ${this.#o.apiKey}`);
    headers.set("Accept", accept);
    if (!isBrowser()) headers.set("User-Agent", `desktopaccountingapi-node/${VERSION}`);
    return headers;
  }

  #log(level: "debug" | "info" | "warn" | "error", message: string, fields: Record<string, unknown>): void {
    const logger = this.#o.logger;
    if (!logger || LOG_LEVELS[level] < this.#o.logLevel) return;
    try {
      const fn = logger[level] ?? (level === "error" ? logger.warn : logger.debug);
      fn.call(logger, message, fields);
    } catch {
      // A failing logger never breaks a request.
    }
  }

  /** Sends one logical request with retries. Returns a 2xx response (body unread) or a pending 504. */
  async #send(
    method: string,
    url: string,
    path: string,
    headers: Headers,
    body: string | undefined,
    opts: SendOptions,
  ): Promise<Attempt> {
    /** Waits before the next attempt. False when the total timeout would end first. */
    const backoff = async (delay: number): Promise<boolean> => {
      if (opts.deadline !== undefined && Date.now() + delay >= opts.deadline) return false;
      try {
        await sleep(delay, opts.signal);
      } catch (err) {
        throw new ApiUserAbortError("Request aborted by the caller", { cause: err });
      }
      return true;
    };
    for (let attempt = 0; ; attempt++) {
      const remaining = opts.deadline === undefined ? Infinity : opts.deadline - Date.now();
      if (remaining <= 0) throw new ApiTimeoutError(`The call's total timeout ended before a response arrived (${method} ${path})`);
      const attemptMs = Math.min(opts.timeout, remaining);
      const timer = attemptTimer(attemptMs);
      const timeoutSignal = timer.signal;
      const signal = opts.signal ? anySignal(opts.signal, timeoutSignal) : timeoutSignal;
      const t0 = Date.now();
      let response: Response;
      try {
        const init: RequestInit = { ...opts.fetchOptions, method, headers, signal };
        if (body !== undefined) init.body = body;
        else delete init.body;
        response = await this.#o.fetch(url, init);
      } catch (err) {
        timer.clear();
        if (opts.signal?.aborted) throw new ApiUserAbortError("Request aborted by the caller", { cause: err });
        const failure = timeoutSignal.aborted
          ? new ApiTimeoutError(`Request timed out after ${Math.round(attemptMs)} ms (${method} ${path})`, { cause: err })
          : new ApiConnectionError(`Connection error (${method} ${path}): ${err instanceof Error ? err.message : String(err)}`, { cause: err });
        this.#log("warn", "daapi request failed without a response", { method, path, attempt, durationMs: Date.now() - t0, error: failure.message });
        if (attempt < opts.maxRetries && (await backoff(retryDelay(attempt, null)))) continue;
        throw failure;
      }
      const requestId = response.headers.get("daapi-request-id");
      this.#log("debug", "daapi response", { method, path, status: response.status, requestId, attempt, durationMs: Date.now() - t0 });
      if (response.ok) {
        timer.unref();
        return { response, release: timer.clear };
      }

      let text: string;
      try {
        text = await response.text();
      } catch (err) {
        timer.clear();
        if (opts.signal?.aborted) throw new ApiUserAbortError("Request aborted by the caller", { cause: err });
        const failure = new ApiConnectionError(`Connection lost while reading the error response (${method} ${path})`, { cause: err });
        if (attempt < opts.maxRetries && (await backoff(retryDelay(attempt, null)))) continue;
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
        this.#log("warn", "daapi retrying", { method, path, status: response.status, code: error.code, requestId, attempt, delayMs: delay });
        if (await backoff(delay)) continue;
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
  async #retrieveRequest(id: string, waitSeconds: number | undefined, opts: SendOptions): Promise<{ request: Request; response: Response }> {
    const path = `/v1/requests/${encodeURIComponent(id)}`;
    const timeout = ((waitSeconds ?? 0) + 10) * 1000;
    const url = this.#o.baseUrl + path + buildQuery({ waitSeconds });
    const attempt = await this.#send("GET", url, path, this.#baseHeaders("application/json"), undefined, { ...opts, timeout, deadline: undefined });
    if ("pendingRequestId" in attempt) throw attempt.error;
    try {
      const request = (await this.#readJson(attempt.response, timeout)) as Request;
      return { request, response: attempt.response };
    } finally {
      attempt.release();
    }
  }

  /** Long-polls a request until it settles or `deadline` (epoch ms) passes. */
  async #waitFor<T>(id: string, deadline: number, last: Request | null, opts: SendOptions): Promise<{ value: T; response: Response }> {
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

  #handleBackend<R>(timeout: number, opts: SendOptions): RequestHandleBackend<R> {
    return {
      defaultTimeout: timeout,
      retrieve: async (id) => (await this.#retrieveRequest(id, undefined, opts)).request,
      waitFor: async (id, deadline, last) => (await this.#waitFor<R>(id, deadline, last, opts)).value,
      settle: (request) => settleRequest<R>(request),
    };
  }
}

/**
 * Resolves Conductor's `conductorEndUserId` (a call option, or a key in the params of a QuickBooks
 * Desktop operation) into `endUserId`, and removes it from the query or body. Throws when the end
 * user is given under several names with different values.
 */
function conductorAlias<O extends RequestOptions>(op: OperationSpec, input: CallInput, options: O): { input: CallInput; options: O } {
  const fromParams = (value: unknown): string | null | undefined => {
    if (!op.endUser || value === null || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, "conductorEndUserId")) return undefined;
    const v = (value as { conductorEndUserId?: unknown }).conductorEndUserId;
    if (v !== undefined && typeof v !== "string") throw new DaapiError(`${op.id}: conductorEndUserId must be a string`);
    return v ?? null;
  };
  const inQuery = fromParams(input.query);
  const inBody = fromParams(input.body);
  if (inQuery === undefined && inBody === undefined && options.conductorEndUserId === undefined) return { input, options };
  const strip = (value: unknown): object => {
    const { conductorEndUserId: _drop, ...rest } = value as { conductorEndUserId?: unknown };
    return rest;
  };
  const next: CallInput = { ...input };
  if (inQuery !== undefined) next.query = strip(input.query);
  if (inBody !== undefined) next.body = strip(input.body);
  const given = [options.endUserId, options.conductorEndUserId, inQuery, inBody].filter((v): v is string => typeof v === "string");
  if (new Set(given).size > 1) {
    throw new DaapiError(`${op.id}: the end user is given twice with different values (endUserId and conductorEndUserId); pass only one.`);
  }
  const { conductorEndUserId: _alias, ...rest } = options;
  const resolved = rest as O;
  if (given[0] !== undefined) resolved.endUserId = given[0];
  return { input: next, options: resolved };
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
