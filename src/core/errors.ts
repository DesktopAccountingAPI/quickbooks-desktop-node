// Error classes. Hand-written runtime; generation copies this file verbatim.
//
// DaapiError                 client-side problems (missing or malformed key, missing end user, bad arguments)
// ├─ ApiError                any non-2xx API response (or a failed request resource)
// │  ├─ InvalidRequestError  ── CursorExpiredError
// │  ├─ AuthenticationError, PermissionError, BillingError, RateLimitError
// │  ├─ IntegrationConnectionError, IntegrationError, OutcomeUnknownError, InternalError
// ├─ ApiConnectionError      no response (network failure) ── ApiTimeoutError
// ├─ RequestPendingError     the request is still running when the client timeout ends
// └─ WebhookVerificationError

import type { ErrorCode, ErrorFix, ErrorType, Request } from "../generated/models.ts";

/** Base class of every error the SDK raises. Thrown directly for client-side problems. */
export class DaapiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The error object of an API error response (`{ "error": { ... } }`) or of a failed request resource. */
export interface ErrorBody {
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
  /** The error object as received, or undefined when the body was not a JSON error. */
  readonly error: ErrorBody | undefined;

  constructor(status: number | null, body: ErrorBody | undefined, headers: Headers = new Headers(), message?: string) {
    super(message ?? body?.message ?? `HTTP ${status ?? "error"}`);
    this.status = status;
    this.error = body;
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

/** The client-side timeout ended before a response arrived. */
export class ApiTimeoutError extends ApiConnectionError {}

/**
 * The request is still running in QuickBooks when the call's client-side timeout ended
 * (`504 QBD_REQUEST_TIMEOUT` followed by long-polling). It was not resubmitted. Check it later with
 * `client.requests.retrieve(err.requestId)` or wait on it with `client.requests.retrieve(id, { waitSeconds })`.
 */
export class RequestPendingError extends DaapiError {
  readonly requestId: string;
  /** The last request snapshot seen while polling, if any. */
  readonly request: Request | null;

  constructor(requestId: string, request: Request | null) {
    super(`Request ${requestId} is still ${request?.status ?? "pending"} after the client timeout; it was not resubmitted.`);
    this.requestId = requestId;
    this.request = request;
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
