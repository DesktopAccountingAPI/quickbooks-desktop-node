// HTTP helpers: query strings, retry decisions, backoff. Hand-written runtime.

import { DaapiError } from "./errors.ts";

/** Query value types the generated parameter models use. */
type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean>;

/**
 * Builds a query string. Arrays use repeated keys (`ids=a&ids=b`, OpenAPI form/explode);
 * `undefined` and `null` are omitted; booleans are `true`/`false`.
 */
export function buildQuery(query: object | undefined): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [key, raw] of Object.entries(query as Record<string, QueryValue>)) {
    if (raw === undefined || raw === null) continue;
    const values: ReadonlyArray<string | number | boolean> = Array.isArray(raw) ? raw : [raw as string | number | boolean];
    for (const v of values) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/** Encodes one path segment. Empty values are rejected so a call never hits the collection path. */
export function encodePathParam(name: string, value: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new DaapiError(`${name} must be a non-empty string`);
  }
  return encodeURIComponent(value);
}

/**
 * Whether an error response may be retried:
 * never when `Daapi-Should-Retry: false` or the outcome is `unknown`/`pending`;
 * always on 429; on 5xx only when `Daapi-Should-Retry: true`.
 * A non-JSON 5xx without the header is not retried.
 */
export function shouldRetry(status: number, shouldRetryHeader: string | null, outcome: string | null | undefined): boolean {
  const header = shouldRetryHeader?.trim().toLowerCase() ?? null;
  if (header === "false") return false;
  if (outcome === "unknown" || outcome === "pending") return false;
  if (status === 429) return true;
  return status >= 500 && header === "true";
}

/** Longest `Retry-After` the SDK waits for; longer values fall back to exponential backoff. */
export const MAX_RETRY_AFTER_SECONDS = 60;

/**
 * Parses `Retry-After` as delay seconds (`0`, `1.5`) or an HTTP date. Returns milliseconds,
 * or undefined when the header is absent, invalid or longer than {@link MAX_RETRY_AFTER_SECONDS}.
 */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  let ms: number;
  if (/^\d+(\.\d+)?$/.test(trimmed)) ms = Number(trimmed) * 1000;
  else {
    const date = Date.parse(trimmed);
    if (Number.isNaN(date)) return undefined;
    ms = Math.max(0, date - now);
  }
  return ms <= MAX_RETRY_AFTER_SECONDS * 1000 ? ms : undefined;
}

/**
 * Delay before retry number `attempt + 1` (attempt counts from 0): `Retry-After` when present,
 * else 0.5 s * 2^attempt capped at 8 s, minus up to 25% jitter.
 */
export function retryDelay(attempt: number, retryAfter: string | null, random: () => number = Math.random): number {
  const fromHeader = parseRetryAfter(retryAfter);
  if (fromHeader !== undefined) return fromHeader;
  const base = Math.min(8000, 500 * 2 ** attempt);
  return Math.round(base * (1 - 0.25 * random()));
}

/** Reads an environment variable where one exists (Node.js, Bun, Deno with --allow-env). */
export function readEnv(name: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> }; Deno?: { env?: { get(n: string): string | undefined } } };
  try {
    const value = g.process?.env?.[name] ?? g.Deno?.env?.get(name);
    return value === undefined || value.trim() === "" ? undefined : value.trim();
  } catch {
    return undefined;
  }
}

/** Header lookup that accepts a `Headers` object or a plain record (Node.js `IncomingHttpHeaders`), case-insensitively. */
export type HeadersLike = Headers | Record<string, string | readonly string[] | undefined>;

export function getHeader(headers: HeadersLike, name: string): string | undefined {
  if (typeof (headers as Headers).get === "function" && typeof (headers as Headers).has === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as Record<string, string | readonly string[] | undefined>)) {
    if (key.toLowerCase() !== lower || value === undefined) continue;
    return typeof value === "string" ? value : value.join(", ");
  }
  return undefined;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
