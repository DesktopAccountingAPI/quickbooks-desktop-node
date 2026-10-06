# Desktop Accounting API Node.js SDK

`@desktopaccountingapi/quickbooks-desktop` is the Node.js and TypeScript client for [Desktop Accounting API](https://www.desktopaccountingapi.com/docs/), a REST API for QuickBooks Desktop. It covers all 275 operations of API version 1.0.0: QuickBooks Desktop objects and reports (`client.qbd`), end users, auth sessions, request tracking, passthrough qbXML, and webhook verification.

The package is generated from the API contract (see [Versioning](#versioning)), ships ES module and CommonJS builds with type declarations, and has no runtime dependencies.

- [API reference for every method](api.md)
- [Documentation](https://www.desktopaccountingapi.com/docs/)
- [Runnable examples](https://github.com/DesktopAccountingAPI/examples/tree/main/node)

## Requirements

- Node.js 20 or later. The client uses the platform `fetch`, `AbortSignal` and WebCrypto, so it also runs in Bun, Deno and Cloudflare Workers.
- TypeScript 5.7 or later if you use TypeScript (optional).

## Install

```sh
npm install @desktopaccountingapi/quickbooks-desktop
```

### Install from source

```sh
npm install github:DesktopAccountingAPI/quickbooks-desktop-node
```

npm installs the development dependencies and builds `dist/` through the `prepare` script. To work on the SDK itself:

```sh
git clone https://github.com/DesktopAccountingAPI/quickbooks-desktop-node.git
cd quickbooks-desktop-node
mise install        # pinned Node.js
mise run check      # install, build, tests, conformance suite, examples
```

## Quickstart

```ts
import { DesktopAccountingApi } from "@desktopaccountingapi/quickbooks-desktop";

// Reads DAAPI_SECRET_KEY (and DAAPI_BASE_URL, if set) from the environment.
const client = new DesktopAccountingApi().forEndUser("eu_01j9...");

const health = await client.qbd.healthCheck();
console.log(health.quickbooks.companyName);

for await (const invoice of client.qbd.invoices.list({ limit: 50 })) {
  console.log(invoice.refNumber, invoice.subtotal); // subtotal is a decimal string, for example "105.50"
}
```

CommonJS works the same way:

```js
const { DesktopAccountingApi } = require("@desktopaccountingapi/quickbooks-desktop");
```

`DesktopAccountingApi` is also the default export.

## Configuration

| Option | Environment variable | Default | Meaning |
| --- | --- | --- | --- |
| `apiKey` | `DAAPI_SECRET_KEY` | none (required) | Secret key `sk_live_...` or `sk_test_...`. Checked locally (format and checksum) before any request; an invalid key throws `DaapiError`. |
| `baseUrl` | `DAAPI_BASE_URL` | `https://api.desktopaccountingapi.com` | API host without `/v1`. May include a path. Staging: `https://api-staging.desktopaccountingapi.com`. |
| `endUserId` | | none | Default end user for QuickBooks Desktop operations. |
| `timeout` | | `100000` | Client-side timeout per HTTP attempt, in milliseconds. Also the total time the SDK waits for a pending request (see [Timeouts](#timeouts)). |
| `maxRetries` | | `2` | Retries after network errors, 429 and retryable 5xx responses. `0` disables retries. |
| `serverTimeout` | | server default | `Daapi-Timeout-Seconds` (1-300) on operations that accept it: how long the API waits for QuickBooks before answering `504`. |
| `fetch` | | `globalThis.fetch` | Custom transport: `(url, init) => Promise<Response>`. Use it for proxies, instrumentation or tests. |
| `logger` | | none | `{ debug(message, fields), warn(message, fields) }`. Receives method, path, status, request ID, attempt and duration. Never receives the API key, headers or bodies. |

Every method takes per-call options as its last argument:

```ts
await client.qbd.invoices.retrieve("7-1700000000", {
  endUserId: "eu_other",        // end user for this call
  timeout: 30_000,              // client-side timeout (ms)
  maxRetries: 0,
  serverTimeout: 30,            // Daapi-Timeout-Seconds
  signal: abortController.signal,
});
```

`client.withOptions({ ... })` returns a copy with other options; it shares the same transport.

## End users

QuickBooks Desktop operations act on one end user's company file and send `Daapi-End-User-Id`. Choose the end user per client or per call:

```ts
const acme = client.forEndUser("eu_01j9...");          // copy with a default end user
await acme.qbd.customers.list();
await client.qbd.customers.list({}, { endUserId: "eu_01j9..." });
```

A QuickBooks Desktop call without any end user throws `DaapiError` before sending anything. Platform operations (`client.endUsers.*`, `client.authSessions.create`, `client.requests.retrieve`) never send the header.

## Types

- Money and other decimal amounts are strings (`"52.75"`, `"5.00"`), sent and received exactly as written. Never convert them through `Number`; use a decimal library if you calculate.
- Quantities and percentages are numbers.
- Dates are `YYYY-MM-DD` strings. Timestamps are ISO 8601 strings with the offset QuickBooks reported.
- Enums in responses are open: values added later arrive as plain strings.
- In update inputs, omit a field to leave it unchanged and pass `null` to clear it (where the API allows clearing):

```ts
await client.qbd.invoices.update(id, { revisionNumber: invoice.revisionNumber, memo: null });
```

## Pagination

Lists marked as cursor lists in the [API reference](api.md) return a `PagePromise`:

```ts
// Every item, across pages.
for await (const customer of client.qbd.customers.list({ limit: 100 })) { /* ... */ }

// Only the first page.
const page = await client.qbd.customers.list({ limit: 100 });
page.data; page.nextCursor; page.hasMore; page.remainingCount; page.cursorExpiresAt;

// Page by page, or everything into an array.
for await (const p of client.qbd.customers.list().pages()) console.log(p.data.length);
const all = await client.qbd.customers.list().listAll();
```

While you iterate, the SDK requests the next page as soon as the current one arrives (one page of read-ahead), so a slow loop body stays inside the server's cursor idle window. Continuation requests send only `cursor` (and your `limit`). A network error on a continuation retries the same cursor, which returns the same page again.

A QuickBooks cursor lives only as long as its QuickBooks session. When it expires the iteration throws `CursorExpiredError` and does not restart the query, because a restart can duplicate or miss records that changed in between. The error tells you how far you got:

```ts
import { CursorExpiredError } from "@desktopaccountingapi/quickbooks-desktop";

try {
  for await (const customer of client.qbd.customers.list({ limit: 100 })) save(customer);
} catch (err) {
  if (!(err instanceof CursorExpiredError)) throw err;
  console.log(err.itemsYielded, err.pagesServed, err.lastId, err.lastUpdatedAt, err.reason);
  // Resume with a watermark and skip IDs you already saved.
  for await (const customer of client.qbd.customers.list({ limit: 100, updatedAfter: err.lastUpdatedAt ?? undefined })) save(customer);
}
```

Lists without cursor pagination return the whole list envelope (`{ objectType, url, data }`).

## Errors

Every error extends `DaapiError`:

| Class | When |
| --- | --- |
| `DaapiError` | Client-side problems: missing or invalid API key, missing end user, invalid arguments. |
| `ApiError` | Any error response from the API. Unknown error types use this class. |
| `InvalidRequestError`, `AuthenticationError`, `PermissionError`, `BillingError`, `RateLimitError`, `IntegrationConnectionError`, `IntegrationError`, `OutcomeUnknownError`, `InternalError` | One subclass of `ApiError` per error `type`. |
| `CursorExpiredError` | `InvalidRequestError` for an expired cursor, with progress fields. |
| `ApiConnectionError`, `ApiTimeoutError` | No response arrived (connection failure or client timeout) after all retries. |
| `RequestPendingError` | The request is still running in QuickBooks when the client timeout ends. It has `requestId`. |
| `WebhookVerificationError` | Webhook signature, timestamp or payload check failed. |

`ApiError` exposes every field of the error object: `status` (HTTP status), `type`, `code`, `message`, `userFacingMessage`, `httpStatusCode`, `integrationCode`, `requestId`, `errorCause` (the error object's `cause` field; `Error.cause` stays the JavaScript error chain), `fixes` (`{ actor, action }[]`), `docsUrl`, `retryable`, `outcome`, `param`, `details`, and the response `headers`.

```ts
import { ErrorCode, IntegrationConnectionError, IntegrationError } from "@desktopaccountingapi/quickbooks-desktop";

try {
  await client.qbd.customers.retrieve("80000099-1700000000");
} catch (err) {
  if (err instanceof IntegrationConnectionError && err.code === ErrorCode.QBD_MODAL_DIALOG_OPEN) {
    showToEndUser(err.userFacingMessage);
  } else if (err instanceof IntegrationError) {
    console.log(err.code, err.integrationCode, err.fixes, err.docsUrl, err.requestId);
  } else throw err;
}
```

`ErrorCode` and `ErrorType` hold every code and type in the contract.

## Retries and idempotency

Every write (create, update, delete, void, passthrough, auth session) sends an `Idempotency-Key`. The SDK generates a UUID once per call and reuses it on every retry of that call, so a retried write cannot create a duplicate. Pass your own key to make a write idempotent across processes:

```ts
await client.qbd.invoices.create(input, { idempotencyKey: `order-${order.id}-invoice` });
```

The SDK retries (up to `maxRetries`, default 2):

- network errors before a response (connection failure, reset, dropped connection, client timeout), for reads and writes (writes keep their key);
- `429` responses;
- `5xx` responses with `Daapi-Should-Retry: true`.

It never retries when the response says `Daapi-Should-Retry: false`, when the error's `outcome` is `unknown` or `pending`, or when a `5xx` body is not a JSON error. Backoff is 0.5 s doubling up to 8 s, with jitter; `Retry-After` (seconds or an HTTP date, up to 60 s) takes precedence.

## Timeouts

There are two timeouts:

- `timeout` (client, milliseconds, default 100 000) limits each HTTP attempt.
- `serverTimeout` (server, seconds) is how long the API waits for QuickBooks before it answers. The server default is 90 seconds (60 for the health check).

If QuickBooks is still working when the server timeout ends, the API answers `504 QBD_REQUEST_TIMEOUT` with the request ID. The SDK does not resubmit. It long-polls `GET /v1/requests/{id}` until the call's client timeout (measured from the start of the call) and then returns the typed result, throws the request's typed error, or throws `RequestPendingError` with `requestId`. You can check the request later with `client.requests.retrieve(err.requestId)`.

## Async requests

Operations that can run asynchronously accept `{ async: true }`. The API answers `202 Accepted` at once and the call returns a `RequestHandle`:

```ts
const handle = await client.qbd.invoices.create(input, { async: true, queueTtl: 3600 });
handle.id;              // "req_..."
handle.request.status;  // "queued"
await handle.status();  // current request resource
const invoice = await handle.wait({ timeout: 120_000 }); // typed Invoice, or throws the typed error
await handle.result();  // one check: result, typed error, or RequestPendingError
```

`queueTtl` (`Daapi-Queue-Ttl-Seconds`) is the latest time the request may still be sent to QuickBooks. Completion is also delivered by webhook.

## Webhooks

Webhooks follow [Standard Webhooks](https://www.standardwebhooks.com/). Verify the raw request body with the endpoint's signing secret (`whsec_...`); no API key is needed:

```ts
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

The helper accepts the secret with or without the `whsec_` prefix, any header case, several signatures during secret rotation, and timestamps within 300 seconds of your clock (`{ toleranceSeconds }` changes that; `{ now }` injects a clock for tests). The same functions are available as `client.webhooks.verify(...)`, `verifyWebhookSignature(...)` (signature only) and `signWebhook(...)` (to sign test events). They use WebCrypto and are therefore async; they work in Node.js, Bun, Deno, Cloudflare Workers and browsers. Deduplicate on `event.id`: delivery is at least once.

## Raw responses

Every non-paginated method returns an `APIPromise`. Besides awaiting it for the data:

```ts
const { data, response, requestId } = await client.qbd.customers.retrieve(id).withResponse();
response.status;
response.headers.get("daapi-warnings");

const raw: Response = await client.qbd.customers.retrieve(id).asResponse(); // body not read
```

For cursor lists, `client.qbd.customers.list().withResponse()` returns the first page with its response.

## Passthrough

Send qbXML messages the SDK does not model, as JSON or as raw XML:

```ts
const json = await client.endUsers.passthrough("eu_01j9...", { CustomerQueryRq: { MaxReturned: 5 } });
const xml = await client.endUsers.passthroughXml("eu_01j9...", "<QBXMLMsgsRq><CustomerQueryRq><MaxReturned>5</MaxReturned></CustomerQueryRq></QBXMLMsgsRq>");
```

Passthrough is a write when any message is not a query, so it always sends an idempotency key.

## Versioning

The SDK follows semantic versioning. The API is versioned in the path (`/v1`); within `v1` the API only adds operations, fields, enum values and error codes, and the SDK tolerates all of them.

Each release records the exact contract it was generated from in `.daapi-sdk.json` (contract sha256 `1cc3058cecb5...`, generator version, operation count) and exports it as `CONTRACT_SHA256` and `API_VERSION`. `VERSION` is the package version, also sent as `User-Agent: desktopaccountingapi-node/<version>`.

## Development

| Command | What it does |
| --- | --- |
| `mise run check` | Everything CI runs: `npm ci`, strict type check, build, unit tests, conformance suite, examples, import/require smoke test, package contents check, publish dry run. |
| `npm test` | Unit tests (`node --test`, Node.js type stripping). |
| `npm run test:conformance` | The cross-language conformance suite against `conformance/mock-server.mjs`. |
| `NODE_TEST_VERSION=20 mise run test:node` | Compiled tests and smoke test on another Node.js version. |
| `bash scripts/publish.sh --dry-run` | Build and pack; show what a release would upload. |

Files under `src/generated/`, `api.md` and `conformance/fixtures/` are generated; change the generator, not these files. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

QuickBooks is a registered trademark of Intuit Inc. Desktop Accounting API is an independent product and is not affiliated with, endorsed by, or approved by Intuit Inc.
