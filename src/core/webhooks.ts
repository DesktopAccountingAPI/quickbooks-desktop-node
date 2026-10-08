// Webhook verification (Standard Webhooks). Hand-written runtime.
//
// Uses WebCrypto (`globalThis.crypto.subtle`), so it runs unchanged in Node.js 20+, Bun, Deno,
// Cloudflare Workers and browsers. Verification is therefore async.

import { WebhookVerificationError } from "./errors.ts";
import { getHeader, type HeadersLike } from "./http.ts";

/** Event types documented in API version 1. New types are added without a version change. */
export const WebhookEventType = {
  REQUEST_SUCCEEDED: "request.succeeded",
  REQUEST_FAILED: "request.failed",
  REQUEST_CANCELED: "request.canceled",
  REQUEST_OUTCOME_UNKNOWN: "request.outcome_unknown",
  REQUEST_OUTCOME_RESOLVED: "request.outcome_resolved",
  CONNECTION_SETUP_COMPLETED: "connection.setup_completed",
  CONNECTION_STATUS_CHANGED: "connection.status_changed",
  CONNECTION_COMPANY_FILE_REMARKED: "connection.company_file_remarked",
  WEBHOOK_TEST: "webhook.test",
} as const;

/** A known event type name, or any future one (passed through unchanged). */
export type WebhookEventType = (typeof WebhookEventType)[keyof typeof WebhookEventType] | (string & {});

/** A verified webhook event. `data` is the event payload as JSON. */
export interface WebhookEvent<D = Record<string, unknown>> {
  /** Event ID (`evt_...`), also the `webhook-id` header. Deduplicate on it: delivery is at least once. */
  id: string;
  type: WebhookEventType;
  /** When the event happened (ISO 8601). */
  timestamp: string;
  projectId: string;
  data: D;
}

export interface WebhookVerifyOptions {
  /** Allowed clock difference in seconds, in both directions. Default 300. */
  toleranceSeconds?: number | undefined;
  /** Clock override for tests: returns the current time in Unix seconds. */
  now?: (() => number) | undefined;
}

/** Payload as received: the exact raw body string or bytes. Never a re-serialized object. */
export type WebhookPayload = string | Uint8Array | ArrayBuffer;

const DEFAULT_TOLERANCE_SECONDS = 300;
const encoder = new TextEncoder();

function subtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) throw new WebhookVerificationError("WebCrypto (globalThis.crypto.subtle) is not available in this runtime");
  return c.subtle;
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function secretBytes(secret: string): Uint8Array<ArrayBuffer> {
  const raw = secret.trim().startsWith("whsec_") ? secret.trim().slice("whsec_".length) : secret.trim();
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = base64ToBytes(raw);
  } catch {
    throw new WebhookVerificationError("Webhook secret is not valid base64 (expected whsec_<base64>)");
  }
  if (bytes.length === 0) throw new WebhookVerificationError("Webhook secret is empty");
  return bytes;
}

function payloadBytes(payload: WebhookPayload): Uint8Array {
  if (typeof payload === "string") return encoder.encode(payload);
  return payload instanceof Uint8Array ? payload : new Uint8Array(payload);
}

function signedContent(id: string, timestamp: string, body: Uint8Array): Uint8Array<ArrayBuffer> {
  const prefix = encoder.encode(`${id}.${timestamp}.`);
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix, 0);
  out.set(body, prefix.length);
  return out;
}

