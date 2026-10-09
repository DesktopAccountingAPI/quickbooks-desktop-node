# Desktop Accounting API Node.js SDK

The TypeScript and JavaScript client for [Desktop Accounting API](https://www.desktopaccountingapi.com/), a REST API for QuickBooks Desktop and QuickBooks Enterprise. Your server makes typed calls such as `client.qbd.invoices.create(...)`, and Desktop Accounting API delivers them to your customer's company file through the QuickBooks Web Connector.

- Covers all 275 operations of API 1.0.0: QuickBooks objects and reports (`client.qbd`), end users, auth sessions, request tracking, qbXML passthrough and webhook verification.
- Request and response types for every object, typed errors for every error code, and exact decimal strings for money.
- Every write carries an idempotency key, retries happen only where they cannot duplicate data, and an expired QuickBooks cursor never restarts a list silently.
- ES module and CommonJS builds with type declarations and no runtime dependencies. Runs in Node.js, Bun, Deno and Cloudflare Workers.

[Documentation](https://www.desktopaccountingapi.com/docs/) · [API reference](https://www.desktopaccountingapi.com/docs/api/reference/) · [Every SDK method](api.md) · [Examples](https://github.com/DesktopAccountingAPI/examples/tree/main/node) · [Changelog](CHANGELOG.md) · [Status](https://status.desktopaccountingapi.com)

## Install

```sh
npm install @desktopaccountingapi/quickbooks-desktop
```

The current version is **0.5.2**. To pin it exactly:

```sh
npm install @desktopaccountingapi/quickbooks-desktop@0.5.2
pnpm add @desktopaccountingapi/quickbooks-desktop@0.5.2
yarn add @desktopaccountingapi/quickbooks-desktop@0.5.2
bun add @desktopaccountingapi/quickbooks-desktop@0.5.2
```

## Requirements

- Node.js 20 or later (the client uses the platform `fetch`, `AbortSignal` and WebCrypto). Bun, Deno and Cloudflare Workers work too.
- TypeScript 5.7 or later, if you use TypeScript.
- A server-side runtime. Secret keys must never reach a browser (see [Authentication](#authentication)).

## Authentication

1. Sign in to the [dashboard](https://www.desktopaccountingapi.com/dashboard) and open **API keys**.
2. Create a secret key. Test projects issue `sk_test_...` keys; production projects issue `sk_live_...` keys. Choose **Read-only** for reporting jobs and AI agents that must never change data. The full key is shown once.
3. Put it in the `DAAPI_SECRET_KEY` environment variable of your server:

```sh
export DAAPI_SECRET_KEY="sk_test_..."
```

`new DesktopAccountingApi()` reads `DAAPI_SECRET_KEY` (and `DAAPI_BASE_URL`, if set). You can also pass `{ apiKey }` explicitly. The SDK checks the key's format and checksum locally, so a mistyped key fails before any network call.

A secret key can read and write every connected company file in its project. Keep it on your server, in a secret manager or environment variable. Never ship it in browser code or a mobile app, and never commit it. The API refuses browser requests from other origins on purpose. If a key leaks, revoke it in the dashboard and create a new one. See [Authentication and API keys](https://www.desktopaccountingapi.com/docs/get-started/authentication/).

## Quickstart

Each of your customers is an **end user** (`eu_...`) with one QuickBooks Desktop company file, connected through the Web Connector. Copy an end user ID from the dashboard's **End users** page and set it as `DAAPI_END_USER_ID` (`export DAAPI_END_USER_ID="eu_..."`), then:

```ts run=quickstart harness=none
import { DesktopAccountingApi } from "@desktopaccountingapi/quickbooks-desktop";

// Reads DAAPI_SECRET_KEY. forEndUser sends Daapi-End-User-Id on every QuickBooks call.
const client = new DesktopAccountingApi().forEndUser(process.env["DAAPI_END_USER_ID"]!);

const health = await client.qbd.healthCheck();
console.log(`QuickBooks connection: ${health.status}`);

// The loop fetches further pages as needed (10 invoices per request); stop after the first 10.
let shown = 0;
for await (const invoice of client.qbd.invoices.list({ limit: 10 })) {
  console.log(invoice.refNumber, invoice.subtotal); // subtotal is a decimal string, for example "105.50"
  if (++shown === 10) break;
}
```

Save it as `quickstart.ts` and run `node quickstart.ts` (Node.js 22.18 or later runs TypeScript directly). CommonJS works the same way:

```js
const { DesktopAccountingApi } = require("@desktopaccountingapi/quickbooks-desktop");

const client = new DesktopAccountingApi();
console.log(typeof client.forEndUser);
```

`DesktopAccountingApi` is also the default export.

## End users

QuickBooks Desktop operations (`client.qbd.*`) act on one end user's company file and send the `Daapi-End-User-Id` header. Choose the end user per client or per call:

```ts
const acme = client.forEndUser("eu_01j9x4m6v4c8k2t7q0r5s3w1zb"); // a copy with a default end user
await acme.qbd.customers.list();
await client.qbd.customers.list({}, { endUserId: "eu_01j9x4m6v4c8k2t7q0r5s3w1zb" }); // or per call
```

A QuickBooks call without an end user throws `DaapiError` before anything is sent. Platform operations (`client.endUsers.*`, `client.authSessions.create`, `client.requests.retrieve`) never send the header. Create end users and their setup links with `client.endUsers.create` and `client.authSessions.create`; see [End users](https://www.desktopaccountingapi.com/docs/connect/end-users/).

## Common workflows

### List records with auto-pagination

`for await` walks every page. The next page is requested only when the loop needs it, so a loop that stops early never runs an extra QuickBooks query. If you hold a page for more than 2 seconds, the SDK requests the next one in the background, so slow loop bodies stay inside the QuickBooks cursor's idle window.

```ts
for await (const customer of client.qbd.customers.list({ limit: 100, updatedAfter: "2026-01-01" })) {
  console.log(customer.id, customer.fullName, customer.balance);
}

const page = await client.qbd.customers.list({ limit: 100 }); // only the first page
console.log(page.data.length, page.hasMore, page.nextCursor);
```

More options, and what to do when a cursor expires, are in [Pagination](#pagination).

### Create a record with an idempotency key

Every write sends an `Idempotency-Key`. Pass your own, derived from your data, so a retry after a crash or timeout returns the first result instead of creating a duplicate:

```ts
const invoice = await client.qbd.invoices.create(
  {
    customerId: "80000001-1700000000",
    transactionDate: "2026-10-05",
    refNumber: "WEB-8812",
    lines: [{ itemId: "80000005-1700000000", quantity: 2, rate: "52.75" }],
  },
  { idempotencyKey: "order-8812-invoice" },
);
console.log(invoice.id, invoice.refNumber, invoice.subtotal); // subtotal "105.50"
```

### Update a record with its revision number

QuickBooks rejects an update unless it carries the object's current `revisionNumber`, so concurrent edits are never overwritten. Read the object, then send its `revisionNumber` with only the fields you change:

```ts
import { ErrorCode, IntegrationError } from "@desktopaccountingapi/quickbooks-desktop";

const current = await client.qbd.invoices.retrieve("7-1700000000");
try {
  const updated = await client.qbd.invoices.update(current.id, {
    revisionNumber: current.revisionNumber,
    memo: "Paid by card",
  });
  console.log(updated.revisionNumber); // the new revision
} catch (err) {
  if (err instanceof IntegrationError && err.code === ErrorCode.QBD_REVISION_NUMBER_STALE) {
    // Someone changed the invoice after you read it. Retrieve it again, reapply your change,
    // and update with the new revisionNumber.
  } else throw err;
}
```

A stale revision is a `409` `INTEGRATION_ERROR` with code `QBD_REVISION_NUMBER_STALE`. Nothing was changed (`outcome: "not_applied"`):

```json
{
  "error": {
    "type": "INTEGRATION_ERROR",
    "code": "QBD_REVISION_NUMBER_STALE",
    "message": "The object changed since you read it; revisionNumber is out of date.",
    "userFacingMessage": "This record changed in QuickBooks Desktop after it was loaded. Reload it and try again.",
    "httpStatusCode": 409,
    "integrationCode": "3200",
    "requestId": "req_01j9x4m6v4c8k2t7q0r5s3w1zd",
    "cause": "QuickBooks rejects updates that do not carry the current revision number, so concurrent edits are not lost.",
    "fixes": [{ "actor": "developer", "action": "Retrieve the object, merge your change, and update with the new revisionNumber." }],
    "docsUrl": "https://www.desktopaccountingapi.com/docs/errors/#qbd_revision_number_stale",
    "retryable": false,
    "outcome": "not_applied",
    "param": null,
    "details": {}
  }
}
```

### Handle errors

Errors are typed by the API's error `type`, and every API error carries the request ID, a message you can show your end user, the cause, concrete fixes and a link to its documentation:

```ts
import { ApiError, IntegrationConnectionError } from "@desktopaccountingapi/quickbooks-desktop";

try {
  await client.qbd.customers.retrieve("80000099-1700000000");
} catch (err) {
  if (err instanceof IntegrationConnectionError) {
    // QuickBooks is closed, a dialog is open, or the Web Connector is not running: the end user has to act.
    showToEndUser(err.userFacingMessage ?? err.message);
  } else if (err instanceof ApiError) {
    console.error(err.status, err.code, err.message, err.requestId);
    console.error(err.errorCause, err.docsUrl);
    for (const fix of err.fixes) console.error(`${fix.actor}: ${fix.action}`);
  } else throw err;
}
```

Every class and field is listed in [Errors](#errors). The [error catalog](https://www.desktopaccountingapi.com/docs/errors/) documents every code.

### Run a request asynchronously and get a webhook

QuickBooks only processes requests while the end user's Web Connector is running. Pass `{ async: true }` to queue a request and return at once with a handle; the API also sends a `request.succeeded` or `request.failed` webhook when it finishes:

```ts
const handle = await client.qbd.invoices.create(
  { customerId: "80000001-1700000000", lines: [{ itemId: "80000005-1700000000", quantity: 1 }] },
  { async: true, queueTtl: 3600, idempotencyKey: "order-8813-invoice" },
);
console.log(handle.id, handle.request.status); // "req_...", "queued"
const invoice = await handle.wait({ timeout: 120_000 }); // the typed Invoice, or the typed error
console.log(invoice.refNumber);
```

Verify each webhook delivery with the endpoint's signing secret before you trust it. Pass the raw body, not parsed JSON:

```ts harness=none
import { createServer } from "node:http";
import { verifyWebhook, WebhookEventType, WebhookVerificationError } from "@desktopaccountingapi/quickbooks-desktop";

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  try {
    const event = await verifyWebhook(Buffer.concat(chunks).toString("utf8"), req.headers, process.env["DAAPI_WEBHOOK_SECRET"]!);
    if (event.type === WebhookEventType.REQUEST_SUCCEEDED) console.log("request", event.data["id"], "succeeded");
    res.writeHead(204).end();
  } catch (err) {
    if (err instanceof WebhookVerificationError) res.writeHead(400).end();
    else throw err;
  }
}).listen(8080);
```

Create webhook endpoints and copy their `whsec_...` signing secrets in the dashboard under **Webhooks**. Details: [Async requests](#async-requests), [Webhooks](#webhooks), and the [webhooks guide](https://www.desktopaccountingapi.com/docs/guides/webhooks/).

### Set timeouts and retries

```ts
const patient = new DesktopAccountingApi({ timeout: 30_000, maxRetries: 4, serverTimeout: 25 });
await patient.qbd.invoices.retrieve("7-1700000000", { endUserId: "eu_01j9x4m6v4c8k2t7q0r5s3w1zb", maxRetries: 0 });
```

`timeout` is the client's limit per HTTP attempt in milliseconds; `totalTimeout` caps a whole call including retries; `serverTimeout` is how long the API waits for QuickBooks, in seconds. Reads and writes retry only when it is safe; see [Retries and idempotency](#retries-and-idempotency) and [Timeouts](#timeouts).

## Configuration

| Option | Environment variable | Default | Meaning |
| --- | --- | --- | --- |
| `apiKey` | `DAAPI_SECRET_KEY` | none (required) | Secret key `sk_live_...` or `sk_test_...`. Checked locally (format and checksum) before any request; an invalid key throws `DaapiError`. |
| `baseUrl` (or `baseURL`) | `DAAPI_BASE_URL` | `https://api.desktopaccountingapi.com` | API host. May include a path. A trailing `/v1` is removed, so `https://api.desktopaccountingapi.com/v1` works too. |
| `endUserId` | | none | Default end user for QuickBooks Desktop operations. |
| `timeout` | | `100000` | Client-side timeout of each HTTP attempt, in milliseconds. Each retry gets a fresh timeout. Without `totalTimeout`, also the time the SDK waits for a pending request (see [Timeouts](#timeouts)). |
| `totalTimeout` | | none | Time budget of a whole call in milliseconds: attempts, retry backoff and the wait for a pending request. |
| `maxRetries` | | `2` | Retries after network errors, 429 and retryable 5xx responses. `0` disables retries. |
| `serverTimeout` | | server default | `Daapi-Timeout-Seconds` (1-300) on operations that accept it: how long the API waits for QuickBooks before answering `504`. |
| `defaultHeaders` | | none | Headers sent with every request. The headers the SDK manages (`Authorization`, `Accept`, `Content-Type`, `User-Agent`, `Daapi-End-User-Id`, `Idempotency-Key`, `Daapi-Timeout-Seconds`, `Prefer`) are never taken from here. |
| `fetch` | | `globalThis.fetch` | Custom transport: `(url, init) => Promise<Response>`. Use it for proxies, instrumentation or tests. |
| `fetchOptions` | | none | Extra `RequestInit` options for every `fetch` call, for example an undici `dispatcher` for a proxy. The SDK sets `method`, `headers`, `body` and `signal`. |
| `logger` | | none | `{ debug(message, fields), warn(message, fields) }`, optionally `info` and `error`; `console` fits. Receives method, path, status, request ID, attempt and duration. Never receives the API key, headers or bodies. |
| `logLevel` | `DAAPI_LOG` | `debug` with a logger, else off | `debug`, `info`, `warn`, `error` or `off`. With a level and no `logger`, the SDK logs to `console`. |

Every method takes per-call options as its last argument:

```ts
const abortController = new AbortController();
await client.qbd.invoices.retrieve("7-1700000000", {
  endUserId: "eu_01j9x4m6v4c8k2t7q0r5s3w1ze", // end user for this call
  timeout: 30_000, // client-side timeout (ms)
  totalTimeout: 60_000, // the whole call, retries included (ms)
  maxRetries: 0,
  serverTimeout: 30, // Daapi-Timeout-Seconds
  headers: { "X-Trace-Id": "order-8814" }, // extra headers for this call
  signal: abortController.signal,
});
```

`client.withOptions({ ... })` returns a copy with other options; it shares the same transport.

## Types

- Money and other decimal amounts are strings (`"52.75"`, `"5.00"`), sent and received exactly as written. Never convert them through `Number`; use a decimal library if you calculate.
- Quantities and percentages are numbers.
- Dates are `YYYY-MM-DD` strings. Timestamps are ISO 8601 strings with the offset QuickBooks reported.
- Enums in responses are open: values added later arrive as plain strings.
- Request and response types are exported by name (`Invoice`, `InvoiceCreateInput`, `InvoiceListParams`, ...).
- In update inputs, omit a field to leave it unchanged and pass `null` to clear it (where the API allows clearing):

```ts
const invoice = await client.qbd.invoices.retrieve("7-1700000000");
await client.qbd.invoices.update(invoice.id, { revisionNumber: invoice.revisionNumber, memo: null });
```

## Pagination

Lists marked as cursor lists in [api.md](api.md) return a `PagePromise`:

```ts
// Every item, across pages.
for await (const customer of client.qbd.customers.list({ limit: 100 })) save(customer);

// Only the first page.
const page = await client.qbd.customers.list({ limit: 100 });
console.log(page.data, page.nextCursor, page.hasMore, page.remainingCount, page.cursorExpiresAt);

// Page by page, or everything into an array.
for await (const p of client.qbd.customers.list().pages()) console.log(p.data.length);
const all = await client.qbd.customers.list().listAll();
console.log(all.length);
```

Continuation requests send only `cursor` (and your `limit`). The next page is requested only when the iteration reaches it, so `break`ing out of a loop never sends an extra QuickBooks query. While `for await` hands you items, a page held for more than 2 seconds makes the SDK request the next page in the background, which keeps slow loops inside the cursor's idle window. `pages()` requests each page when you ask for it; `listAll()` always requests the next page as soon as a page arrives. A network error on a continuation retries the same cursor, which returns the same page again.

To resume from a page you stored earlier, for example across HTTP requests, pass its `nextCursor` as `cursor`: `await client.qbd.invoices.list({ cursor: savedCursor, limit: 100 })` returns that page, and iterating continues from it. Filters live in the cursor, so pass only the cursor and, if you like, the limit. A QuickBooks cursor expires when it sits idle, so resume soon after you store it.

A QuickBooks cursor lives only as long as its QuickBooks session. When it expires the iteration throws `CursorExpiredError` and does not restart the query, because a restart can duplicate or miss records that changed in between. The error tells you how far you got. Restart the same query and skip what you already have. Do not resume from the last record's `updatedAt`: QuickBooks returns records in its own order, not by `updatedAt`, so records you have not read yet can be older than the last one you read. An incremental sync restarts from the `updatedAfter` watermark it saved before the traversal ([pagination guide](https://www.desktopaccountingapi.com/docs/guides/pagination/#recovering-from-cursor_expired)).

```ts
import { CursorExpiredError } from "@desktopaccountingapi/quickbooks-desktop";

const saved = new Set<string>();
try {
  for await (const customer of client.qbd.customers.list({ limit: 100 })) {
    save(customer);
    saved.add(customer.id);
  }
} catch (err) {
  if (!(err instanceof CursorExpiredError)) throw err;
  console.log(err.itemsYielded, err.pagesServed, err.lastId, err.lastUpdatedAt, err.reason, err.requestId);
  // Restart the same query and skip the IDs you already saved.
  for await (const customer of client.qbd.customers.list({ limit: 100 })) {
    if (!saved.has(customer.id)) save(customer);
  }
}
```

Lists without cursor pagination (accounts, classes, terms and other small lists) return the whole list envelope (`{ objectType, url, data }`). The [pagination guide](https://www.desktopaccountingapi.com/docs/guides/pagination/) explains cursor lifetimes.

## Errors

Every error extends `DaapiError`:

| Class | When |
| --- | --- |
| `DaapiError` | Client-side problems: missing or invalid API key, missing end user, invalid arguments. |
| `ApiError` | Any error response from the API. Unknown error types use this class. |
| `InvalidRequestError`, `AuthenticationError`, `PermissionError`, `BillingError`, `RateLimitError`, `IntegrationConnectionError`, `IntegrationError`, `OutcomeUnknownError`, `InternalError` | One subclass of `ApiError` per error `type`. |
| `CursorExpiredError` | `InvalidRequestError` for an expired cursor, with progress fields. |
| `ApiConnectionError`, `ApiTimeoutError` | No response arrived (connection failure or client timeout) after all retries. |
| `ApiUserAbortError` | Your `signal` aborted the call. |
| `RequestPendingError` | The request is still running in QuickBooks when the client timeout ends. It has `requestId`. |
| `WebhookVerificationError` | Webhook signature, timestamp or payload check failed. |

The Conductor names work too (see [Porting from Conductor](#porting-from-conductor)): `ConductorError`, `APIError`, `APIConnectionError`, `APIConnectionTimeoutError`, `APIUserAbortError` and `PermissionDeniedError` are the classes above, and `BadRequestError` (400), `NotFoundError` (404), `ConflictError` (409), `UnprocessableEntityError` (422) and `InternalServerError` (5xx) match any `ApiError` with that HTTP status in an `instanceof` check. Every class is also a static property of the client class (`DesktopAccountingApi.APIError`).

`ApiError` exposes every field of the error object: `status` (HTTP status), `type`, `code`, `message`, `userFacingMessage`, `httpStatusCode`, `integrationCode`, `requestId`, `errorCause` (the error object's `cause` field; `Error.cause` stays the JavaScript error chain), `fixes` (`{ actor, action }[]`), `docsUrl`, `retryable`, `outcome`, `param`, `details`, and the response `headers`. `ErrorCode` and `ErrorType` hold every code and type in the contract:

```ts
import { ErrorCode, IntegrationConnectionError, IntegrationError } from "@desktopaccountingapi/quickbooks-desktop";

try {
  await client.qbd.customers.retrieve("80000099-1700000000");
} catch (err) {
  if (err instanceof IntegrationConnectionError && err.code === ErrorCode.QBD_MODAL_DIALOG_OPEN) {
    showToEndUser(err.userFacingMessage ?? err.message);
  } else if (err instanceof IntegrationError) {
    console.log(err.code, err.integrationCode, err.fixes, err.docsUrl, err.requestId);
  } else throw err;
}
```

Include the `requestId` when you contact support. See the [error handling guide](https://www.desktopaccountingapi.com/docs/guides/error-handling/).

## Retries and idempotency

Every write (create, update, delete, void, passthrough, auth session) sends an `Idempotency-Key`. The SDK generates a UUID once per call and reuses it on every retry of that call, so a retried write cannot create a duplicate. Pass your own key (`{ idempotencyKey }`) to make a write idempotent across processes and restarts. Every error of a write carries the key it was sent with (`err.idempotencyKey`), and so do `withResponse()` results and request handles, so a write that failed without a definite outcome can be resent safely with the same key.

The SDK retries (up to `maxRetries`, default 2):

- network errors before a response (connection failure, reset, dropped connection, client timeout), for reads and writes (writes keep their key);
- `429` responses;
- `5xx` responses with `Daapi-Should-Retry: true`.

It never retries when the response says `Daapi-Should-Retry: false`, when the error's `outcome` is `unknown` or `pending`, or when a `5xx` body is not a JSON error. Backoff is 0.5 s doubling up to 8 s, with jitter; `Retry-After` (seconds or an HTTP date, up to 60 s) takes precedence. See the [idempotency guide](https://www.desktopaccountingapi.com/docs/guides/idempotency/).

## Timeouts

There are three timeouts:

- `timeout` (client, milliseconds, default 100 000) limits each HTTP attempt. A retry starts a new attempt with a fresh timeout, so with retries a call can take longer than `timeout`.
- `totalTimeout` (client, milliseconds, no default) limits the whole call: every attempt, the waits between retries, and the wait for a pending request. An attempt still running when it ends is cut off (`ApiTimeoutError`), and no retry starts that could not finish in time.
- `serverTimeout` (server, seconds) is how long the API waits for QuickBooks before it answers. The server default is 90 seconds (60 for the health check).

If QuickBooks is still working when the server timeout ends, the API answers `504 QBD_REQUEST_TIMEOUT` with the request ID. The SDK does not resubmit. It long-polls `GET /v1/requests/{id}` until the call's deadline (`totalTimeout`, else `timeout`, measured from the start of the call) and then returns the typed result, throws the request's typed error, or throws `RequestPendingError` with `requestId`. It also throws `RequestPendingError`, never the poll's own error, when a poll fails (`429`, `5xx`, `404`, network): that error says nothing about the write. `err.timeoutError` is the original 504 (with `details.diagnosis`) and `err.idempotencyKey` the key the write was sent with; resend only with that key. Check the request later:

```ts
import { RequestPendingError } from "@desktopaccountingapi/quickbooks-desktop";

try {
  await client.qbd.invoices.create({ customerId: "80000001-1700000000" }, { idempotencyKey: "order-8814-invoice" });
} catch (err) {
  if (!(err instanceof RequestPendingError)) throw err;
  const request = await client.requests.retrieve(err.requestId);
  console.log(request.status); // still "queued" or "running"; a webhook reports the result
}
```

## Async requests

Operations that can run asynchronously accept `{ async: true }`. The API answers `202 Accepted` at once and the call returns a `RequestHandle`:

```ts
const handle = await client.qbd.invoices.create({ customerId: "80000001-1700000000" }, { async: true, queueTtl: 3600 });
console.log(handle.id, handle.request.status); // "req_...", "queued"
const current = await handle.status(); // current request resource
console.log(current.status);
const invoice = await handle.wait({ timeout: 120_000 }); // typed Invoice, or throws the typed error
const result = await handle.result(); // one check: result, typed error, or RequestPendingError
console.log(invoice.id, result.id);
```

`queueTtl` (`Daapi-Queue-Ttl-Seconds`) is the latest time the request may still be sent to QuickBooks. Completion is also delivered by webhook. See the [request lifecycle guide](https://www.desktopaccountingapi.com/docs/guides/request-lifecycle/).

## Webhooks

Webhooks follow [Standard Webhooks](https://www.standardwebhooks.com/). `verifyWebhook(rawBody, headers, secret)` checks the signature and timestamp and returns the parsed event; no API key is needed. It accepts the secret with or without the `whsec_` prefix, any header case, several signatures during secret rotation, and timestamps within 300 seconds of your clock (`{ toleranceSeconds }` changes that; `{ now }` injects a clock for tests: a function returning the current time in Unix seconds, such as `() => Math.floor(Date.now() / 1000)`, not `Date.now()` milliseconds). The same functions are available as `client.webhooks.verify(...)`, `verifyWebhookSignature(...)` (signature only) and `signWebhook(...)` (to sign test events). They use WebCrypto and are therefore async. Delivery is at least once: deduplicate on `event.id`.

## Raw responses

Every non-paginated method returns an `APIPromise`. Besides awaiting it for the data:

```ts
const { data, response, requestId } = await client.qbd.customers.retrieve("80000001-1700000000").withResponse();
console.log(data.fullName, requestId, response.status, response.headers.get("daapi-warnings"));

const raw: Response = await client.qbd.customers.retrieve("80000001-1700000000").asResponse(); // body not read
console.log(raw.status);
```

`requestId` is the ID of the request that produced the result. After the SDK long-polled a request that timed out on the server (`504 QBD_REQUEST_TIMEOUT`), it is that request's ID, which `client.requests.retrieve(requestId)` finds; the final poll's own ID stays in the response's `daapi-request-id` header.

For cursor lists, `client.qbd.customers.list().withResponse()` returns the first page with its response.

## Passthrough

Send qbXML messages the SDK does not model, as JSON or as raw XML:

```ts
const json = await client.endUsers.passthrough("eu_01j9x4m6v4c8k2t7q0r5s3w1zb", { CustomerQueryRq: { MaxReturned: 5 } });
const xml = await client.endUsers.passthroughXml("eu_01j9x4m6v4c8k2t7q0r5s3w1zb", "<QBXMLMsgsRq><CustomerQueryRq><MaxReturned>5</MaxReturned></CustomerQueryRq></QBXMLMsgsRq>");
console.log(json, xml);
```

Passthrough is a write when any message is not a query, so it always sends an idempotency key.

## Porting from Conductor

Code written for `conductor-node` runs on this SDK with two edits: the import and the API key. The resource tree, method names, parameter names and response fields are the same, and the Conductor names of the options and error classes are accepted.

```ts harness=none
// Before (conductor-node):
//   import Conductor from "conductor-node";
//   const conductor = new Conductor({ apiKey: process.env["CONDUCTOR_SECRET_KEY"] });
import Conductor from "@desktopaccountingapi/quickbooks-desktop";

const conductor = new Conductor({ apiKey: process.env["DAAPI_SECRET_KEY"] });

// Everything below is unchanged Conductor code.
const endUserId = "eu_01j9x4m6v4c8k2t7q0r5s3w1zb";
await conductor.qbd.healthCheck({ conductorEndUserId: endUserId });
for await (const invoice of conductor.qbd.invoices.list({ conductorEndUserId: endUserId, limit: 50 })) {
  console.log(invoice.refNumber, invoice.subtotal);
}
const customer = await conductor.qbd.customers.create({ conductorEndUserId: endUserId, name: "Acme Supply" });
const page = await conductor.qbd.invoices.list({ conductorEndUserId: endUserId, customerIds: [customer.id] });
console.log(page.data.length, page.nextCursor);
```

Errors keep Conductor's class names and fields, including the `err.error.error` unwrapping from Conductor's documentation:

```ts harness=none
import Conductor, { NotFoundError } from "@desktopaccountingapi/quickbooks-desktop";

const conductor = new Conductor({ apiKey: process.env["DAAPI_SECRET_KEY"] });
try {
  await conductor.qbd.invoices.retrieve("7-1700000000", { conductorEndUserId: "eu_01j9x4m6v4c8k2t7q0r5s3w1zb" });
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("No such invoice");
  } else if (err instanceof Conductor.APIError) {
    const conductorError = err.error?.error; // the same object as err.error
    console.log(err.status, conductorError?.code, conductorError?.userFacingMessage, conductorError?.requestId);
    // Our richer fields are on the error itself.
    console.log(err.type, err.code, err.integrationCode, err.httpStatusCode, err.errorCause, err.fixes, err.docsUrl, err.outcome, err.retryable);
  } else {
    throw err;
  }
}
```

Client options keep their Conductor names:

```ts harness=none
import Conductor from "@desktopaccountingapi/quickbooks-desktop";

const conductor = new Conductor({
  apiKey: process.env["DAAPI_SECRET_KEY"],
  baseURL: "https://api.desktopaccountingapi.com/v1", // a trailing /v1 is fine
  timeout: 120_000, // per attempt, as in Conductor
  maxRetries: 2,
  defaultHeaders: { "X-Trace-Id": "billing-sync" },
  fetchOptions: { keepalive: true },
  logLevel: "warn", // or DAAPI_LOG=warn; logs to console unless you pass a logger
});
console.log(conductor.baseUrl);
```

What to change by hand:

- **API key and base URL.** `DAAPI_SECRET_KEY` (`sk_test_...`, `sk_live_...`) instead of `CONDUCTOR_SECRET_KEY`. The default base URL is ours; a Conductor base URL in `CONDUCTOR_BASE_URL` is not read.
- **End-user IDs.** Create end users here (`eu_...`); Conductor's `end_usr_...` IDs do not exist in this API.
- **Pages.** A page is plain data (`data`, `nextCursor`, `hasMore`, `remainingCount`, `cursorExpiresAt`). Replace `page.hasNextPage()` / `page.getNextPage()` loops with `for await` over the list or `list(...).pages()`.
- **Status error classes.** `NotFoundError`, `BadRequestError` and the other status classes match in `instanceof`, but the class an error is created with is the one for its error `type` (for example `InvalidRequestError`), so `err.name` and `err.constructor` differ from Conductor's. `APIConnectionError` is not a subclass of `APIError` here; catch `ConductorError` (`DaapiError`) to cover both.
- **Retries.** Writes always carry an `Idempotency-Key`, and only safe failures are retried (see [Retries and idempotency](#retries-and-idempotency)); Conductor's SDK retried 408 and 409 too. `defaultQuery` is not supported.

The [migration guide](https://www.desktopaccountingapi.com/docs/get-started/migrating-from-conductor/) covers the API-level differences.

## Versioning and changelog

- The package follows [semantic versioning](https://semver.org/). Before 1.0, a minor version may contain breaking changes; they are marked Breaking in the [CHANGELOG](https://github.com/DesktopAccountingAPI/quickbooks-desktop-node/blob/main/CHANGELOG.md).
- The Node.js, Python, .NET and Java SDKs and the [MCP server](https://github.com/DesktopAccountingAPI/quickbooks-desktop-mcp) are released together with the same version number, generated from the same API contract.
- Every release is listed in [CHANGELOG.md](CHANGELOG.md) and tagged `v<version>` on GitHub.
- The API is versioned in its path (`/v1`). Within `v1` the API only adds operations, fields, enum values and error codes, and the SDK tolerates all of them, so older SDK versions keep working.
- Each release records the exact contract it was generated from in `.daapi-sdk.json` (contract sha256 `09aa9517f466...`, generator version, operation count) and exports it as `CONTRACT_SHA256` and `API_VERSION`. `VERSION` is the package version, also sent as `User-Agent: desktopaccountingapi-node/<version>`.

## Support

- [Documentation](https://www.desktopaccountingapi.com/docs/), the [API reference](https://www.desktopaccountingapi.com/docs/api/reference/) and the [error catalog](https://www.desktopaccountingapi.com/docs/errors/).
- [Status page](https://status.desktopaccountingapi.com) for API and connection incidents.
- SDK bugs and feature requests: [GitHub issues](https://github.com/DesktopAccountingAPI/quickbooks-desktop-node/issues).
- Questions about your account, keys, billing or a specific end user's connection: [contact us](https://www.desktopaccountingapi.com/contact). Include the `requestId` of a failing call, never your secret key.
- Security reports: use **Report a vulnerability** on this repository's Security tab.

## Development

| Command | What it does |
| --- | --- |
| `mise run check` | Everything CI runs: `npm ci`, strict type check, build, unit tests, conformance suite, examples, README samples, import/require smoke test, package contents check, publish dry run. |
| `npm test` | Unit tests (`node --test`, Node.js type stripping). |
| `npm run test:conformance` | The cross-language conformance suite against `conformance/mock-server.mjs`. |
| `npm run test:readme` | Type-checks every code sample in this README against the build and runs the quickstart against the mock server. |
| `NODE_TEST_VERSION=20 mise run test:node` | Compiled tests and smoke test on another Node.js version. |
| `bash scripts/publish.sh --dry-run` | Build and pack; show what a release would upload. |

To install from source: `npm install github:DesktopAccountingAPI/quickbooks-desktop-node` (the `prepare` script builds `dist/`). Files under `src/generated/`, `api.md` and `conformance/fixtures/` are generated from the API contract, and this README is generated too; change the generator, not these files. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

QuickBooks is a registered trademark of Intuit Inc. Desktop Accounting API is an independent product and is not affiliated with, endorsed by, or approved by Intuit Inc.
