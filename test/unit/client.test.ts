// Unit tests for the client over a scripted fetch: configuration, headers, idempotency keys,
// omit vs null, decimals, raw responses, async mode, pagination and logging.

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import {
  ApiConnectionError,
  ApiTimeoutError,
  CursorExpiredError,
  DaapiError,
  DesktopAccountingApi,
  IntegrationConnectionError,
  RequestHandle,
  RequestPendingError,
  VERSION,
  type Invoice,
  type Logger,
} from "../../src/index.ts";
import DefaultExport from "../../src/index.ts";
import { apiError, client, END_USER, invoice, json, page, requestResource, scriptedFetch, TEST_KEY } from "./helpers.ts";

let savedKey: string | undefined;
let savedBase: string | undefined;
beforeEach(() => {
  savedKey = process.env["DAAPI_SECRET_KEY"];
  savedBase = process.env["DAAPI_BASE_URL"];
  delete process.env["DAAPI_SECRET_KEY"];
  delete process.env["DAAPI_BASE_URL"];
});
afterEach(() => {
  if (savedKey === undefined) delete process.env["DAAPI_SECRET_KEY"];
  else process.env["DAAPI_SECRET_KEY"] = savedKey;
  if (savedBase === undefined) delete process.env["DAAPI_BASE_URL"];
  else process.env["DAAPI_BASE_URL"] = savedBase;
});

describe("configuration", () => {
  test("default export is the client class", () => {
    assert.equal(DefaultExport, DesktopAccountingApi);
  });

  test("missing key names DAAPI_SECRET_KEY", () => {
    assert.throws(() => new DesktopAccountingApi(), (e: unknown) => e instanceof DaapiError && /DAAPI_SECRET_KEY/.test(e.message));
  });

  test("invalid key fails locally without echoing it", () => {
    const bad = TEST_KEY.slice(0, -1) + "A";
    assert.throws(() => new DesktopAccountingApi({ apiKey: bad }), (e: unknown) => e instanceof DaapiError && !e.message.includes(bad) && e.message.includes("...QFLA"));
  });

  test("reads key and base URL from the environment", () => {
    process.env["DAAPI_SECRET_KEY"] = TEST_KEY;
    process.env["DAAPI_BASE_URL"] = "http://127.0.0.1:1/s/x/";
    const c = new DesktopAccountingApi();
    assert.equal(c.baseUrl, "http://127.0.0.1:1/s/x");
    assert.equal(c.timeout, 100_000);
    assert.equal(c.maxRetries, 2);
  });

  test("default base URL is production", () => {
    assert.equal(new DesktopAccountingApi({ apiKey: TEST_KEY }).baseUrl, "https://api.desktopaccountingapi.com");
  });

  test("forEndUser and withOptions return copies that share the transport", async () => {
    const { fetch, calls } = scriptedFetch([json(200, { status: "ok", duration: 1, quickbooks: {} }), json(200, { status: "ok", duration: 1, quickbooks: {} })]);
    const base = client(fetch, { endUserId: null });
    const scoped = base.forEndUser("eu_other");
    assert.ok(scoped instanceof DesktopAccountingApi);
    assert.equal(base.endUserId, undefined);
    await scoped.qbd.healthCheck();
    await scoped.withOptions({ serverTimeout: 30 }).qbd.healthCheck();
    assert.equal(calls[0]?.headers.get("daapi-end-user-id"), "eu_other");
    assert.equal(calls[1]?.headers.get("daapi-end-user-id"), "eu_other");
    assert.equal(calls[1]?.headers.get("daapi-timeout-seconds"), "30");
  });
});

