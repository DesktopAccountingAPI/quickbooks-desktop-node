// Unit tests for webhook signing and verification.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { signWebhook, verifyWebhook, verifyWebhookSignature, WebhookEventType, WebhookVerificationError } from "../../src/index.ts";

const SECRET = "whsec_" + Buffer.from("unit-test-webhook-secret-32bytes").toString("base64");
const NOW = 1_791_216_241;
const body = JSON.stringify({
  id: "evt_1",
  type: WebhookEventType.REQUEST_SUCCEEDED,
  timestamp: "2026-10-05T16:04:01.311Z",
  projectId: "proj_1",
  data: { objectType: "request", id: "req_1", status: "succeeded" },
});

describe("webhooks", () => {
  test("sign then verify returns the typed event", async () => {
    const headers = await signWebhook(body, SECRET, { id: "evt_1", timestamp: NOW });
    const event = await verifyWebhook(body, headers, SECRET, { now: () => NOW });
    assert.equal(event.id, "evt_1");
    assert.equal(event.type, "request.succeeded");
    assert.equal(event.data["id"], "req_1");
  });

  test("secret without the whsec_ prefix, Headers object and byte payloads", async () => {
    const headers = await signWebhook(body, SECRET, { id: "evt_1", timestamp: NOW });
    const bare = SECRET.slice("whsec_".length);
    await verifyWebhookSignature(new TextEncoder().encode(body), new Headers(headers), bare, { now: () => NOW });
  });

  test("Node.js IncomingHttpHeaders style records with mixed case", async () => {
    const h = await signWebhook(body, SECRET, { id: "evt_1", timestamp: NOW });
    await verifyWebhookSignature(body, { "Webhook-Id": h["webhook-id"], "WEBHOOK-TIMESTAMP": h["webhook-timestamp"], "webhook-signature": [h["webhook-signature"]] }, SECRET, { now: () => NOW });
  });

  test("rotation: any matching v1 signature passes, other versions are ignored", async () => {
    const good = (await signWebhook(body, SECRET, { id: "evt_1", timestamp: NOW }))["webhook-signature"];
    const other = (await signWebhook(body, "whsec_" + Buffer.from("x".repeat(32)).toString("base64"), { id: "evt_1", timestamp: NOW }))["webhook-signature"];
    const headers = { "webhook-id": "evt_1", "webhook-timestamp": String(NOW), "webhook-signature": `v2,abc ${other} ${good}` };
    await verifyWebhookSignature(body, headers, SECRET, { now: () => NOW });
  });

  test("tolerance is configurable and applies in both directions", async () => {
    const headers = await signWebhook(body, SECRET, { id: "evt_1", timestamp: NOW });
    await verifyWebhookSignature(body, headers, SECRET, { now: () => NOW + 300 });
    await assert.rejects(verifyWebhookSignature(body, headers, SECRET, { now: () => NOW + 301 }), WebhookVerificationError);
    await assert.rejects(verifyWebhookSignature(body, headers, SECRET, { now: () => NOW - 301 }), WebhookVerificationError);
    await verifyWebhookSignature(body, headers, SECRET, { now: () => NOW + 1000, toleranceSeconds: 1000 });
  });

  test("tampered body, wrong secret and bad secrets fail", async () => {
    const headers = await signWebhook(body, SECRET, { id: "evt_1", timestamp: NOW });
    await assert.rejects(verifyWebhook(body.replace("succeeded", "failed"), headers, SECRET, { now: () => NOW }), WebhookVerificationError);
    await assert.rejects(verifyWebhook(body, headers, "whsec_" + Buffer.from("y".repeat(32)).toString("base64"), { now: () => NOW }), WebhookVerificationError);
    await assert.rejects(verifyWebhook(body, headers, "whsec_***", { now: () => NOW }), WebhookVerificationError);
  });

  test("signature-only accepts non-event bodies; verify rejects them", async () => {
    const raw = "not json";
    const headers = await signWebhook(raw, SECRET, { id: "msg_1", timestamp: NOW });
    await verifyWebhookSignature(raw, headers, SECRET, { now: () => NOW });
    await assert.rejects(verifyWebhook(raw, headers, SECRET, { now: () => NOW }), WebhookVerificationError);
  });
});
