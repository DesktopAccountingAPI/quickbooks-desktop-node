// CommonJS usage (require). Type-checked against the package's CommonJS declarations.
//
//   node examples/commonjs.cts

import type * as Sdk from "@desktopaccountingapi/quickbooks-desktop";

const sdk = require("@desktopaccountingapi/quickbooks-desktop") as typeof Sdk;

const client = new sdk.DesktopAccountingApi({ apiKey: process.env["DAAPI_SECRET_KEY"] });
const Default: typeof sdk.DesktopAccountingApi = sdk.default;
console.log(sdk.VERSION, client.baseUrl, Default.name, sdk.ErrorCode.QBD_MODAL_DIALOG_OPEN);
