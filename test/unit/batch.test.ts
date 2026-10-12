// The typed batch (client.qbd.batch): each result is typed by the request at the same position,
// the members go out as given with one Idempotency-Key, and an unknown outcome is never retried.
// `npm run typecheck` compiles this file, so the type assertions below are checked too.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { OutcomeUnknownError, type BatchCustomerCreateResult, type BatchInvoiceListResult, type BatchRequestInput, type BatchResultFor, type Customer } from "../../src/index.ts";
import { apiError, client, invoice, json, scriptedFetch } from "./helpers.ts";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assertType = <T extends true>(_value?: T): void => undefined;

const customer = { id: "80000009-1700000000", objectType: "qbd_customer", name: "Acme Supply" };
const response = {
  objectType: "qbd_batch",
  onError: "continueOnError",
  outcome: "applied",
  results: [
    { index: 0, operationId: "qbd.customers.create", status: "succeeded", outcome: "applied", data: customer, error: null, warnings: [] },
    { index: 1, operationId: "qbd.invoices.list", status: "succeeded", outcome: "not_applicable", data: { objectType: "list", url: "/v1/quickbooks-desktop/invoices", data: [invoice("11-1")], limitReached: false }, error: null, warnings: [] },
  ],
};

describe("qbd.batch", () => {
  test("results are typed by position; one write with one Idempotency-Key", async () => {
    const { fetch, calls } = scriptedFetch([json(200, response)]);
    const batch = await client(fetch).qbd.batch({
      onError: "continueOnError",
      requests: [
        { operationId: "qbd.customers.create", body: { name: "Acme Supply" } },
        { operationId: "qbd.invoices.list", query: { limit: 5 } },
      ],
    });
    const [created, listed] = batch.results;
    assertType<Equal<typeof created, BatchCustomerCreateResult>>();
    assertType<Equal<typeof listed, BatchInvoiceListResult>>();
    const data: Customer | null = created.data;
    assert.equal(data?.id, "80000009-1700000000");
    assert.equal(listed.data?.data[0]?.id, "11-1");
    assert.equal(listed.data?.limitReached, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.method, "POST");
    assert.equal(calls[0]!.url.pathname, "/base/v1/quickbooks-desktop/batch");
    assert.match(calls[0]!.headers.get("idempotency-key") ?? "", /^[0-9a-f-]{36}$/);
    assert.deepEqual(JSON.parse(calls[0]!.body!), { onError: "continueOnError", requests: [{ operationId: "qbd.customers.create", body: { name: "Acme Supply" } }, { operationId: "qbd.invoices.list", query: { limit: 5 } }] });
  });

  test("a member list built elsewhere is typed by the member union", async () => {
    const { fetch } = scriptedFetch([json(200, response)]);
    const members: BatchRequestInput[] = [{ operationId: "qbd.customers.create", body: { name: "Acme Supply" } }];
    const batch = await client(fetch).qbd.batch({ requests: members });
    for (const r of batch.results) {
      if (r.operationId === "qbd.customers.create") {
        const narrowed: BatchResultFor<{ operationId: "qbd.customers.create" }> = r;
        assert.equal(narrowed.data?.name, "Acme Supply");
      }
    }
    // @ts-expect-error a member must name a typed operation
    const bad: BatchRequestInput = { operationId: "qbd.healthCheck" };
    void bad;
  });

  test("an unknown outcome is raised and never retried", async () => {
    const { fetch, calls } = scriptedFetch([
      apiError(502, { type: "OUTCOME_UNKNOWN_ERROR", code: "QBD_WRITE_OUTCOME_UNKNOWN", outcome: "unknown", retryable: false, details: { members: [{ index: 0, operationId: "qbd.customers.create", status: "unknown", outcome: "unknown" }] } }, { "Daapi-Should-Retry": "false" }),
    ]);
    await assert.rejects(
      client(fetch, { maxRetries: 2 }).qbd.batch({ requests: [{ operationId: "qbd.customers.create", body: { name: "Lost" } }] }),
      (e: unknown) => e instanceof OutcomeUnknownError && (e.details["members"] as unknown[]).length === 1,
    );
    assert.equal(calls.length, 1);
  });
});
