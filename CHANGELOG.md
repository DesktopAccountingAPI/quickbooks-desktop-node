# Changelog

## 0.2.0

Easier porting from Conductor's `conductor-node`; see "Porting from Conductor" in the README.

- `conductorEndUserId` is accepted in the call options and inside the params of QuickBooks Desktop operations, as an alias of `endUserId`. Both names with different values throw `DaapiError`.
- Conductor's error names: `ConductorError`, `APIError`, `APIConnectionError`, `APIConnectionTimeoutError`, `APIUserAbortError` and `PermissionDeniedError`, plus the status classes `BadRequestError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError` and `InternalServerError`, which match by HTTP status in `instanceof`. Every error class is also a static property of `DesktopAccountingApi`. `err.error.error` is the error object, as in Conductor.
- `ApiUserAbortError` (a `DaapiError`) when your `signal` aborts a call.
- Client options `baseURL` (alias of `baseUrl`), `defaultHeaders`, `fetchOptions`, `logLevel` (and `DAAPI_LOG`) and `totalTimeout`; per-call `headers`, `fetchOptions`, `totalTimeout` and `conductorEndUserId`. A base URL ending in `/v1` no longer produces `/v1/v1/...`.
- Pagination requests the next page only when the iteration needs it, so a loop that stops early sends no extra QuickBooks query. While iterating items, a page held for more than 2 seconds makes the SDK request the next page in the background; `listAll()` always reads ahead.

## 0.1.0

First release of `@desktopaccountingapi/quickbooks-desktop`, generated from API contract sha256 `6f5ac28d7c33` (API version 1.0.0, 275 operations).

- `DesktopAccountingApi` client with the full resource tree: `client.qbd.*` (QuickBooks Desktop), `client.endUsers`, `client.authSessions`, `client.requests`.
- Typed request and response models; money as decimal strings; open enums pass unknown values through.
- Local API key validation, end-user scoping (`forEndUser`), per-call options.
- Idempotency keys on every write, reused across retries; retries on network errors, 429 and retryable 5xx with `Retry-After`.
- Long-polling of requests that are still running after `504 QBD_REQUEST_TIMEOUT`, with `RequestPendingError` at the client timeout.
- Async mode (`{ async: true }`) returning a `RequestHandle`.
- Cursor pagination with one page of read-ahead and `CursorExpiredError` progress fields.
- Typed errors for every error type, `ErrorCode` and `ErrorType` constants.
- Webhook verification (Standard Webhooks) on WebCrypto.
- Raw response access through `.withResponse()` and `.asResponse()`.
- ES module and CommonJS builds with type declarations; Node.js 20 or later; no runtime dependencies.
