// Error classes. Hand-written runtime; generation copies this file verbatim.
//
// DaapiError                 client-side problems (missing or malformed key, missing end user, bad arguments)
// ├─ ApiError                any non-2xx API response (or a failed request resource)
// │  ├─ InvalidRequestError  ── CursorExpiredError
// │  ├─ AuthenticationError, PermissionError, BillingError, RateLimitError
// │  ├─ IntegrationConnectionError, IntegrationError, OutcomeUnknownError, InternalError
// ├─ ApiConnectionError      no response (network failure) ── ApiTimeoutError
// ├─ ApiUserAbortError       the caller's AbortSignal fired
// ├─ RequestPendingError     the request is still running when the client timeout ends
// └─ WebhookVerificationError
//
// Conductor-compatible names (conductor-node): ConductorError = DaapiError, APIError = ApiError,
// APIConnectionError, APIConnectionTimeoutError, APIUserAbortError, PermissionDeniedError, and the
// status-matching classes BadRequestError (400), NotFoundError (404), ConflictError (409),
// UnprocessableEntityError (422) and InternalServerError (5xx). The status classes match any
// ApiError with that HTTP status in `instanceof` checks; the thrown class stays the one for the
// error's `type`.

import type { ErrorCode, ErrorFix, ErrorType, Request } from "../generated/models.ts";

/** Base class of every error the SDK raises. Thrown directly for client-side problems. */
export class DaapiError extends Error {
  /**
   * The `Idempotency-Key` the SDK sent for the write that raised this error (generated once per
   * call unless you passed `idempotencyKey`), else null. Resend a write whose outcome is
   * `pending` or `unknown`, or that failed without a response, only with this key: the API then
   * returns the original request instead of writing twice.
   */
  idempotencyKey: string | null = null;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The error object of an API error response (`{ "error": { ... } }`) or of a failed request resource. */
export interface ErrorBody {
  /**
   * The same error object again (`err.error.error === err.error`), so code written for
   * `conductor-node`, which unwraps `err.error.error`, keeps working. Not serialized.
   */
  readonly error?: ErrorBody;
  type?: string | null;
  code?: string | null;
  message?: string | null;
  userFacingMessage?: string | null;
  httpStatusCode?: number | null;
  integrationCode?: string | null;
  requestId?: string | null;
  cause?: string | null;
  fixes?: ErrorFix[] | null;
  docsUrl?: string | null;
  retryable?: boolean | null;
  outcome?: string | null;
  param?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * The API answered with an error. Every field of the error object is exposed directly.
 * The error object's `cause` is exposed as `errorCause`, because `Error.cause` is the
 * JavaScript error chain.
 */
export class ApiError extends DaapiError {
  /** HTTP status of the response, or `httpStatusCode` of a failed request resource (may be null there). */
  readonly status: number | null;
  /** Error type, for example `INTEGRATION_CONNECTION_ERROR`. Null when the response was not a JSON error. */
  readonly type: ErrorType | null;
  /** Stable catalog code, for example `QBD_MODAL_DIALOG_OPEN`. Compare with `ErrorCode.*`. */
  readonly code: ErrorCode | null;
  /** Message that is safe to show to the end user. */
  readonly userFacingMessage: string | null;
  readonly httpStatusCode: number | null;
  /** Native code: qbXML statusCode, HRESULT or QBWC code. */
  readonly integrationCode: string | null;
  /** `req_...` ID from the error body, falling back to the `Daapi-Request-Id` header. */
  readonly requestId: string | null;
  /** Why the error happens (the error object's `cause` field). */
  readonly errorCause: string | null;
  /** What the developer, the end user or support can do. */
  readonly fixes: ErrorFix[];
  readonly docsUrl: string | null;
  /** Repeating the identical request can succeed without changes. */
  readonly retryable: boolean | null;
  /** `applied`, `not_applied`, `pending`, `unknown` or `not_applicable`. */
  readonly outcome: string | null;
  /** Request field path for validation errors, for example `lines[2].amount`. */
  readonly param: string | null;
  /** Code-specific details. */
  readonly details: Record<string, unknown>;
  /** Response headers. Empty for errors built from a request resource. */
  readonly headers: Headers;
  /**
   * The error object as received, or undefined when the body was not a JSON error.
   * `err.error.error` is the same object, as in `conductor-node`.
   */
  readonly error: ErrorBody | undefined;

