// Smoke test of the built package: loads it through `import` (dist/esm) and `require` (dist/cjs)
// by its package name, constructs a client, verifies a Standard Webhooks reference vector and
// checks the version. No API key or network needed.
//
// Runs inside this repository (package self-reference) and, during release verification, inside a
// clean consumer project that installed the package from the registry:
//   node scripts/smoke.mjs [--expect-version 0.1.0]

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const NAME = "@desktopaccountingapi/quickbooks-desktop";
const i = process.argv.indexOf("--expect-version");
const expectVersion = i >= 0 ? process.argv[i + 1] : undefined;

// A valid-format test key (the conformance fixture key). It authorizes nothing.
const KEY = "sk_test_Conformance0Key0For0SDK0Tests000010nQFLR";
// Reference vector from the Standard Webhooks specification.
const VECTOR = {
  secret: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
  body: '{"test": 2432232314}',
  headers: { "webhook-id": "msg_p5jXN8AQM9LWM0D4loKWxJek", "webhook-timestamp": "1614265330", "webhook-signature": "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=" },
  now: 1614265330,
};

async function check(label, sdk) {
  const { DesktopAccountingApi, DaapiError, ApiError, IntegrationError, ErrorCode, VERSION, CONTRACT_SHA256, isValidApiKey, verifyWebhookSignature, signWebhook, verifyWebhook } = sdk;
  assert.equal(typeof DesktopAccountingApi, "function", `${label}: DesktopAccountingApi export`);
  assert.equal(sdk.default, DesktopAccountingApi, `${label}: default export`);
  if (expectVersion) assert.equal(VERSION, expectVersion, `${label}: VERSION`);
  assert.match(CONTRACT_SHA256, /^[0-9a-f]{64}$/);
  assert.ok(isValidApiKey(KEY));
  const client = new DesktopAccountingApi({ apiKey: KEY, baseUrl: "http://127.0.0.1:9" }).forEndUser("eu_smoke");
  assert.equal(typeof client.qbd.invoices.list, "function");
  assert.equal(typeof client.endUsers.passthroughXml, "function");
  assert.throws(() => new DesktopAccountingApi({ apiKey: "sk_test_wrong" }), DaapiError);
  assert.ok(new IntegrationError(400, { code: ErrorCode.QBD_MODAL_DIALOG_OPEN }) instanceof ApiError);
  await verifyWebhookSignature(VECTOR.body, VECTOR.headers, VECTOR.secret, { now: () => VECTOR.now });
  const body = JSON.stringify({ id: "evt_1", type: "webhook.test", timestamp: "2026-10-05T00:00:00Z", projectId: "proj_1", data: {} });
  const headers = await signWebhook(body, VECTOR.secret, { id: "evt_1" });
  assert.equal((await client.webhooks.verify(body, headers, VECTOR.secret)).type, "webhook.test");
  assert.equal((await verifyWebhook(body, headers, VECTOR.secret)).id, "evt_1");
  console.log(`${label}: ok (${NAME} ${VERSION})`);
}

await check("import", await import(NAME));
await check("require", createRequire(import.meta.url)(NAME));
