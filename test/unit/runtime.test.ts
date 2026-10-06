// Unit tests for runtime helpers: key validation, query building, retry decisions, backoff, error mapping.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { crc32, isValidApiKey, maskApiKey } from "../../src/core/api-key.ts";
import { buildQuery, encodePathParam, parseRetryAfter, retryDelay, shouldRetry } from "../../src/core/http.ts";
import {
  ApiError,
  AuthenticationError,
  BillingError,
  CursorExpiredError,
  DaapiError,
  ErrorCode,
  ErrorType,
  IntegrationConnectionError,
  IntegrationError,
  InternalError,
  InvalidRequestError,
  OutcomeUnknownError,
  PermissionError,
  RateLimitError,
  settleRequest,
  type Request,
} from "../../src/index.ts";
import { makeApiError } from "../../src/core/errors.ts";
import { requestResource, TEST_KEY } from "./helpers.ts";

describe("api key", () => {
  test("crc32 matches the IEEE check value", () => {
    assert.equal(crc32("123456789"), 0xcbf43926);
  });

  test("accepts keys with a valid checksum and rejects everything else", () => {
    assert.ok(isValidApiKey(TEST_KEY));
    assert.ok(isValidApiKey("sk_live_aZ09aZ09aZ09aZ09aZ09aZ09aZ09aZ09xy26zcWJ"));
    assert.ok(!isValidApiKey(TEST_KEY.slice(0, -1) + "A"));
    assert.ok(!isValidApiKey(TEST_KEY.replace("sk_test_", "sk_prod_")));
    assert.ok(!isValidApiKey(TEST_KEY + "0"));
    assert.ok(!isValidApiKey(` ${TEST_KEY}`));
    assert.ok(!isValidApiKey(""));
  });

  test("masks keys to prefix and last 4", () => {
    assert.equal(maskApiKey(TEST_KEY), "sk_test_...QFLR");
    assert.equal(maskApiKey("short"), "(too short)");
  });
});

describe("query building", () => {
  test("arrays use repeated keys, booleans and numbers are strings, null/undefined are omitted", () => {
    assert.equal(
      buildQuery({ customerIds: ["a 1", "b/2"], limit: 2, includeLineItems: true, cursor: undefined, memo: null }),
      "?customerIds=a%201&customerIds=b%2F2&limit=2&includeLineItems=true",
    );
  });

  test("empty query has no question mark", () => {
    assert.equal(buildQuery({}), "");
    assert.equal(buildQuery(undefined), "");
    assert.equal(buildQuery({ ids: [] }), "");
  });

  test("path parameters are encoded and must be non-empty", () => {
    assert.equal(encodePathParam("id", "80000001-1700000000"), "80000001-1700000000");
    assert.equal(encodePathParam("id", "a/b?c"), "a%2Fb%3Fc");
    assert.throws(() => encodePathParam("id", ""), DaapiError);
  });
});

describe("retry decisions", () => {
  const cases: Array<[number, string | null, string | null, boolean]> = [
    [429, null, null, true],
    [429, "true", "not_applied", true],
    [429, "false", null, false],
    [503, "true", "not_applied", true],
    [503, null, null, false],
    [503, "false", null, false],
    [502, "true", "unknown", false],
    [500, "true", "pending", false],
    [400, "true", null, false],
    [504, "false", "pending", false],
  ];
  for (const [status, header, outcome, expected] of cases) {
    test(`${status} Daapi-Should-Retry=${header} outcome=${outcome} -> ${expected}`, () => {
      assert.equal(shouldRetry(status, header, outcome), expected);
    });
  }
});

describe("backoff", () => {
  test("Retry-After seconds, fractions, zero and HTTP dates", () => {
    assert.equal(parseRetryAfter("0"), 0);
    assert.equal(parseRetryAfter("2"), 2000);
    assert.equal(parseRetryAfter("1.5"), 1500);
    assert.equal(parseRetryAfter(new Date(10_000).toUTCString(), 7_000), 3000);
    assert.equal(parseRetryAfter("soon"), undefined);
    assert.equal(parseRetryAfter(null), undefined);
    assert.equal(parseRetryAfter("3600"), undefined, "longer than the cap falls back to exponential backoff");
  });

  test("exponential from 0.5 s, capped at 8 s, with at most 25% jitter", () => {
    assert.equal(retryDelay(0, null, () => 0), 500);
    assert.equal(retryDelay(1, null, () => 0), 1000);
    assert.equal(retryDelay(3, null, () => 0), 4000);
    assert.equal(retryDelay(10, null, () => 0), 8000);
    assert.equal(retryDelay(0, null, () => 1), 375);
    assert.equal(retryDelay(4, "0", () => 0.5), 0, "Retry-After wins");
  });
});

