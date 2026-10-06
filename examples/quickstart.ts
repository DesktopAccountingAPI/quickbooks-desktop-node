// Quickstart: health check, then the first 10 invoices.
//
//   npm run build
//   DAAPI_SECRET_KEY=sk_test_... DAAPI_END_USER_ID=eu_... node examples/quickstart.ts

import { DesktopAccountingApi } from "@desktopaccountingapi/quickbooks-desktop";

const endUserId = process.env["DAAPI_END_USER_ID"];
if (!endUserId) throw new Error("Set DAAPI_END_USER_ID to the end user whose QuickBooks company file you want to read.");

// Reads DAAPI_SECRET_KEY (and DAAPI_BASE_URL, if set) from the environment.
const client = new DesktopAccountingApi().forEndUser(endUserId);

const health = await client.qbd.healthCheck();
console.log(`QuickBooks: ${health.quickbooks.companyName ?? "(unknown company)"} (${health.duration} ms)`);

const page = await client.qbd.invoices.list({ limit: 10 });
for (const invoice of page.data) {
  console.log(`${invoice.refNumber ?? "(no number)"}  ${invoice.transactionDate ?? ""}  subtotal ${invoice.subtotal ?? "0.00"}`);
}
console.log(page.hasMore ? `${page.remainingCount ?? "more"} more invoices` : "no more invoices");