function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return subtle().importKey("raw", secretBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

/**
 * Verifies the `webhook-signature` header of a delivery without parsing the body.
 * Checks the `webhook-id`, `webhook-timestamp` and `webhook-signature` headers (any case), the
 * timestamp tolerance, and accepts any of several space-separated `v1,<signature>` entries
 * (secret rotation). The comparison is constant-time (`crypto.subtle.verify`).
 *
 * @param secret the endpoint's signing secret, with or without the `whsec_` prefix
 * @throws WebhookVerificationError
 */
export async function verifyWebhookSignature(payload: WebhookPayload, headers: HeadersLike, secret: string, options: WebhookVerifyOptions = {}): Promise<void> {
  const id = getHeader(headers, "webhook-id");
  const timestamp = getHeader(headers, "webhook-timestamp");
  const signature = getHeader(headers, "webhook-signature");
  if (!id || !timestamp || !signature) throw new WebhookVerificationError("Missing webhook-id, webhook-timestamp or webhook-signature header");
  if (!/^\d+$/.test(timestamp.trim())) throw new WebhookVerificationError("Invalid webhook-timestamp header");
  const now = options.now ? options.now() : Math.floor(Date.now() / 1000);
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const sent = Number(timestamp.trim());
  if (now - sent > tolerance) throw new WebhookVerificationError("Webhook timestamp is too old");
  if (sent - now > tolerance) throw new WebhookVerificationError("Webhook timestamp is too far in the future");

  const candidates: Uint8Array<ArrayBuffer>[] = [];
  for (const entry of signature.split(" ")) {
    const comma = entry.indexOf(",");
    if (comma < 0 || entry.slice(0, comma) !== "v1") continue;
    try {
      candidates.push(base64ToBytes(entry.slice(comma + 1)));
    } catch {
      // Not base64: cannot match.
    }
  }
  if (candidates.length === 0) throw new WebhookVerificationError("No v1 signature in webhook-signature header");

  const key = await hmacKey(secret, "verify");
  const content = signedContent(id, timestamp.trim(), payloadBytes(payload));
  for (const candidate of candidates) {
    if (await subtle().verify("HMAC", key, candidate, content)) return;
  }
  throw new WebhookVerificationError("No matching webhook signature");
}

/**
 * Verifies a delivery (see {@link verifyWebhookSignature}) and parses it into a {@link WebhookEvent}.
 * Pass the raw request body exactly as received.
 *
 * @throws WebhookVerificationError
 */
export async function verifyWebhook<D = Record<string, unknown>>(payload: WebhookPayload, headers: HeadersLike, secret: string, options: WebhookVerifyOptions = {}): Promise<WebhookEvent<D>> {
  await verifyWebhookSignature(payload, headers, secret, options);
  const text = typeof payload === "string" ? payload : new TextDecoder().decode(payloadBytes(payload));
  let event: unknown;
  try {
    event = JSON.parse(text);
  } catch {
    throw new WebhookVerificationError("Webhook body is not JSON");
  }
  const e = event as Partial<WebhookEvent<D>> | null;
  if (typeof e !== "object" || e === null || typeof e.id !== "string" || typeof e.type !== "string") {
    throw new WebhookVerificationError("Webhook body is not a Desktop Accounting API event");
  }
  return e as WebhookEvent<D>;
}

/**
 * Signs a payload the way the API does: returns the three Standard Webhooks headers.
 * For tests and local receivers (for example to send yourself a sample event).
 */
export async function signWebhook(payload: WebhookPayload, secret: string, options: { id: string; timestamp?: number | undefined }): Promise<Record<"webhook-id" | "webhook-timestamp" | "webhook-signature", string>> {
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
  const key = await hmacKey(secret, "sign");
  const mac = new Uint8Array(await subtle().sign("HMAC", key, signedContent(options.id, timestamp, payloadBytes(payload))));
  return { "webhook-id": options.id, "webhook-timestamp": timestamp, "webhook-signature": `v1,${bytesToBase64(mac)}` };
}

/** `client.webhooks`: the same helpers, bound to nothing (no API key needed). */
export class Webhooks {
  /** {@link verifyWebhook} */
  verify<D = Record<string, unknown>>(payload: WebhookPayload, headers: HeadersLike, secret: string, options?: WebhookVerifyOptions): Promise<WebhookEvent<D>> {
    return verifyWebhook<D>(payload, headers, secret, options);
  }

  /** {@link verifyWebhookSignature} */
  verifySignature(payload: WebhookPayload, headers: HeadersLike, secret: string, options?: WebhookVerifyOptions): Promise<void> {
    return verifyWebhookSignature(payload, headers, secret, options);
  }

  /** {@link signWebhook} */
  sign(payload: WebhookPayload, secret: string, options: { id: string; timestamp?: number | undefined }): ReturnType<typeof signWebhook> {
    return signWebhook(payload, secret, options);
  }
}
