# Changelog

## 0.1.0

First release of `@desktopaccountingapi/quickbooks-desktop`, generated from API contract sha256 `1cc3058cecb5` (API version 1.0.0, 275 operations).

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