describe("error mapping", () => {
  const types: Array<[string, new (...a: never[]) => ApiError]> = [
    ["INVALID_REQUEST_ERROR", InvalidRequestError],
    ["AUTHENTICATION_ERROR", AuthenticationError],
    ["PERMISSION_ERROR", PermissionError],
    ["BILLING_ERROR", BillingError],
    ["RATE_LIMIT_ERROR", RateLimitError],
    ["INTEGRATION_CONNECTION_ERROR", IntegrationConnectionError],
    ["INTEGRATION_ERROR", IntegrationError],
    ["OUTCOME_UNKNOWN_ERROR", OutcomeUnknownError],
    ["INTERNAL_ERROR", InternalError],
  ];
  for (const [type, cls] of types) {
    test(`${type} -> ${cls.name}`, () => {
      const err = makeApiError(400, { type, code: "X" });
      assert.ok(err instanceof cls);
      assert.ok(err instanceof ApiError);
      assert.ok(err instanceof DaapiError);
      assert.equal(err.name, cls.name);
    });
  }

  test("every contract error type has a class", () => {
    for (const t of Object.values(ErrorType)) assert.notEqual(makeApiError(400, { type: t }).constructor, ApiError, t);
  });

  test("unknown type uses the base class and keeps every field", () => {
    const headers = new Headers({ "Daapi-Request-Id": "req_header" });
    const err = makeApiError(418, {
      type: "FUTURE_ERROR_TYPE",
      code: "FUTURE_CODE",
      message: "m",
      userFacingMessage: "u",
      httpStatusCode: 418,
      integrationCode: "0x1",
      cause: "why",
      fixes: [{ actor: "developer", action: "do" }],
      docsUrl: "https://example.test",
      retryable: false,
      outcome: "not_applied",
      param: "lines[0].rate",
      details: { a: 1 },
    }, headers);
    assert.equal(err.constructor, ApiError);
    assert.equal(err.status, 418);
    assert.equal(err.message, "m");
    assert.equal(err.errorCause, "why");
    assert.deepEqual(err.fixes, [{ actor: "developer", action: "do" }]);
    assert.equal(err.requestId, "req_header", "falls back to Daapi-Request-Id");
    assert.equal(err.param, "lines[0].rate");
    assert.deepEqual(err.details, { a: 1 });
    assert.equal(err.headers.get("daapi-request-id"), "req_header");
  });

  test("CURSOR_EXPIRED becomes CursorExpiredError with reason and pagesServed", () => {
    const err = makeApiError(410, { type: "INVALID_REQUEST_ERROR", code: ErrorCode.CURSOR_EXPIRED, details: { reason: "idle_timeout", pagesServed: 3 } });
    assert.ok(err instanceof CursorExpiredError);
    assert.ok(err instanceof InvalidRequestError);
    assert.equal(err.reason, "idle_timeout");
    assert.equal(err.pagesServed, 3);
  });

  test("non-JSON error keeps the HTTP status", () => {
    const err = makeApiError(502, undefined, new Headers(), "HTTP 502");
    assert.equal(err.constructor, ApiError);
    assert.equal(err.status, 502);
    assert.equal(err.code, null);
  });
});

describe("request resources", () => {
  test("succeeded returns the result; queued is unsettled", () => {
    assert.deepEqual(settleRequest(requestResource("succeeded", { result: { id: "7" } }) as unknown as Request), { value: { id: "7" } });
    assert.equal(settleRequest(requestResource("queued") as unknown as Request), undefined);
    assert.equal(settleRequest(requestResource("sent") as unknown as Request), undefined);
  });

  test("failed raises the typed error with httpStatusCode as status", () => {
    const req = requestResource("failed", { error: { type: "INTEGRATION_ERROR", code: "QBD_DUPLICATE_NAME", httpStatusCode: 400, message: "dup", requestId: "req_1" } });
    assert.throws(() => settleRequest(req as unknown as Request), (e: unknown) => e instanceof IntegrationError && e.status === 400 && e.code === "QBD_DUPLICATE_NAME");
  });

  test("outcome_unknown without an error object raises OutcomeUnknownError", () => {
    assert.throws(() => settleRequest(requestResource("outcome_unknown") as unknown as Request), OutcomeUnknownError);
  });

  test("an expired result is reported instead of returning null", () => {
    assert.throws(() => settleRequest(requestResource("succeeded", { resultExpired: true }) as unknown as Request), DaapiError);
  });
});