  constructor(status: number | null, body: ErrorBody | undefined, headers: Headers = new Headers(), message?: string) {
    super(message ?? body?.message ?? `HTTP ${status ?? "error"}`);
    this.status = status;
    this.error = body === undefined ? undefined : selfAliased(body);
    this.headers = headers;
    this.type = body?.type ?? null;
    this.code = body?.code ?? null;
    this.userFacingMessage = body?.userFacingMessage ?? null;
    this.httpStatusCode = body?.httpStatusCode ?? null;
    this.integrationCode = body?.integrationCode ?? null;
    this.requestId = body?.requestId ?? headers.get("daapi-request-id");
    this.errorCause = body?.cause ?? null;
    this.fixes = body?.fixes ?? [];
    this.docsUrl = body?.docsUrl ?? null;
    this.retryable = body?.retryable ?? null;
    this.outcome = body?.outcome ?? null;
    this.param = body?.param ?? null;
    this.details = body?.details ?? {};
  }
}

/** Copy of an error object whose non-enumerable `error` property points to itself. */
function selfAliased(body: ErrorBody): ErrorBody {
  if (body.error === body) return body;
  const copy: ErrorBody = { ...body };
  Object.defineProperty(copy, "error", { value: copy, enumerable: false });
  return copy;
}

export class InvalidRequestError extends ApiError {}
export class AuthenticationError extends ApiError {}
export class PermissionError extends ApiError {}
export class BillingError extends ApiError {}
export class RateLimitError extends ApiError {}
/** Problem in the end user's environment (QuickBooks closed, dialog open, connector offline). */
export class IntegrationConnectionError extends ApiError {}
/** QuickBooks rejected the request. */
export class IntegrationError extends ApiError {}
/** A write reached QuickBooks but its result could not be confirmed. The SDK never retries it. */
export class OutcomeUnknownError extends ApiError {}
export class InternalError extends ApiError {}

/** Progress of an auto-paginating iteration when its cursor expired. */
export interface CursorProgress {
  /** Items handed to the caller before the error. */
  itemsYielded: number;
  /** Pages the server served (`details.pagesServed`), else pages delivered to the caller. */
  pagesServed: number;
  /** `id` of the last item handed to the caller. */
  lastId: string | null;
  /** `updatedAt` of the last item handed to the caller, exactly as received. */
  lastUpdatedAt: string | null;
}

/**
 * `410 CURSOR_EXPIRED`: the QuickBooks iterator behind a cursor ended. The SDK never restarts the
 * query on its own, because restarting can duplicate or skip records that changed meanwhile.
 * To resume, start a new list call with `updatedAfter: err.lastUpdatedAt` (and your original
 * filters) and skip IDs you already processed.
 */
export class CursorExpiredError extends InvalidRequestError {
  readonly itemsYielded: number;
  readonly pagesServed: number;
  readonly lastId: string | null;
  readonly lastUpdatedAt: string | null;
  /** `details.reason`: `idle_timeout`, `session_ended`, `quickbooks_restarted` or `evicted`. */
  readonly reason: string | null;