describe("headers", () => {
  test("auth, user agent and end user on QuickBooks operations; no idempotency key on reads", async () => {
    const { fetch, calls } = scriptedFetch([json(200, invoice("1"))]);
    await client(fetch).qbd.invoices.retrieve("1");
    const h = calls[0]!.headers;
    assert.equal(calls[0]!.url.pathname, "/base/v1/quickbooks-desktop/invoices/1");
    assert.equal(h.get("authorization"), `Bearer ${TEST_KEY}`);
    assert.equal(h.get("user-agent"), `desktopaccountingapi-node/${VERSION}`);
    assert.equal(h.get("daapi-end-user-id"), END_USER);
    assert.equal(h.get("idempotency-key"), null);
    assert.equal(h.get("prefer"), null);
    assert.equal(h.get("daapi-timeout-seconds"), null);
    for (const name of h.keys()) if (name.startsWith("daapi-")) assert.ok(["daapi-end-user-id"].includes(name), `unexpected ${name}`);
  });

  test("platform operations never send Daapi-End-User-Id", async () => {
    const { fetch, calls } = scriptedFetch([json(200, { id: "eu_1" })]);
    await client(fetch).endUsers.retrieve("eu_1");
    assert.equal(calls[0]!.headers.get("daapi-end-user-id"), null);
  });

  test("QuickBooks operation without any end user fails before sending", async () => {
    const { fetch, calls } = scriptedFetch([]);
    await assert.rejects(client(fetch, { endUserId: null }).qbd.invoices.retrieve("1"), DaapiError);
    assert.equal(calls.length, 0);
  });

  test("per-call end user and server timeout override the client", async () => {
    const { fetch, calls } = scriptedFetch([json(200, { status: "ok" })]);
    await client(fetch, { serverTimeout: 10 }).qbd.healthCheck({ endUserId: "eu_call", serverTimeout: 30 });
    assert.equal(calls[0]!.headers.get("daapi-end-user-id"), "eu_call");
    assert.equal(calls[0]!.headers.get("daapi-timeout-seconds"), "30");
  });
});

