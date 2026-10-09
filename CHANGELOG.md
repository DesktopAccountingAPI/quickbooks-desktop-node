# Changelog

## Unreleased

## 0.5.4 (2026-10-09)

- New error code `ROUTE_NOT_FOUND` (`ErrorCode.ROUTE_NOT_FOUND`): a `404` for a method and path the API has no endpoint for, such as the API root. These answered `RESOURCE_MISSING`, whose cause describes a missing ID.

## 0.5.3 (2026-10-09)

- Releases publish to npm through trusted publishing (GitHub OIDC) with provenance; no npm token is used. The publish script checks that npm is new enough.

## 0.5.2 (2026-10-09)

- Released in lockstep with the other Desktop Accounting API packages; no entries for this package.

## 0.5.1 (2026-10-09)

- `withResponse().requestId` after a long-polled call is the ID of the request that produced the result (the 504's `details.requestId`), which `client.requests.retrieve()` finds. It was the last poll's ID, which answers `404`. The poll's own ID stays in `response.headers.get("daapi-request-id")`.
- `QBD_OBJECT_IN_USE` errors (QuickBooks status 3175 or 3176, a record open for editing or locked by another user) carry `details.diagnosis` with the new diagnosis cause `record_in_use`: close the edit window in QuickBooks, then retry. The cause's `details.lockedBy` names the user when QuickBooks does. The request's `diagnosis` has the same cause.

## 0.5.0 (2026-10-09)

- The webhook `now` option is documented as a function returning Unix seconds (`() => Math.floor(Date.now() / 1000)`), not `Date.now()` milliseconds; milliseconds make every delivery look too old.
- The README documents resuming a list from a stored `nextCursor` (`list({ cursor: savedCursor })`); the cross-language conformance suite now covers it, and reads that hit the server timeout (`504 QBD_REQUEST_TIMEOUT`, outcome `not_applicable`), which the SDK already long-polled.
- Response prices, rates and percentages (for example `QbdInvoiceLine.rate`, `QbdSalesOrPurchaseDetail.price`, `ratePercent`) carry the same decimal pattern as their inputs and as amounts; their docs now say so. TypeScript types are unchanged (`string`).

## 0.4.0 (2026-10-08)

- Warning code `QBD_PERSONAL_DATA_WITHHELD`: employee responses carry one warning per `ssn` that QuickBooks withheld because the integration may not read personal data (`ssn` stays `null`; `Daapi-Warnings` counts the warnings).
- `personalDataAccess` on an end user's integration connections: `allowed`, `denied` or `unknown`.
- A failed passthrough's error `details.requests` lists the status code, severity and message of every qbXML message, so a message skipped by `stopOnError` is visible.

## 0.3.0 (2026-10-08)

- **Breaking:** `qbd.reports.budgetSummary()` now requires `fiscalYear` in its params (TypeScript type `ReportBudgetSummaryParams.fiscalYear: number`). The API always rejected a budget report without it (`400 INVALID_PARAMETER`, `param: "fiscalYear"`), so no working call changes behavior; code that omitted it no longer compiles. Pass the fiscal year, for example `{ reportType: "profit_and_loss_budget_overview", fiscalYear: 2026 }`.
- `WebhookEventType.CONNECTION_COMPANY_FILE_REMARKED` (`connection.company_file_remarked`): the marker that identifies a connection's company file was created, written back after the file lost it (for example a restored backup) or adopted from the file; `data.reason` is `marker_created`, `marker_restored` or `marker_adopted`.
- After `504 QBD_REQUEST_TIMEOUT`, any failure while waiting for the request (a poll answered `429`, `5xx` or `404`, a network error, a timeout or an abort) throws `RequestPendingError` with `requestId`, `timeoutError` (the 504, also `cause`), `pollError` and `idempotencyKey`. It never surfaces the poll's own retryable error, which read as "safe to resend" and could duplicate a write. `RequestHandle.wait()` follows the same rule.
- Waiting for a pending request stays inside the call's deadline (`totalTimeout`, else `timeout`): each poll, retry and backoff is cut off at the deadline.
- `idempotencyKey` on every error raised for a write (generated or yours), on `withResponse()` results and on `RequestHandle`.
- A request that succeeded in QuickBooks but whose answer the API could not map (`request.error`, for example `QBD_RESPONSE_UNREADABLE` with outcome `applied`) throws that typed error instead of resolving to `null`.
- Errors thrown by `RequestHandle.wait()` and `result()` (the request's own `failed`, `canceled` or `outcome_unknown` error, a result error, or `RequestPendingError`) carry the handle's `idempotencyKey`.
- A poll answer that arrives after the deadline is not returned, even a settled one; the call throws `RequestPendingError` with that snapshot.

## 0.2.1 (2026-10-07)

Generated from API contract sha256 `b5774d24bc81`. Documentation only; no API surface change.

- `updatedAt` and `revisionNumber` descriptions say that QuickBooks changes them at most once per second: an incremental sync should overlap `updatedAfter` and deduplicate by `id` and `revisionNumber`.
- The fixes for status 3261 (`QBD_INSUFFICIENT_PERMISSION`) name the personal-data checkbox in QuickBooks and what to do when it is gray: send the end user a new setup link and choose "Enable payroll access".
- Item sites document what QuickBooks returns without Advanced Inventory: an empty list, and `404 QBD_OBJECT_NOT_FOUND` from retrieve, rather than an error.

## 0.2.0 (2026-10-07)

Easier porting from Conductor's `conductor-node`; see "Porting from Conductor" in the README.

- `conductorEndUserId` is accepted in the call options and inside the params of QuickBooks Desktop operations, as an alias of `endUserId`. Both names with different values throw `DaapiError`.
- Conductor's error names: `ConductorError`, `APIError`, `APIConnectionError`, `APIConnectionTimeoutError`, `APIUserAbortError` and `PermissionDeniedError`, plus the status classes `BadRequestError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError` and `InternalServerError`, which match by HTTP status in `instanceof`. Every error class is also a static property of `DesktopAccountingApi`. `err.error.error` is the error object, as in Conductor.
- `ApiUserAbortError` (a `DaapiError`) when your `signal` aborts a call.
- Client options `baseURL` (alias of `baseUrl`), `defaultHeaders`, `fetchOptions`, `logLevel` (and `DAAPI_LOG`) and `totalTimeout`; per-call `headers`, `fetchOptions`, `totalTimeout` and `conductorEndUserId`. A base URL ending in `/v1` no longer produces `/v1/v1/...`.
- Pagination requests the next page only when the iteration needs it, so a loop that stops early sends no extra QuickBooks query. While iterating items, a page held for more than 2 seconds makes the SDK request the next page in the background; `listAll()` always reads ahead.

## 0.1.1 (2026-10-06)

Generated from API contract sha256 `1cc3058cecb5`, the same contract as 0.1.0. No API surface change.

- The README is rewritten: install with exact package coordinates, authentication, a quickstart, common workflows, errors, async requests and webhooks, versioning and support. Every code sample in it is compiled against the package before release, and the quickstart runs against a mock server.

## 0.1.0 (2026-10-06)

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