  constructor(status: number | null, body: ErrorBody | undefined, headers?: Headers, progress?: Partial<CursorProgress>) {
    super(status, body, headers);
    const served = body?.details?.["pagesServed"];
    this.itemsYielded = progress?.itemsYielded ?? 0;
    this.pagesServed = typeof served === "number" ? served : (progress?.pagesServed ?? 0);
    this.lastId = progress?.lastId ?? null;
    this.lastUpdatedAt = progress?.lastUpdatedAt ?? null;
    const reason = body?.details?.["reason"];
    this.reason = typeof reason === "string" ? reason : null;
  }
}

/** No response arrived: connection failure, reset, dropped connection or client-side timeout. */
export class ApiConnectionError extends DaapiError {}

/** The client-side timeout (per attempt or the call's total timeout) ended before a response arrived. */
export class ApiTimeoutError extends ApiConnectionError {}

/** The caller aborted the call through its `signal` option. */
export class ApiUserAbortError extends DaapiError {}

/** HTTP status of an API error: the response status, else the error object's `httpStatusCode`. */
function statusOf(value: unknown): number | null {
  if (!(value instanceof ApiError)) return null;
  return value.status ?? value.httpStatusCode;
}

/** `instanceof` matches any {@link ApiError} with HTTP status 400 (Conductor's `BadRequestError`). */
export class BadRequestError extends ApiError {
  static override [Symbol.hasInstance](value: unknown): boolean {
    return statusOf(value) === 400;
  }
}

/** `instanceof` matches any {@link ApiError} with HTTP status 404 (Conductor's `NotFoundError`). */
export class NotFoundError extends ApiError {
  static override [Symbol.hasInstance](value: unknown): boolean {
    return statusOf(value) === 404;
  }
}

/** `instanceof` matches any {@link ApiError} with HTTP status 409 (Conductor's `ConflictError`). */
export class ConflictError extends ApiError {
  static override [Symbol.hasInstance](value: unknown): boolean {
    return statusOf(value) === 409;
  }
}

/** `instanceof` matches any {@link ApiError} with HTTP status 422 (Conductor's `UnprocessableEntityError`). */
export class UnprocessableEntityError extends ApiError {
  static override [Symbol.hasInstance](value: unknown): boolean {
    return statusOf(value) === 422;
  }
}

/** `instanceof` matches any {@link ApiError} with an HTTP status of 500 or more (Conductor's `InternalServerError`). */
export class InternalServerError extends ApiError {
  static override [Symbol.hasInstance](value: unknown): boolean {
    const status = statusOf(value);
    return status !== null && status >= 500;
  }
}

/**
 * The request is still running in QuickBooks when the call stopped waiting for it
 * (`504 QBD_REQUEST_TIMEOUT` followed by long-polling, or `RequestHandle.wait()`). It was not
 * resubmitted. The SDK raises this error, never the error of a failed poll, whenever it cannot
 * learn the request's final state: a poll that failed with `429`, `5xx`, `404` or a network error
 * says nothing about the write. Never resend the write with a new key; check it later with
 * `client.requests.retrieve(err.requestId, { waitSeconds: 60 })`, or resend it with
 * `err.idempotencyKey`, which returns the original request.
 */
export class RequestPendingError extends DaapiError {
  readonly requestId: string;
  /** The last request snapshot seen while polling, if any. */
  readonly request: Request | null;
  /** The `504 QBD_REQUEST_TIMEOUT` error (with `details.diagnosis`) that started the wait, if any. Also `cause`. */
  readonly timeoutError: ApiError | null;
  /** The error of the poll that failed, if waiting ended because a poll failed rather than at the deadline. */
  readonly pollError: DaapiError | null;

  constructor(
    requestId: string,
    request: Request | null,
    options: { timeoutError?: ApiError | null; pollError?: DaapiError | null; idempotencyKey?: string | null } = {},
  ) {
    const why = options.pollError ? `checking it failed (${options.pollError.message})` : "the call's time budget ended";
    super(
      `Request ${requestId} is still ${request?.status ?? "pending"}: ${why}. It was not resubmitted; retrieve it with client.requests.retrieve("${requestId}")` +
        (options.idempotencyKey ? ` or resend it only with Idempotency-Key ${options.idempotencyKey}.` : "."),
      { cause: options.timeoutError ?? options.pollError ?? undefined },
    );
    this.requestId = requestId;
    this.request = request;
    this.timeoutError = options.timeoutError ?? null;
    this.pollError = options.pollError ?? null;
    this.idempotencyKey = options.idempotencyKey ?? null;
  }
}

/** A webhook failed signature, timestamp or payload verification. */
export class WebhookVerificationError extends DaapiError {}

type ApiErrorClass = new (status: number | null, body: ErrorBody | undefined, headers?: Headers) => ApiError;

const BY_TYPE: Record<string, ApiErrorClass> = {
  INVALID_REQUEST_ERROR: InvalidRequestError,
  AUTHENTICATION_ERROR: AuthenticationError,
  PERMISSION_ERROR: PermissionError,
  BILLING_ERROR: BillingError,
  RATE_LIMIT_ERROR: RateLimitError,
  INTEGRATION_CONNECTION_ERROR: IntegrationConnectionError,
  INTEGRATION_ERROR: IntegrationError,
  OUTCOME_UNKNOWN_ERROR: OutcomeUnknownError,
  INTERNAL_ERROR: InternalError,
};

/** Builds the typed error for an error object. Unknown types map to the base `ApiError`. */
export function makeApiError(status: number | null, body: ErrorBody | undefined, headers?: Headers, message?: string): ApiError {
  if (body?.code === "CURSOR_EXPIRED" && (body.type === undefined || body.type === null || body.type === "INVALID_REQUEST_ERROR")) {
    return new CursorExpiredError(status, body, headers);
  }
  const ctor = (body?.type && Object.hasOwn(BY_TYPE, body.type) ? BY_TYPE[body.type] : undefined) ?? ApiError;
  if (ctor === ApiError) return new ApiError(status, body, headers, message);
  return new ctor(status, body, headers);
}