describe("writes", () => {
  test("one generated idempotency key is reused across retries after a network error", async () => {
    const { fetch, calls } = scriptedFetch([new TypeError("fetch failed"), json(201, invoice("7"))]);
    const created = await client(fetch).qbd.invoices.create({ customerId: "c1", lines: [{ itemId: "i1", rate: "52.75", quantity: 2 }] });
    assert.equal(created.id, "7");
    assert.equal(calls.length, 2);
    const key = calls[0]!.headers.get("idempotency-key");
    assert.match(key ?? "", /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(calls[1]!.headers.get("idempotency-key"), key);
  });

  test("separate calls get separate keys; a caller key is used as is", async () => {
    const { fetch, calls } = scriptedFetch([json(200, invoice("7")), json(200, invoice("7")), json(200, invoice("7"))]);
    const c = client(fetch);
    await c.qbd.invoices.void("7");
    await c.qbd.invoices.void("7");
    await c.qbd.invoices.void("7", { idempotencyKey: "order-1" });
    assert.notEqual(calls[0]!.headers.get("idempotency-key"), calls[1]!.headers.get("idempotency-key"));
    assert.equal(calls[2]!.headers.get("idempotency-key"), "order-1");
  });

  test("omitted fields are not sent, null is sent, decimals stay strings with their scale", async () => {
    const { fetch, calls } = scriptedFetch([json(200, invoice("7", { memo: null, subtotal: "5.00" }))]);
    const updated = await client(fetch).qbd.invoices.update("7", { revisionNumber: "1", memo: null, refNumber: undefined });
    assert.equal(calls[0]!.body, '{"revisionNumber":"1","memo":null}');
    assert.equal(calls[0]!.headers.get("content-type"), "application/json");
    assert.equal(updated.subtotal, "5.00");
    assert.equal(updated.memo, null);
  });

  test("dates are sent as YYYY-MM-DD strings", async () => {
    const { fetch, calls } = scriptedFetch([json(201, invoice("7"))]);
    await client(fetch).qbd.invoices.create({ customerId: "c1", transactionDate: "2026-10-05", lines: [{ rate: "0.10" }] });
    assert.deepEqual(JSON.parse(calls[0]!.body!), { customerId: "c1", transactionDate: "2026-10-05", lines: [{ rate: "0.10" }] });
  });

  test("outcome unknown is never retried", async () => {
    const { fetch, calls } = scriptedFetch([apiError(502, { type: "OUTCOME_UNKNOWN_ERROR", code: "QBD_WRITE_OUTCOME_UNKNOWN", outcome: "unknown" }, { "Daapi-Should-Retry": "true", "Retry-After": "0" })]);
    await assert.rejects(client(fetch).qbd.invoices.void("7"), (e: unknown) => e instanceof DaapiError && (e as { outcome?: unknown }).outcome === "unknown");
    assert.equal(calls.length, 1);
  });

  test("passthrough XML sends application/xml and returns text", async () => {
    const xml = "<QBXMLMsgsRs><CustomerQueryRs statusCode=\"0\"/></QBXMLMsgsRs>";
    const { fetch, calls } = scriptedFetch([new Response(xml, { status: 200, headers: { "Content-Type": "application/xml" } })]);
    const out = await client(fetch).endUsers.passthroughXml("eu_1", "<QBXMLMsgsRq><CustomerQueryRq/></QBXMLMsgsRq>");
    assert.equal(out, xml);
    assert.equal(calls[0]!.url.pathname, "/base/v1/end-users/eu_1/passthrough/quickbooks_desktop");
    assert.equal(calls[0]!.headers.get("content-type"), "application/xml");
    assert.equal(calls[0]!.headers.get("accept"), "application/xml");
    assert.equal(calls[0]!.headers.get("daapi-end-user-id"), null);
    assert.ok(calls[0]!.headers.get("idempotency-key"));
  });
});

describe("retries and timeouts", () => {
  test("429 honors Retry-After and succeeds", async () => {
    const { fetch, calls } = scriptedFetch([apiError(429, { type: "RATE_LIMIT_ERROR", code: "RATE_LIMITED" }, { "Retry-After": "0" }), json(200, invoice("1"))]);
    const started = Date.now();
    await client(fetch).qbd.invoices.retrieve("1");
    assert.equal(calls.length, 2);
    assert.ok(Date.now() - started < 400, "Retry-After: 0 retries immediately");
  });

  test("maxRetries per call", async () => {
    const reply = (): Response => apiError(503, { type: "INTEGRATION_CONNECTION_ERROR", code: "QBD_MODAL_DIALOG_OPEN" }, { "Daapi-Should-Retry": "true", "Retry-After": "0" });
    const { fetch, calls } = scriptedFetch([reply(), reply()]);
    await assert.rejects(client(fetch).qbd.invoices.retrieve("1", { maxRetries: 1 }), IntegrationConnectionError);
    assert.equal(calls.length, 2);
  });

  test("network failure after all retries is ApiConnectionError", async () => {
    const { fetch } = scriptedFetch([new TypeError("fetch failed")]);
    await assert.rejects(client(fetch, { maxRetries: 0 }).qbd.invoices.retrieve("1"), (e: unknown) => e instanceof ApiConnectionError && !(e instanceof ApiTimeoutError));
  });

  test("client timeout is ApiTimeoutError", async () => {
    const slow = (_req: unknown): Promise<Response> => new Promise(() => undefined);
    const fetch = (_url: string, init: RequestInit): Promise<Response> =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        void slow(init);
      });
    await assert.rejects(client(fetch, { maxRetries: 0, timeout: 50 }).qbd.invoices.retrieve("1"), ApiTimeoutError);
  });

  test("caller abort stops the call", async () => {
    const fetch = (_url: string, init: RequestInit): Promise<Response> =>
      new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason)));
    const controller = new AbortController();
    const p = client(fetch).qbd.invoices.retrieve("1", { signal: controller.signal });
    controller.abort();
    await assert.rejects(p, (e: unknown) => e instanceof DaapiError && /aborted/.test(e.message));
  });

  test("504 QBD_REQUEST_TIMEOUT long-polls and raises RequestPendingError at the deadline", async () => {
    const pending = apiError(504, { type: "INTEGRATION_CONNECTION_ERROR", code: "QBD_REQUEST_TIMEOUT", outcome: "pending", details: { requestId: "req_1" } }, { "Daapi-Should-Retry": "false" });
    const poll = (req: { url: URL }): Response => {
      assert.match(req.url.searchParams.get("waitSeconds") ?? "", /^[1-9][0-9]*$/);
      return json(200, requestResource("sent"));
    };
    const { fetch, calls } = scriptedFetch([pending, poll, poll, poll, poll, poll, poll, poll, poll, poll, poll]);
    const slowPoll: typeof fetch = async (url, init) => {
      if (url.includes("/requests/")) await new Promise((r) => setTimeout(r, 40));
      return fetch(url, init);
    };
    await assert.rejects(client(slowPoll, { timeout: 150 }).qbd.invoices.create({ customerId: "c" }), (e: unknown) => e instanceof RequestPendingError && e.requestId === "req_1" && e.request?.status === "sent");
    assert.equal(calls.filter((c) => c.method === "POST").length, 1, "never resubmitted");
    assert.ok(calls.slice(1).every((c) => c.url.pathname === "/base/v1/requests/req_1" && c.headers.get("daapi-end-user-id") === null));
  });
});

