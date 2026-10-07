// Cross-language conformance suite (conformance/README.md). Starts conformance/mock-server.mjs,
// runs every scenario in conformance/fixtures/scenarios.json through the SDK's real HTTP stack,
// checks the mock server's verification endpoint, and runs every webhook and API-key vector.
//
//   node --test test/conformance.test.ts

import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { after, before, describe, test } from "node:test";
import {
  ApiConnectionError,
  ApiError,
  AuthenticationError,
  BillingError,
  CursorExpiredError,
  DaapiError,
  DesktopAccountingApi,
  IntegrationConnectionError,
  IntegrationError,
  InternalError,
  InvalidRequestError,
  isValidApiKey,
  OutcomeUnknownError,
  PermissionError,
  RateLimitError,
  RequestPendingError,
  verifyWebhook,
  verifyWebhookSignature,
  WebhookVerificationError,
  type ClientOptions,
  type CursorPage,
  type RequestHandle,
  type RequestOptions,
} from "../src/index.ts";
import { OPERATIONS } from "../src/generated/operations.ts";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

interface Scenario {
  name: string;
  description?: string;
  only?: string[];
  client?: {
    apiKey?: string;
    endUserId?: string | null;
    maxRetries?: number;
    timeoutMs?: number;
    baseUrlSuffix?: string;
    defaultHeaders?: Record<string, string>;
    totalTimeoutMs?: number;
  };
  call: {
    op: string;
    kind: "call" | "iterate" | "firstPage" | "withResponse" | "enqueue";
    path?: Record<string, string>;
    params?: JsonObject;
    options?: { idempotencyKey?: string; endUserId?: string; conductorEndUserId?: string; timeoutMs?: number; serverTimeoutSeconds?: number };
    take?: number;
    wait?: { timeoutMs?: number };
  };
  outcome: {
    result?: Record<string, Json>;
    items?: string[];
    page?: { ids?: string[]; nextCursor?: string | null; hasMore?: boolean; remainingCount?: number | null };
    handle?: { id?: string; status?: string };
    response?: { status?: number; requestId?: string; headers?: Record<string, string> };
    error?: Record<string, Json>;
  };
}

interface Fixtures {
  apiKey: string;
  defaultClient: { endUserId: string | null; maxRetries: number; timeoutMs: number };
  scenarios: Scenario[];
}

const root = process.cwd();
const fixturesDir = join(root, "conformance", "fixtures");
const fixtures = JSON.parse(readFileSync(join(fixturesDir, "scenarios.json"), "utf8")) as Fixtures;
const webhooks = JSON.parse(readFileSync(join(fixturesDir, "webhooks.json"), "utf8")) as {
  cases: Array<{
    name: string;
    body: string;
    headers: Record<string, string>;
    secret: string;
    now: number;
    valid: boolean;
    signatureOnly?: boolean;
    event?: { id: string; type: string; timestamp: string; projectId: string; dataStatus: string; dataId: string };
  }>;
};
const apiKeys = JSON.parse(readFileSync(join(fixturesDir, "api-keys.json"), "utf8")) as { valid: string[]; invalid: Array<{ key: string; reason: string }> };

/** Canonical error class names (conformance/README.md) to Node.js classes. */
const ERROR_CLASSES: Record<string, abstract new (...args: never[]) => Error> = {
  DaapiError,
  ApiError,
  InvalidRequestError,
  AuthenticationError,
  PermissionError,
  BillingError,
  RateLimitError,
  IntegrationConnectionError,
  IntegrationError,
  OutcomeUnknownError,
  InternalError,
  CursorExpiredError,
  RequestPendingError,
  ApiConnectionError,
};

/** Conformance field names to SDK property names (`cause` is `errorCause` in Node.js). */
const ERROR_FIELDS: Record<string, string> = { cause: "errorCause" };

let server: ChildProcess;
let baseUrl = "";

before(async () => {
  server = spawn(process.execPath, [join(root, "conformance", "mock-server.mjs"), "--exit-on-stdin-close"], { stdio: ["pipe", "pipe", "inherit"] });
  const lines = createInterface({ input: server.stdout! });
  baseUrl = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.once("exit", (code) => reject(new Error(`mock server exited with ${code}`)));
    lines.once("line", (line) => {
      const m = /^MOCK_SERVER_URL=(.+)$/.exec(line.trim());
      if (m?.[1]) resolve(m[1]);
      else reject(new Error(`unexpected mock server output: ${line}`));
    });
  });
});

after(() => {
  server.stdin?.end();
  server.kill("SIGTERM");
});

