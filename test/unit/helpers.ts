// Test doubles for the unit tests: a scripted fetch that records every request.

import { DesktopAccountingApi, type ClientOptions } from "../../src/index.ts";

export const TEST_KEY = "sk_test_Conformance0Key0For0SDK0Tests000010nQFLR";
export const END_USER = "eu_01j9x4m6v4c8k2t7q0r5s3w1zb";

export interface Recorded {
  method: string;
  url: URL;
  headers: Headers;
  body: string | undefined;
}

export type Reply = Response | Error | ((req: Recorded) => Response | Error | Promise<Response | Error>);

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

export function apiError(status: number, error: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return json(status, { error: { message: "test error", userFacingMessage: "Something went wrong.", requestId: "req_test", fixes: [], details: {}, ...error } }, headers);
}

/** A fetch that answers with `replies` in order and records every request. */
export function scriptedFetch(replies: Reply[]): { fetch: NonNullable<ClientOptions["fetch"]>; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const queue = [...replies];
  const fetch = async (input: string, init: RequestInit): Promise<Response> => {
    const rec: Recorded = {
      method: init.method ?? "GET",
      url: new URL(input),
      headers: new Headers(init.headers),
      body: typeof init.body === "string" ? init.body : undefined,
    };
    calls.push(rec);
    const next = queue.shift();
    if (next === undefined) throw new Error(`unexpected request ${rec.method} ${rec.url.pathname}`);
    const reply = typeof next === "function" ? await next(rec) : next;
    if (reply instanceof Error) throw reply;
    return reply;
  };
  return { fetch, calls };
}

export function client(fetch: NonNullable<ClientOptions["fetch"]>, options: ClientOptions = {}): DesktopAccountingApi {
  return new DesktopAccountingApi({ apiKey: TEST_KEY, baseUrl: "https://api.test/base", endUserId: END_USER, fetch, ...options });
}

export const invoice = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  objectType: "qbd_invoice",
  updatedAt: `2026-10-05T09:1${id.length % 10}:03-07:00`,
  subtotal: "105.50",
  ...extra,
});

export function page(ids: string[], nextCursor: string | null, extra: Record<string, unknown> = {}): Response {
  return json(200, {
    objectType: "list",
    url: "/v1/quickbooks-desktop/invoices",
    data: ids.map((id) => invoice(id)),
    nextCursor,
    hasMore: nextCursor !== null,
    remainingCount: nextCursor === null ? null : 1,
    cursorExpiresAt: null,
    ...extra,
  });
}

export function requestResource(status: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "req_1",
    objectType: "request",
    status,
    outcome: status === "succeeded" ? "applied" : "pending",
    error: null,
    result: null,
    resultExpired: false,
    ...extra,
  };
}