describe("raw responses", () => {
  test("withResponse exposes status, headers and request ID", async () => {
    const { fetch } = scriptedFetch([json(200, invoice("1"), { "Daapi-Request-Id": "req_abc", "Daapi-Warnings": "2" })]);
    const { data, response, requestId } = await client(fetch).qbd.invoices.retrieve("1").withResponse();
    assert.equal(data.id, "1");
    assert.equal(response.status, 200);
    assert.equal(requestId, "req_abc");
    assert.equal(response.headers.get("daapi-warnings"), "2");
  });

  test("asResponse returns the unread response", async () => {
    const { fetch } = scriptedFetch([json(200, invoice("1"))]);
    const response = await client(fetch).qbd.invoices.retrieve("1").asResponse();
    assert.equal(response.bodyUsed, false);
    assert.equal(((await response.json()) as { id: string }).id, "1");
  });
});

describe("async mode", () => {
  test("sends Prefer and queue TTL, returns a handle that polls to the typed result", async () => {
    const { fetch, calls } = scriptedFetch([
      json(202, requestResource("queued"), { Location: "/v1/requests/req_1" }),
      json(200, requestResource("queued")),
      json(200, requestResource("succeeded", { result: invoice("7") })),
      json(200, requestResource("succeeded", { result: invoice("7") })),
    ]);
    const handle = await client(fetch).qbd.invoices.create({ customerId: "c" }, { async: true, queueTtl: 600 });
    assert.ok(handle instanceof RequestHandle);
    assert.equal(handle.id, "req_1");
    assert.equal(handle.request.status, "queued");
    assert.equal(calls[0]!.headers.get("prefer"), "respond-async");
    assert.equal(calls[0]!.headers.get("daapi-queue-ttl-seconds"), "600");
    assert.equal((await handle.status()).status, "queued");
    const result: Invoice = await handle.wait({ timeout: 5000 });
    assert.equal(result.id, "7");
    assert.equal((await handle.result()).id, "7");
    assert.equal(calls[1]!.url.search, "", "status() does not wait");
    assert.match(calls[2]!.url.search, /^\?waitSeconds=\d+$/);
  });

  test("result() on an unfinished request raises RequestPendingError", async () => {
    const { fetch } = scriptedFetch([json(202, requestResource("queued")), json(200, requestResource("sent"))]);
    const handle = await client(fetch).qbd.invoices.void("7", { async: true });
    await assert.rejects(handle.result(), RequestPendingError);
  });
});