function get(value: unknown, path: string): unknown {
  let cur = value;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** Serializes the SDK's typed result back to wire JSON with the SDK's own representation (plain JSON). */
function toWire(value: unknown): unknown {
  return value === undefined ? undefined : (JSON.parse(JSON.stringify(value)) as unknown);
}

function subset(actual: unknown, expected: unknown, where: string): void {
  if (expected !== null && typeof expected === "object" && !Array.isArray(expected)) {
    assert.ok(actual !== null && typeof actual === "object", `${where}: expected an object`);
    for (const [k, v] of Object.entries(expected)) subset((actual as Record<string, unknown>)[k], v, `${where}.${k}`);
    return;
  }
  assert.deepEqual(actual, expected, where);
}

function checkError(err: unknown, expected: Record<string, Json>): void {
  const cls = ERROR_CLASSES[String(expected["class"])];
  assert.ok(cls, `unknown canonical error class ${String(expected["class"])}`);
  assert.ok(err instanceof cls, `expected ${String(expected["class"])}, got ${err instanceof Error ? `${err.constructor.name}: ${err.message}` : String(err)}`);
  if (expected["class"] === "ApiError") assert.equal((err as object).constructor, ApiError, "an unknown error type must use the base ApiError class");
  for (const [key, value] of Object.entries(expected)) {
    if (key === "class") continue;
    const field: string = ERROR_FIELDS[key] ?? key;
    const actual: unknown = (err as unknown as Record<string, unknown>)[field];
    if (key === "details") subset(actual, value, "error.details");
    else assert.deepEqual(toWire(actual), value, `error.${key}`);
  }
}

function makeClient(sc: Scenario): DesktopAccountingApi {
  const c = sc.client ?? {};
  const d = fixtures.defaultClient;
  const endUserId = "endUserId" in c ? c.endUserId : d.endUserId;
  const options: ClientOptions = {
    apiKey: c.apiKey ?? fixtures.apiKey,
    baseUrl: `${baseUrl}/s/${sc.name}${c.baseUrlSuffix ?? ""}`,
    endUserId: endUserId ?? null,
    maxRetries: "maxRetries" in c ? c.maxRetries : d.maxRetries,
    timeout: "timeoutMs" in c ? c.timeoutMs : d.timeoutMs,
  };
  if (c.defaultHeaders) options.defaultHeaders = c.defaultHeaders;
  if (c.totalTimeoutMs !== undefined) options.totalTimeout = c.totalTimeoutMs;
  return new DesktopAccountingApi(options);
}

type AnyMethod = (...args: unknown[]) => unknown;

function method(client: DesktopAccountingApi, op: string): AnyMethod {
  const parts = op.split(".");
  let owner: unknown = client;
  for (const p of parts.slice(0, -1)) owner = (owner as Record<string, unknown>)[p];
  const fn = (owner as Record<string, unknown>)[parts[parts.length - 1]!];
  assert.equal(typeof fn, "function", `no SDK method for ${op}`);
  return (fn as AnyMethod).bind(owner);
}

interface Observed {
  result?: unknown;
  items: Array<{ id?: unknown }>;
  page?: CursorPage<{ id: string }>;
  handle?: RequestHandle<unknown>;
  response?: Response;
  requestId?: string | null;
  error?: unknown;
}

async function runScenario(sc: Scenario): Promise<Observed> {
  const observed: Observed = { items: [] };
  let client: DesktopAccountingApi;
  try {
    client = makeClient(sc);
  } catch (err) {
    observed.error = err;
    return observed;
  }
  const spec = OPERATIONS[sc.call.op as keyof typeof OPERATIONS];
  assert.ok(spec, `unknown operation ${sc.call.op}`);
  const o = sc.call.options ?? {};
  const options: RequestOptions = {};
  if (o.idempotencyKey !== undefined) options.idempotencyKey = o.idempotencyKey;
  if (o.endUserId !== undefined) options.endUserId = o.endUserId;
  if (o.conductorEndUserId !== undefined) options.conductorEndUserId = o.conductorEndUserId;
  if (o.timeoutMs !== undefined) options.timeout = o.timeoutMs;
  if (o.serverTimeoutSeconds !== undefined) options.serverTimeout = o.serverTimeoutSeconds;
  const args: unknown[] = spec.pathParams.map((p) => sc.call.path?.[p]);
  // Params are wire JSON; in the Node.js SDK decimals and dates are already strings, and a key
  // present with null is an explicit null.
  if (spec.params) args.push(sc.call.params ?? {});
  const fn = method(client, sc.call.op);
  try {
    switch (sc.call.kind) {
      case "call":
        observed.result = await (fn(...args, options) as Promise<unknown>);
        break;
      case "withResponse": {
        const r = await (fn(...args, options) as { withResponse(): Promise<{ data: unknown; response: Response; requestId: string | null }> }).withResponse();
        observed.result = r.data;
        observed.response = r.response;
        observed.requestId = r.requestId;
        break;
      }
      case "firstPage":
        observed.page = await (fn(...args, options) as Promise<CursorPage<{ id: string }>>);
        break;
      case "iterate":
        for await (const item of fn(...args, options) as AsyncIterable<{ id?: unknown }>) {
          observed.items.push(item);
          if (sc.call.take !== undefined && observed.items.length >= sc.call.take) break;
        }
        break;
      case "enqueue": {
        const handle = await (fn(...args, { ...options, async: true }) as Promise<RequestHandle<unknown>>);
        observed.handle = handle;
        observed.result = await handle.wait({ timeout: sc.call.wait?.timeoutMs });
        break;
      }
    }
  } catch (err) {
    observed.error = err;
  }
  return observed;
}

function checkOutcome(sc: Scenario, observed: Observed): void {
  const out = sc.outcome;
  if (out.error) {
    assert.ok(observed.error !== undefined, "expected the call to raise");
    checkError(observed.error, out.error);
  } else if (observed.error !== undefined) {
    throw observed.error;
  }
  if (out.result) {
    const wire = toWire(observed.result);
    for (const [path, value] of Object.entries(out.result)) assert.deepEqual(get(wire, path), value, `result.${path}`);
  }
  if (out.items) assert.deepEqual(observed.items.map((i) => i.id), out.items, "items");
  if (out.page) {
    const page = observed.page;
    assert.ok(page, "expected a page");
    if (out.page.ids) assert.deepEqual(page.data.map((i) => i.id), out.page.ids, "page.ids");
    if ("nextCursor" in out.page) assert.equal(page.nextCursor, out.page.nextCursor, "page.nextCursor");
    if ("hasMore" in out.page) assert.equal(page.hasMore, out.page.hasMore, "page.hasMore");
    if ("remainingCount" in out.page) assert.equal(page.remainingCount, out.page.remainingCount, "page.remainingCount");
  }
  if (out.handle) {
    assert.ok(observed.handle, "expected a request handle");
    if (out.handle.id !== undefined) assert.equal(observed.handle.id, out.handle.id, "handle.id");
    if (out.handle.status !== undefined) assert.equal(observed.handle.request.status, out.handle.status, "handle.status");
  }
  if (out.response) {
    assert.ok(observed.response, "expected a response");
    if (out.response.status !== undefined) assert.equal(observed.response.status, out.response.status, "response.status");
    if (out.response.requestId !== undefined) assert.equal(observed.requestId, out.response.requestId, "response.requestId");
    for (const [name, value] of Object.entries(out.response.headers ?? {})) assert.equal(observed.response.headers.get(name), value, `response.headers.${name}`);
  }
}

describe("scenarios", () => {
  for (const sc of fixtures.scenarios) {
    test(sc.name, { skip: sc.only !== undefined && !sc.only.includes("node") }, async () => {
      const reset = await fetch(`${baseUrl}/_control/reset/${sc.name}`, { method: "POST" });
      assert.equal(reset.status, 204);
      const observed = await runScenario(sc);
      const verify = (await (await fetch(`${baseUrl}/_control/verify/${sc.name}`)).json()) as { ok: boolean; errors: string[] };
      assert.ok(verify.ok, `mock server: ${verify.errors.join("; ")}`);
      checkOutcome(sc, observed);
    });
  }
});

describe("webhook vectors", () => {
  for (const c of webhooks.cases) {
    test(c.name, async () => {
      const options = { now: () => c.now };
      if (!c.valid) {
        await assert.rejects(verifyWebhook(c.body, c.headers, c.secret, options), WebhookVerificationError);
        return;
      }
      if (c.signatureOnly) {
        await verifyWebhookSignature(c.body, c.headers, c.secret, options);
        return;
      }
      const event = await new DesktopAccountingApi({ apiKey: fixtures.apiKey }).webhooks.verify(c.body, c.headers, c.secret, options);
      assert.ok(c.event);
      assert.equal(event.id, c.event.id);
      assert.equal(event.type, c.event.type);
      assert.equal(event.timestamp, c.event.timestamp);
      assert.equal(event.projectId, c.event.projectId);
      assert.equal(event.data["status"], c.event.dataStatus);
      assert.equal(event.data["id"], c.event.dataId);
    });
  }
});

describe("api-key vectors", () => {
  for (const key of apiKeys.valid) {
    test(`valid ${key.slice(0, 8)}...`, () => {
      assert.ok(isValidApiKey(key));
      assert.doesNotThrow(() => new DesktopAccountingApi({ apiKey: key, baseUrl: "http://127.0.0.1:9" }));
    });
  }
  for (const { key, reason } of apiKeys.invalid) {
    test(`invalid: ${reason}`, () => {
      assert.ok(!isValidApiKey(key));
      // An empty key falls back to DAAPI_SECRET_KEY; make sure that is unset for this check.
      const saved = process.env["DAAPI_SECRET_KEY"];
      delete process.env["DAAPI_SECRET_KEY"];
      try {
        assert.throws(() => new DesktopAccountingApi({ apiKey: key, baseUrl: "http://127.0.0.1:9" }), DaapiError);
      } finally {
        if (saved !== undefined) process.env["DAAPI_SECRET_KEY"] = saved;
      }
    });
  }
});
