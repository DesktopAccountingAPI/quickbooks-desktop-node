// The README's patterns in one compile-checked file: pagination, writes with idempotency keys,
// async mode, typed errors, raw responses, passthrough and webhook verification.
//
//   DAAPI_SECRET_KEY=sk_test_... DAAPI_END_USER_ID=eu_... node examples/patterns.ts

import {
  CursorExpiredError,
  DesktopAccountingApi,
  ErrorCode,
  IntegrationConnectionError,
  OutcomeUnknownError,
  RequestPendingError,
  verifyWebhook,
  WebhookEventType,
  type Invoice,
  type InvoiceCreateInput,
} from "@desktopaccountingapi/quickbooks-desktop";

const client = new DesktopAccountingApi({ maxRetries: 2, timeout: 100_000 }).forEndUser(process.env["DAAPI_END_USER_ID"] ?? "eu_...");

// Pagination: every customer, one page of read-ahead.
let count = 0;
try {
  for await (const customer of client.qbd.customers.list({ limit: 100 })) {
    count++;
    if (count <= 3) console.log(customer.name);
  }
} catch (err) {
  if (err instanceof CursorExpiredError) {
    console.log(`cursor expired after ${err.itemsYielded} items; resume with updatedAfter=${err.lastUpdatedAt}`);
  } else throw err;
}

// A write: money is a decimal string, dates are YYYY-MM-DD.
const input: InvoiceCreateInput = {
  customerId: "80000001-1700000000",
  transactionDate: "2026-10-05",
  lines: [{ itemId: "80000005-1700000000", quantity: 2, rate: "52.75" }],
};
try {
  const invoice: Invoice = await client.qbd.invoices.create(input, { idempotencyKey: "order-8812-invoice" });
  console.log(invoice.id, invoice.subtotal);

  // Clear the memo (null) and leave everything else unchanged (omitted).
  await client.qbd.invoices.update(invoice.id, { revisionNumber: invoice.revisionNumber, memo: null });

  // Raw response.
  const { data, requestId, response } = await client.qbd.invoices.retrieve(invoice.id).withResponse();
  console.log(data.refNumber, requestId, response.headers.get("daapi-warnings"));
} catch (err) {
  if (err instanceof IntegrationConnectionError && err.code === ErrorCode.QBD_MODAL_DIALOG_OPEN) {
    console.log(err.userFacingMessage, err.fixes);
  } else if (err instanceof OutcomeUnknownError) {
    console.log(`check ${err.requestId} before retrying`);
  } else if (err instanceof RequestPendingError) {
    console.log(`still running: ${err.requestId}`);
  } else throw err;
}

// Async mode.
const handle = await client.qbd.invoices.create(input, { async: true, queueTtl: 3600 });
console.log(handle.id, handle.request.status);
const created = await handle.wait({ timeout: 120_000 });
console.log(created.refNumber);

// Passthrough: qbXML as JSON, or raw XML.
const json = await client.endUsers.passthrough(client.endUserId ?? "eu_...", { CustomerQueryRq: { MaxReturned: 5 } });
console.log(Object.keys(json));
const xml = await client.endUsers.passthroughXml(client.endUserId ?? "eu_...", "<QBXMLMsgsRq><CustomerQueryRq><MaxReturned>5</MaxReturned></CustomerQueryRq></QBXMLMsgsRq>");
console.log(xml.length);

// Webhooks: verify the raw body.
export async function onWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<void> {
  const event = await verifyWebhook(rawBody, headers, process.env["DAAPI_WEBHOOK_SECRET"] ?? "");
  if (event.type === WebhookEventType.REQUEST_SUCCEEDED) console.log(`request ${String(event.data["id"])} succeeded`);
}
