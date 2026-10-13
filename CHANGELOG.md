# Changelog

## Unreleased

## 0.8.0 (2026-10-13)

- A read that was sent, interrupted (for example when QuickBooks closed unexpectedly, HRESULT 0x80040402) and queued for its automatic retry now ends with `QBD_READ_INTERRUPTED` (502, `details.reason`, `details.retry`, `details.firstSentAt`) when the retry is not sent in time. It answered `504 REQUEST_TIMEOUT_NOT_SENT` with `sentAt: null`. A request's `sentAt` is no longer reset to null by the retry.
- New diagnosis cause `quickbooks_closed_unexpectedly`: QuickBooks returned an error instead of a result (0x80040402 when it crashed) and the Web Connector, still running with a stuck update lock, has not checked in since. It ranks above `web_connector_closed`. `diagnosis.connector.lastSeenAt` now counts the calls of a session that ended, not only the last check-in.
- **Breaking:** `qbd.unitOfMeasureSets.delete` is removed. QuickBooks answered status 1000 and Intuit documents that a unit of measure set cannot be deleted; `DELETE /v1/quickbooks-desktop/unit-of-measure-sets/{id}` now answers `422 QBD_OPERATION_UNSUPPORTED` with alternatives (make the set inactive in QuickBooks Desktop) and sends nothing.
- **Breaking:** `qbd.fixedAssetItems.create` requires `assetAccountId`. QuickBooks rejects a fixed asset item without an asset account (status 3180), although the qbXML schema marks it optional.
- Creating or updating a public custom field definition (`ownerId` `"0"`) accepts only `customer`, `vendor`, `employee` and `item` in `assignToObjects` and `removeFromObjects`; other values answer `400 INVALID_PARAMETER` before anything is sent. QuickBooks refused them with status 3351.
- A QuickBooks status 3231 for a request that was alone in its message set carries `details.onlyRequestInMessageSet: true` and says no earlier request caused it. Lead requests and class merges have documented incompatibilities (status 3231 and 3500 on QuickBooks Enterprise 24).
- **Breaking:** a list-object delete (`qbd.<list>.delete`, QuickBooks `ListDel`) no longer always answers `deleted: true`. QuickBooks Desktop can accept the delete and keep the object, inactive and readable by its ID (Enterprise 24 did this in every test). The API reads the object back in the same request: `deleted` is true only when QuickBooks no longer returns it; otherwise `deleted` is false, `deactivated` is true when it is now inactive, and `isActive` holds its state. The result types gain `deactivated` and `isActive`.
- `QBD_REQUEST_ERROR` on a read (for example a payroll report QuickBooks refused with status 3262) has the end-user text "QuickBooks Desktop could not provide this information." It said "did not accept this change". `errors.json` documents `readUserFacingMessage`.
- **Breaking:** custom field definition update and delete take the definition name as the path parameter `definitionName` (it was `name`).
- **Breaking:** one fallback type per union. An item or entity of a kind this SDK does not model, whether QuickBooks returned a kind the API does not model (`objectType` `qbd_unrecognized_item`) or the API added a kind after this SDK version, is an `UnrecognizedItem` / `UnrecognizedEntity` with the shared fields plus `qbxmlElement` and `fields`; its `objectType` is a plain string. `UnknownItem` and `UnknownEntity` are gone.
- **Breaking:** identical enums share one type, used on requests and responses alike, for example `AssignToObject` (also `CustomFieldDefinition.assignToObjects`), `LeadStatus`, `ToDoType`, `ToDoPriority`, `ClearedStatus`, `BillingStatus`, `CustomFieldOperation`, `TransactionKind` and `Outcome`. The per-operation names (`LeadCreateInputStatus`, `CustomFieldDefinitionCreateInputAssignToObject`, `RequestListParamsStatu`, ...) are gone.
- **Breaking:** type renames: `LeadContactsCreateInput` / `LeadContactsUpdateInput` / `LeadContacts` are `LeadContactCreateInput` / `LeadContactUpdateInput` / `LeadContact`; `DeletedCustomFieldDefinition` is `CustomFieldDefinitionDeleted`; the result of `transactions.updateClearedStatus` is `TransactionClearedStatus`, whose `clearedStatus` is a `ClearedStatus`.
- **Breaking:** to-do list parameters lose the name filters (a to-do has no name), and `payrollWageItems.list` no longer takes `cursor` (the list is never paginated; any cursor was refused).
- `IntegrationConnection` (an end user's `integrationConnections`) carries `endUserId`, `disabled` and `setupCompletedAt`, like `EndUserConnection`, which has every `IntegrationConnection` field plus `installs` and `companyFileMismatches`.
- The `createdAt` and `updatedAt` of every `*Voided` result are date-times.
- `CursorExpired`'s `reason` is a typed set (`idle_timeout`, `session_ended`, `quickbooks_restarted`, `evicted`, or a value added later). The cursor-expired error stays a subclass of the invalid-request error, because the API classifies `CURSOR_EXPIRED` as `INVALID_REQUEST_ERROR`; catch it first when you handle the two differently.
- **Breaking:** `confirm` on deletes and merges is typed `true` and required, so a call without it does not compile.
- `TransactionCustomFieldValueInput` extends `CustomFieldValueInput`, and `CustomerMergeInput` extends `ListMergeInput`.
- New exported type `CursorExpiredReason`.
- **Breaking:** a list-object delete's `deleted` and `deactivated` can be null: QuickBooks accepted the delete but reading the record back failed. The request then succeeds with `outcome` applied and a new `QBD_DELETE_NOT_VERIFIED` warning; do not send the delete again. A failed write the API verified as applied keeps `outcome` applied and is not retryable.
- List-object delete results gain `retainedBecause`: `multi_user_mode` when QuickBooks kept the record because the company file was open in multi-user mode (it deletes in single-user mode).
- New error code `QBD_REQUIRES_SINGLE_USER_MODE` (`409`, not retryable, outcome `not_applied`): merges and custom field definition deletes are refused before sending while the company file is open in multi-user mode, and custom field values QuickBooks refuses there (status 3180 or 3120) map to it. `integrationConnections[].companyFile.fileMode` (`single_user` / `multi_user`) shows the mode of the last session.
- A lead request QuickBooks does not process (status 3231, even a plain lead list) answers `422 QBD_OPERATION_UNSUPPORTED` with alternatives instead of `QBD_REQUEST_ERROR`.
- `qbd.vehicleMileage.delete` reads the trip first: an unknown ID answers `404 QBD_OBJECT_NOT_FOUND`; an existing trip answers `422 QBD_OPERATION_UNSUPPORTED` (QuickBooks refuses the delete with status 3160 even on a fresh company file) without sending the delete.
- The `quickbooks_closed_unexpectedly` diagnosis needs QuickBooks' "Unexpected error" (HRESULT 0x80040402) in a session the Web Connector never closed, and silence since its last contact; its steps first have the end user check that QuickBooks closed and no other application is updating.
- Batches (`qbd.batch`) follow the same rules: a list-delete member reads the record back (`deleted`, `deactivated`, `retainedBecause`, and a `QBD_DELETE_NOT_VERIFIED` member warning when the read-back failed), a batch holding a merge or custom field definition delete is refused with `409 QBD_REQUIRES_SINGLE_USER_MODE` in multi-user mode (`details.index` names the member), a lead member QuickBooks does not process is `QBD_OPERATION_UNSUPPORTED`, a vehicle mileage delete member is refused with `422 QBD_OPERATION_UNSUPPORTED`, and batch delete and merge members require `confirm` like the typed calls.
- **Breaking:** a batch member for custom field definition update or delete takes `pathParams.definitionName` (was `pathParams.name`), as the typed calls do.
- A custom field definition delete reads the owner's definitions back in the same request: `CustomFieldDefinitionDeleted` gains `deleted` (true only when the definition is gone, false when QuickBooks kept it, null when the read-back failed with a `QBD_DELETE_NOT_VERIFIED` warning) and `retainedBecause` (`multi_user_mode` or `unknown`), on the typed call and as a batch member.
- `QBD_REQUIRES_SINGLE_USER_MODE` now needs QuickBooks' own evidence: a custom field value refused with another 3180/3120 message keeps its code (for example not found, or `QBD_TRANSIENT_ERROR` for a record modified by another user); a generic data-extension refusal in multi-user mode keeps its code with `details.possibleCause: multi_user_mode`.
- A batch member QuickBooks refused is `not_applied` in its result and its error, whatever other members did; a lead member under `continueOnError` after another member failed is `QBD_OPERATION_UNSUPPORTED`, not `not_processed`; the vehicle mileage refusal carries `details.index`.
- New error code `QBD_REAUTHORIZATION_REQUIRED` (`ErrorCode.QBD_REAUTHORIZATION_REQUIRED`): `503`, not retryable. QuickBooks answered the Web Connector with 0x80040435 and asks its Admin to reauthorize the application in Edit > Preferences > Integrated Applications; nothing was sent. It answered `QBD_CONNECTION_ERROR`. New diagnosis cause `quickbooks_reauthorization_required`.
- A company file QuickBooks cannot reach at its stored location (0x80040408 for a path on a drive letter other than C:, usually a disconnected mapped network drive, or for the same path twice in a row) answers `QBD_COMPANY_FILE_NOT_FOUND` with `details.reason` `path_unreachable`, `details.pathKind` and `details.refusals`, and the new diagnosis cause `company_file_not_found` ranks first. It answered `QBD_WRONG_COMPANY_FILE_OPEN` ("a different company file is open").
- A QuickBooks status 3170 whose message says the record is in use, locked or being edited answers `409 QBD_OBJECT_IN_USE` with the `record_in_use` diagnosis (not retryable for a deletion). It answered `422 QBD_REQUEST_ERROR`. QuickBooks does not lock every open record, so the documentation no longer promises that an open window blocks a change.
- A payment item or job type name that is already in use answers `409 QBD_DUPLICATE_NAME` with `param` `name` (QuickBooks status 3180). It answered `422 QBD_REQUEST_ERROR`.
- `qbd.customFieldDefinitions.list` without filters returns the public definitions (`ownerId` `"0"`); it returned none. `ownerIds` together with `assignToObjects` lists the definitions of those owners assigned to those record types, private ones included; the combination was refused.
- Vehicle mileage `createdAt` and `updatedAt` are date-times: midnight UTC when QuickBooks reports only a date. They were plain dates, which the Java SDK could not parse.
- A single request ends its Web Connector session as soon as QuickBooks answers it, so QuickBooks no longer counts the application as using the company file for 2 seconds afterwards; only a request sent within 30 seconds of another keeps the session open for the next one.

## 0.7.0 (2026-10-12)

- New `client.qbd.batch()`: up to 25 typed QuickBooks Desktop operations in one Web Connector round trip. Each member is a `BatchRequestInput` object (`{ operationId, pathParams?, query?, body? }`), and each result is typed by the request at the same position (`BatchResultFor`): `results[0].data` of a `qbd.customers.create` member is a `Customer`. One `Idempotency-Key` covers the batch; a lost response raises `OutcomeUnknownError` with `details.members` and is never retried.
- A batch whose response was lost and whose create members the API later found in QuickBooks by their `externalId` returns each such member with `data: null` and the record's QuickBooks ID in `recoveredObjectId` (on every batch result: `string | null`), on `client.requests.retrieve()` and on an idempotent replay.
- New error code `QBD_REQUEST_NOT_PROCESSED` (`ErrorCode.QBD_REQUEST_NOT_PROCESSED`): `409`, not retryable. QuickBooks skipped a batch member because an earlier member failed under `stopOnError` (status 3231).
- **Breaking (types only):** the credit card request info of receive payments is typed as its own `QbdRequest` interface. It was typed as the platform `Request` (the request resource) by mistake; only code that relied on the wrong fields is affected.
- Change feed subscriptions: `client.changeFeedSubscriptions.create()`, `.list()`, `.retrieve()`, `.update()` and `.delete()` (`/v1/change-feed-subscriptions`). A subscription polls every connected end user of the project for changed and deleted records of the listed resources and sends `data.changed` webhooks with their IDs. New webhook event type `WebhookEventType.DATA_CHANGED` (`data.changed`). New error code `CHANGE_FEED_SUBSCRIPTION_LIMIT_REACHED` (`422`, not retryable).

## 0.6.0 (2026-10-12)

- **Breaking:** the list parameters type of `qbd.classes.list` is renamed from `ClasseListParams` to `ClassListParams` (the generator dropped only the final "s" of "classes"). Rename the type in your code; nothing else changes. No other type name was affected.
- `client.webhookEndpoints.rotateSecret()` works: the API now honors the Idempotency-Key the client always sends (a retry returns the same new secret without rotating twice) and answers an unknown endpoint ID with `404 RESOURCE_MISSING`. It answered `400 INVALID_PARAMETER`.
- New error code `QBD_SALES_TAX_THROUGH_DATE_TOO_EARLY` (`ErrorCode.QBD_SALES_TAX_THROUGH_DATE_TOO_EARLY`): `422`, not retryable. QuickBooks refused a sales tax payment check and asked for a later sales tax 'through' date (status 3140); nothing changed. If the end user records the sales tax in QuickBooks instead, read and link that check rather than creating another. It answered `QBD_REFERENCE_NOT_FOUND` on `vendorId`.
- A sales representative initial that is already in use answers `409 QBD_DUPLICATE_NAME` with `param` `initial` (QuickBooks status 3180). It answered `422 QBD_REQUEST_ERROR`.
- `QBD_OBJECT_IN_USE` is `retryable` only when the record is open or locked in QuickBooks. A deletion or void refused because other records still use the object is `retryable: false`, so the client no longer treats it as worth repeating.
- Status 3390 (too many open QuickBooks list iterators) is `QBD_TRANSIENT_ERROR` with `details.reason` `max_iterators`. The API now stops the QuickBooks iterator of a cursor you stop reading (after about 10 seconds idle, or when a fourth cursor list starts for the same end user), so breaking out of a list loop early no longer uses up QuickBooks' iterator limit.
- Report validation: `missing_checks` requires `accountIds` or `accountFullNames`, the job detail reports require `entityIds` or `entityFullNames`, and `physical_inventory_worksheet` rejects `reportDateMacro`, each with `400 INVALID_PARAMETER` naming the parameter. Unit of measure set create rejects `isActive: false`, which QuickBooks ignores.
- New error code `QBD_TRANSIENT_ERROR` (`ErrorCode.QBD_TRANSIENT_ERROR`): `503`, retryable, outcome `not_applied`. QuickBooks was briefly busy (status 3390, or 3180 when a list was modified by another user) and changed nothing. The client retries it automatically with the same idempotency key, which now runs the write again instead of replaying the error. These answered `QBD_REQUEST_ERROR` (`422`, not retryable).

### Operations added in this release

Listed after the release (2026-10-12): the entry above named the fixes but not the operations 0.6.0 added. 155 new operations, by operation ID (method names follow each SDK's conventions):

- `qbd.accounts`: `delete`, `merge`, `setCustomField`
- `qbd.billCheckPayments`: `setCustomField`
- `qbd.billCreditCardPayments`: `setCustomField`
- `qbd.billingRates`: `create`, `delete`, `list`, `retrieve`
- `qbd.bills`: `setCustomField`
- `qbd.buildAssemblies`: `setCustomField`
- `qbd.checks`: `setCustomField`
- `qbd.classes`: `delete`, `merge`
- `qbd.creditCardCharges`: `setCustomField`
- `qbd.creditCardCredits`: `setCustomField`
- `qbd.creditCardRefunds`: `setCustomField`
- `qbd.creditMemos`: `setCustomField`
- `qbd.currencies`: `delete`
- `qbd.customFieldDefinitions`: `create`, `delete`, `list`, `update`
- `qbd.customerMessages`: `create`, `delete`, `list`, `retrieve`
- `qbd.customerTypes`: `delete`
- `qbd.customers`: `delete`, `merge`, `setCustomField`
- `qbd.dateDrivenTerms`: `delete`
- `qbd.deposits`: `setCustomField`
- `qbd.discountItems`: `delete`, `merge`, `setCustomField`
- `qbd.employees`: `delete`, `setCustomField`
- `qbd.entities`: `list`, `retrieve`
- `qbd.estimates`: `setCustomField`
- `qbd.fixedAssetItems`: `create`, `delete`, `list`, `retrieve`, `setCustomField`, `update`
- `qbd.inventoryAdjustments`: `setCustomField`
- `qbd.inventoryAssemblyItems`: `canBuild`, `delete`, `setCustomField`
- `qbd.inventoryItems`: `delete`, `merge`, `setCustomField`
- `qbd.inventorySites`: `delete`
- `qbd.inventoryTransfers`: `create`, `delete`, `list`, `retrieve`, `update`
- `qbd.invoices`: `setCustomField`
- `qbd.itemGroups`: `delete`, `merge`, `setCustomField`
- `qbd.itemReceipts`: `setCustomField`
- `qbd.items`: `list`, `retrieve`
- `qbd.jobTypes`: `create`, `delete`, `list`, `retrieve`
- `qbd.journalEntries`: `setCustomField`
- `qbd.leads`: `create`, `list`, `retrieve`, `update`
- `qbd.nonInventoryItems`: `delete`, `merge`, `setCustomField`
- `qbd.otherChargeItems`: `delete`, `merge`, `setCustomField`
- `qbd.otherNames`: `delete`, `setCustomField`
- `qbd.paymentItems`: `create`, `delete`, `list`, `merge`, `retrieve`, `setCustomField`, `update`
- `qbd.paymentMethods`: `delete`
- `qbd.payrollNonWageItems`: `delete`, `list`, `retrieve`
- `qbd.payrollWageItems`: `delete`, `update`
- `qbd.priceLevels`: `delete`
- `qbd.purchaseOrders`: `setCustomField`
- `qbd.receivePayments`: `setCustomField`
- `qbd.salesOrders`: `setCustomField`
- `qbd.salesReceipts`: `setCustomField`
- `qbd.salesRepresentatives`: `delete`
- `qbd.salesTaxCodes`: `delete`
- `qbd.salesTaxGroupItems`: `delete`, `merge`, `setCustomField`
- `qbd.salesTaxItems`: `delete`, `merge`, `setCustomField`
- `qbd.salesTaxPaymentChecks`: `setCustomField`
- `qbd.serviceItems`: `delete`, `merge`, `setCustomField`
- `qbd.shippingMethods`: `delete`
- `qbd.standardTerms`: `delete`
- `qbd.statementCharges`: `create`, `delete`, `list`, `retrieve`, `setCustomField`, `update`, `void`
- `qbd.subtotalItems`: `delete`, `merge`, `setCustomField`
- `qbd.toDos`: `create`, `delete`, `list`, `retrieve`, `update`
- `qbd.transactions`: `updateClearedStatus`
- `qbd.unitOfMeasureSets`: `delete`
- `qbd.vehicleMileage`: `create`, `delete`, `list`, `retrieve`
- `qbd.vehicles`: `create`, `delete`, `list`, `retrieve`, `update`
- `qbd.vendorCredits`: `setCustomField`
- `qbd.vendorTypes`: `create`, `delete`, `list`, `retrieve`
- `qbd.vendors`: `delete`, `merge`, `setCustomField`
- `qbd.workersCompCodes`: `create`, `delete`, `list`, `retrieve`, `update`

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