describe("pagination", () => {
  test("reads one page ahead and sends only cursor and limit on continue requests", async () => {
    let releaseThird: (() => void) | undefined;
    const third = new Promise<void>((r) => (releaseThird = r));
    const { fetch, calls } = scriptedFetch([page(["1", "2"], "c2"), page(["3", "4"], "c3"), async () => (await third, page(["5"], null))]);
    const seen: string[] = [];
    const list = client(fetch).qbd.invoices.list({ customerIds: ["a", "b"], limit: 2, updatedAfter: "2026-01-01" });
    for await (const inv of list) {
      seen.push(inv.id);
      if (inv.id === "1") {
        await new Promise((r) => setTimeout(r, 10));
        assert.equal(calls.length, 2, "page 2 was requested while page 1 was being consumed");
      }
      if (inv.id === "3") {
        assert.equal(calls.length, 3);
        releaseThird?.();
      }
    }
    assert.deepEqual(seen, ["1", "2", "3", "4", "5"]);
    assert.equal(calls[0]!.url.search, "?customerIds=a&customerIds=b&limit=2&updatedAfter=2026-01-01");
    assert.equal(calls[1]!.url.search, "?cursor=c2&limit=2");
    assert.equal(calls[2]!.url.search, "?cursor=c3&limit=2");
  });

  test("continue requests omit limit when the caller did not set it", async () => {
    const { fetch, calls } = scriptedFetch([page(["1"], "c2"), page(["2"], null)]);
    assert.deepEqual((await client(fetch).qbd.invoices.list().listAll()).map((i) => i.id), ["1", "2"]);
    assert.equal(calls[1]!.url.search, "?cursor=c2");
  });

  test("awaiting the list fetches only the first page", async () => {
    const { fetch, calls } = scriptedFetch([page(["1", "2"], "c2")]);
    const first = await client(fetch).qbd.invoices.list({ limit: 2 });
    assert.deepEqual(first.data.map((i) => i.id), ["1", "2"]);
    assert.equal(first.nextCursor, "c2");
    assert.equal(calls.length, 1);
  });

  test("pages() yields page objects", async () => {
    const { fetch } = scriptedFetch([page(["1"], "c2"), page(["2"], null)]);
    const pages = [];
    for await (const p of client(fetch).qbd.invoices.list().pages()) pages.push(p.data.length);
    assert.deepEqual(pages, [1, 1]);
  });

  test("cursor expiry raises CursorExpiredError with progress and does not restart", async () => {
    const { fetch, calls } = scriptedFetch([
      page(["1", "2"], "c2"),
      page(["3"], "c3"),
      apiError(410, { type: "INVALID_REQUEST_ERROR", code: "CURSOR_EXPIRED", details: { reason: "session_ended" } }, { "Daapi-Should-Retry": "false" }),
    ]);
    const seen: string[] = [];
    await assert.rejects(
      (async () => {
        for await (const inv of client(fetch).qbd.invoices.list()) seen.push(inv.id);
      })(),
      (e: unknown) =>
        e instanceof CursorExpiredError && e.itemsYielded === 3 && e.pagesServed === 2 && e.lastId === "3" && e.lastUpdatedAt === "2026-10-05T09:11:03-07:00" && e.reason === "session_ended",
    );
    assert.deepEqual(seen, ["1", "2", "3"]);
    assert.equal(calls.length, 3);
  });
});

describe("logging", () => {
  test("logger receives method, path and status but never the key or bodies", async () => {
    const lines: string[] = [];
    const logger: Logger = {
      debug: (m, f) => lines.push(`${m} ${JSON.stringify(f)}`),
      warn: (m, f) => lines.push(`${m} ${JSON.stringify(f)}`),
    };
    const { fetch } = scriptedFetch([apiError(429, { type: "RATE_LIMIT_ERROR", code: "RATE_LIMITED" }, { "Retry-After": "0" }), json(201, invoice("7"))]);
    await client(fetch, { logger }).qbd.invoices.create({ customerId: "secret-customer", memo: "private memo" });
    const all = lines.join("\n");
    assert.match(all, /POST/);
    assert.match(all, /429/);
    assert.ok(!all.includes(TEST_KEY) && !all.includes("QFLR"), "no key");
    assert.ok(!all.includes("private memo") && !all.includes("secret-customer"), "no body");
  });
});
