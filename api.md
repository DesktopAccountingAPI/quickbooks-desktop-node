# API reference

Every method of the Node.js SDK, generated from the API contract (`packages/api-contract/generated/openapi.json`, sha256 `149fc7b0599d`, 438 operations). Field-level documentation is in the type definitions and at https://www.desktopaccountingapi.com/docs/.

Shared types: `RequestOptions` / `SyncRequestOptions` / `AsyncRequestOptions` (per-call options), `APIPromise<T>` (awaitable with `.withResponse()` and `.asResponse()`), `PagePromise<T>` (cursor lists), `RequestHandle<T>` (async mode).

## client.authSessions

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.authSessions.create(params: AuthSessionCreateInput, options?): APIPromise<AuthSession>` | `POST /v1/auth-sessions` | Create an auth session. |

## client.changeFeedSubscriptions

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.changeFeedSubscriptions.create(params: ChangeFeedSubscriptionCreateInput, options?): APIPromise<ChangeFeedSubscription>` | `POST /v1/change-feed-subscriptions` | Create a change feed subscription. |
| `client.changeFeedSubscriptions.delete(id: string, options?): APIPromise<ChangeFeedSubscriptionDeleted>` | `DELETE /v1/change-feed-subscriptions/{id}` | Delete a change feed subscription. |
| `client.changeFeedSubscriptions.list(params?: ChangeFeedSubscriptionListParams, options?): PagePromise<ChangeFeedSubscription>` | `GET /v1/change-feed-subscriptions` | List change feed subscriptions. |
| `client.changeFeedSubscriptions.retrieve(id: string, options?): APIPromise<ChangeFeedSubscription>` | `GET /v1/change-feed-subscriptions/{id}` | Retrieve a change feed subscription. |
| `client.changeFeedSubscriptions.update(id: string, params: ChangeFeedSubscriptionUpdateInput, options?): APIPromise<ChangeFeedSubscription>` | `POST /v1/change-feed-subscriptions/{id}` | Update a change feed subscription. |

## client.endUsers

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.endUsers.create(params: EndUserCreateInput, options?): APIPromise<EndUser>` | `POST /v1/end-users` | Create an end user. |
| `client.endUsers.delete(id: string, options?): APIPromise<EndUserDeleted>` | `DELETE /v1/end-users/{id}` | Delete an end user. |
| `client.endUsers.disableConnection(id: string, options?): APIPromise<EndUserConnection>` | `POST /v1/end-users/{id}/connection/disable` | Disable the connection. |
| `client.endUsers.enableConnection(id: string, options?): APIPromise<EndUserConnection>` | `POST /v1/end-users/{id}/connection/enable` | Enable the connection. |
| `client.endUsers.list(params?: EndUserListParams, options?): PagePromise<EndUser>` | `GET /v1/end-users` | List end users. |
| `client.endUsers.passthrough(id: string, params?: PassthroughInput, options?): APIPromise<PassthroughResponse>` | `POST /v1/end-users/{id}/passthrough/{integrationSlug}` | Send a raw qbXML request. Async mode: `{ async: true }`. |
| `client.endUsers.passthroughXml(id: string, xml: string, options?): APIPromise<string>` | `POST /v1/end-users/{id}/passthrough/{integrationSlug}` | Send a raw qbXML request. Async mode: `{ async: true }`. |
| `client.endUsers.resetCompanyFile(id: string, params: EndUserResetCompanyFileInput, options?): APIPromise<EndUser>` | `POST /v1/end-users/{id}/reset-company-file` | Reset the company file. |
| `client.endUsers.retrieve(id: string, options?): APIPromise<EndUser>` | `GET /v1/end-users/{id}` | Retrieve an end user. |
| `client.endUsers.retrieveConnection(id: string, options?): APIPromise<EndUserConnection>` | `GET /v1/end-users/{id}/connection` | Retrieve the connection. |
| `client.endUsers.update(id: string, params: EndUserUpdateInput, options?): APIPromise<EndUser>` | `POST /v1/end-users/{id}` | Update an end user. |

## client.qbd.accounts

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.accounts.create(params: AccountCreateInput & ConductorEndUserParam, options?): APIPromise<Account>` | `POST /v1/quickbooks-desktop/accounts` | Create an account. Async mode: `{ async: true }`. |
| `client.qbd.accounts.delete(id: string, params: AccountDeleteParams & ConductorEndUserParam, options?): APIPromise<AccountDeleted>` | `DELETE /v1/quickbooks-desktop/accounts/{id}` | Delete an account. Async mode: `{ async: true }`. |
| `client.qbd.accounts.list(params?: AccountListParams & ConductorEndUserParam, options?): APIPromise<AccountList>` | `GET /v1/quickbooks-desktop/accounts` | List accounts. Async mode: `{ async: true }`. |
| `client.qbd.accounts.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/accounts/{id}/merge` | Merge an account into another. Async mode: `{ async: true }`. |
| `client.qbd.accounts.retrieve(id: string, options?): APIPromise<Account>` | `GET /v1/quickbooks-desktop/accounts/{id}` | Retrieve an account. Async mode: `{ async: true }`. |
| `client.qbd.accounts.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/accounts/{id}/custom-fields` | Set a custom field on an account. Async mode: `{ async: true }`. |
| `client.qbd.accounts.update(id: string, params: AccountUpdateInput & ConductorEndUserParam, options?): APIPromise<Account>` | `POST /v1/quickbooks-desktop/accounts/{id}` | Update an account. Async mode: `{ async: true }`. |

## client.qbd.accountTaxLines

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.accountTaxLines.list(options?): APIPromise<AccountTaxLineList>` | `GET /v1/quickbooks-desktop/account-tax-lines` | List account tax lines. Async mode: `{ async: true }`. |

## client.qbd.billCheckPayments

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.billCheckPayments.create(params: BillCheckPaymentCreateInput & ConductorEndUserParam, options?): APIPromise<BillCheckPayment>` | `POST /v1/quickbooks-desktop/bill-check-payments` | Create a bill check payment. Async mode: `{ async: true }`. |
| `client.qbd.billCheckPayments.delete(id: string, options?): APIPromise<BillCheckPaymentDeleted>` | `DELETE /v1/quickbooks-desktop/bill-check-payments/{id}` | Delete a bill check payment. Async mode: `{ async: true }`. |
| `client.qbd.billCheckPayments.list(params?: BillCheckPaymentListParams & ConductorEndUserParam, options?): PagePromise<BillCheckPayment>` | `GET /v1/quickbooks-desktop/bill-check-payments` | List bill check payments. Async mode: `{ async: true }`. |
| `client.qbd.billCheckPayments.retrieve(id: string, options?): APIPromise<BillCheckPayment>` | `GET /v1/quickbooks-desktop/bill-check-payments/{id}` | Retrieve a bill check payment. Async mode: `{ async: true }`. |
| `client.qbd.billCheckPayments.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/bill-check-payments/{id}/custom-fields` | Set a custom field on a bill check payment. Async mode: `{ async: true }`. |
| `client.qbd.billCheckPayments.update(id: string, params: BillCheckPaymentUpdateInput & ConductorEndUserParam, options?): APIPromise<BillCheckPayment>` | `POST /v1/quickbooks-desktop/bill-check-payments/{id}` | Update a bill check payment. Async mode: `{ async: true }`. |
| `client.qbd.billCheckPayments.void(id: string, options?): APIPromise<BillCheckPaymentVoided>` | `POST /v1/quickbooks-desktop/bill-check-payments/{id}/void` | Void a bill check payment. Async mode: `{ async: true }`. |

## client.qbd.billCreditCardPayments

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.billCreditCardPayments.create(params: BillCreditCardPaymentCreateInput & ConductorEndUserParam, options?): APIPromise<BillCreditCardPayment>` | `POST /v1/quickbooks-desktop/bill-credit-card-payments` | Create a bill credit card payment. Async mode: `{ async: true }`. |
| `client.qbd.billCreditCardPayments.delete(id: string, options?): APIPromise<BillCreditCardPaymentDeleted>` | `DELETE /v1/quickbooks-desktop/bill-credit-card-payments/{id}` | Delete a bill credit card payment. Async mode: `{ async: true }`. |
| `client.qbd.billCreditCardPayments.list(params?: BillCreditCardPaymentListParams & ConductorEndUserParam, options?): PagePromise<BillCreditCardPayment>` | `GET /v1/quickbooks-desktop/bill-credit-card-payments` | List bill credit card payments. Async mode: `{ async: true }`. |
| `client.qbd.billCreditCardPayments.retrieve(id: string, options?): APIPromise<BillCreditCardPayment>` | `GET /v1/quickbooks-desktop/bill-credit-card-payments/{id}` | Retrieve a bill credit card payment. Async mode: `{ async: true }`. |
| `client.qbd.billCreditCardPayments.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/bill-credit-card-payments/{id}/custom-fields` | Set a custom field on a bill credit card payment. Async mode: `{ async: true }`. |
| `client.qbd.billCreditCardPayments.void(id: string, options?): APIPromise<BillCreditCardPaymentVoided>` | `POST /v1/quickbooks-desktop/bill-credit-card-payments/{id}/void` | Void a bill credit card payment. Async mode: `{ async: true }`. |

## client.qbd.billingRates

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.billingRates.create(params: BillingRateCreateInput & ConductorEndUserParam, options?): APIPromise<BillingRate>` | `POST /v1/quickbooks-desktop/billing-rates` | Create a billing rate. Async mode: `{ async: true }`. |
| `client.qbd.billingRates.delete(id: string, params: BillingRateDeleteParams & ConductorEndUserParam, options?): APIPromise<BillingRateDeleted>` | `DELETE /v1/quickbooks-desktop/billing-rates/{id}` | Delete a billing rate. Async mode: `{ async: true }`. |
| `client.qbd.billingRates.list(params?: BillingRateListParams & ConductorEndUserParam, options?): APIPromise<BillingRateList>` | `GET /v1/quickbooks-desktop/billing-rates` | List billing rates. Async mode: `{ async: true }`. |
| `client.qbd.billingRates.retrieve(id: string, options?): APIPromise<BillingRate>` | `GET /v1/quickbooks-desktop/billing-rates/{id}` | Retrieve a billing rate. Async mode: `{ async: true }`. |

## client.qbd.bills

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.bills.create(params: BillCreateInput & ConductorEndUserParam, options?): APIPromise<Bill>` | `POST /v1/quickbooks-desktop/bills` | Create a bill. Async mode: `{ async: true }`. |
| `client.qbd.bills.delete(id: string, options?): APIPromise<BillDeleted>` | `DELETE /v1/quickbooks-desktop/bills/{id}` | Delete a bill. Async mode: `{ async: true }`. |
| `client.qbd.bills.list(params?: BillListParams & ConductorEndUserParam, options?): PagePromise<Bill>` | `GET /v1/quickbooks-desktop/bills` | List bills. Async mode: `{ async: true }`. |
| `client.qbd.bills.retrieve(id: string, options?): APIPromise<Bill>` | `GET /v1/quickbooks-desktop/bills/{id}` | Retrieve a bill. Async mode: `{ async: true }`. |
| `client.qbd.bills.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/bills/{id}/custom-fields` | Set a custom field on a bill. Async mode: `{ async: true }`. |
| `client.qbd.bills.update(id: string, params: BillUpdateInput & ConductorEndUserParam, options?): APIPromise<Bill>` | `POST /v1/quickbooks-desktop/bills/{id}` | Update a bill. Async mode: `{ async: true }`. |
| `client.qbd.bills.void(id: string, options?): APIPromise<BillVoided>` | `POST /v1/quickbooks-desktop/bills/{id}/void` | Void a bill. Async mode: `{ async: true }`. |

## client.qbd.billsToPay

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.billsToPay.list(params: BillsToPayListParams & ConductorEndUserParam, options?): APIPromise<BillsToPayList>` | `GET /v1/quickbooks-desktop/bills-to-pay` | List bill to pays. Async mode: `{ async: true }`. |

## client.qbd.buildAssemblies

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.buildAssemblies.create(params: BuildAssemblyCreateInput & ConductorEndUserParam, options?): APIPromise<BuildAssembly>` | `POST /v1/quickbooks-desktop/build-assemblies` | Create a build assembly. Async mode: `{ async: true }`. |
| `client.qbd.buildAssemblies.delete(id: string, options?): APIPromise<BuildAssemblyDeleted>` | `DELETE /v1/quickbooks-desktop/build-assemblies/{id}` | Delete a build assembly. Async mode: `{ async: true }`. |
| `client.qbd.buildAssemblies.list(params?: BuildAssemblyListParams & ConductorEndUserParam, options?): PagePromise<BuildAssembly>` | `GET /v1/quickbooks-desktop/build-assemblies` | List build assemblies. Async mode: `{ async: true }`. |
| `client.qbd.buildAssemblies.retrieve(id: string, options?): APIPromise<BuildAssembly>` | `GET /v1/quickbooks-desktop/build-assemblies/{id}` | Retrieve a build assembly. Async mode: `{ async: true }`. |
| `client.qbd.buildAssemblies.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/build-assemblies/{id}/custom-fields` | Set a custom field on a build assembly. Async mode: `{ async: true }`. |
| `client.qbd.buildAssemblies.update(id: string, params: BuildAssemblyUpdateInput & ConductorEndUserParam, options?): APIPromise<BuildAssembly>` | `POST /v1/quickbooks-desktop/build-assemblies/{id}` | Update a build assembly. Async mode: `{ async: true }`. |

## client.qbd.checks

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.checks.create(params: CheckCreateInput & ConductorEndUserParam, options?): APIPromise<Check>` | `POST /v1/quickbooks-desktop/checks` | Create a check. Async mode: `{ async: true }`. |
| `client.qbd.checks.delete(id: string, options?): APIPromise<CheckDeleted>` | `DELETE /v1/quickbooks-desktop/checks/{id}` | Delete a check. Async mode: `{ async: true }`. |
| `client.qbd.checks.list(params?: CheckListParams & ConductorEndUserParam, options?): PagePromise<Check>` | `GET /v1/quickbooks-desktop/checks` | List checks. Async mode: `{ async: true }`. |
| `client.qbd.checks.retrieve(id: string, options?): APIPromise<Check>` | `GET /v1/quickbooks-desktop/checks/{id}` | Retrieve a check. Async mode: `{ async: true }`. |
| `client.qbd.checks.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/checks/{id}/custom-fields` | Set a custom field on a check. Async mode: `{ async: true }`. |
| `client.qbd.checks.update(id: string, params: CheckUpdateInput & ConductorEndUserParam, options?): APIPromise<Check>` | `POST /v1/quickbooks-desktop/checks/{id}` | Update a check. Async mode: `{ async: true }`. |
| `client.qbd.checks.void(id: string, options?): APIPromise<CheckVoided>` | `POST /v1/quickbooks-desktop/checks/{id}/void` | Void a check. Async mode: `{ async: true }`. |

## client.qbd.classes

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.classes.create(params: ClassCreateInput & ConductorEndUserParam, options?): APIPromise<Class>` | `POST /v1/quickbooks-desktop/classes` | Create a class. Async mode: `{ async: true }`. |
| `client.qbd.classes.delete(id: string, params: ClassDeleteParams & ConductorEndUserParam, options?): APIPromise<ClassDeleted>` | `DELETE /v1/quickbooks-desktop/classes/{id}` | Delete a class. Async mode: `{ async: true }`. |
| `client.qbd.classes.list(params?: ClassListParams & ConductorEndUserParam, options?): APIPromise<ClassList>` | `GET /v1/quickbooks-desktop/classes` | List classes. Async mode: `{ async: true }`. |
| `client.qbd.classes.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/classes/{id}/merge` | Merge a class into another. Async mode: `{ async: true }`. |
| `client.qbd.classes.retrieve(id: string, options?): APIPromise<Class>` | `GET /v1/quickbooks-desktop/classes/{id}` | Retrieve a class. Async mode: `{ async: true }`. |
| `client.qbd.classes.update(id: string, params: ClassUpdateInput & ConductorEndUserParam, options?): APIPromise<Class>` | `POST /v1/quickbooks-desktop/classes/{id}` | Update a class. Async mode: `{ async: true }`. |

## client.qbd.company

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.company.retrieve(options?): APIPromise<Company>` | `GET /v1/quickbooks-desktop/company` | Retrieve company information. Async mode: `{ async: true }`. |

## client.qbd.creditCardCharges

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.creditCardCharges.create(params: CreditCardChargeCreateInput & ConductorEndUserParam, options?): APIPromise<CreditCardCharge>` | `POST /v1/quickbooks-desktop/credit-card-charges` | Create a credit card charge. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCharges.delete(id: string, options?): APIPromise<CreditCardChargeDeleted>` | `DELETE /v1/quickbooks-desktop/credit-card-charges/{id}` | Delete a credit card charge. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCharges.list(params?: CreditCardChargeListParams & ConductorEndUserParam, options?): PagePromise<CreditCardCharge>` | `GET /v1/quickbooks-desktop/credit-card-charges` | List credit card charges. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCharges.retrieve(id: string, options?): APIPromise<CreditCardCharge>` | `GET /v1/quickbooks-desktop/credit-card-charges/{id}` | Retrieve a credit card charge. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCharges.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/credit-card-charges/{id}/custom-fields` | Set a custom field on a credit card charge. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCharges.update(id: string, params: CreditCardChargeUpdateInput & ConductorEndUserParam, options?): APIPromise<CreditCardCharge>` | `POST /v1/quickbooks-desktop/credit-card-charges/{id}` | Update a credit card charge. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCharges.void(id: string, options?): APIPromise<CreditCardChargeVoided>` | `POST /v1/quickbooks-desktop/credit-card-charges/{id}/void` | Void a credit card charge. Async mode: `{ async: true }`. |

## client.qbd.creditCardCredits

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.creditCardCredits.create(params: CreditCardCreditCreateInput & ConductorEndUserParam, options?): APIPromise<CreditCardCredit>` | `POST /v1/quickbooks-desktop/credit-card-credits` | Create a credit card credit. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCredits.delete(id: string, options?): APIPromise<CreditCardCreditDeleted>` | `DELETE /v1/quickbooks-desktop/credit-card-credits/{id}` | Delete a credit card credit. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCredits.list(params?: CreditCardCreditListParams & ConductorEndUserParam, options?): PagePromise<CreditCardCredit>` | `GET /v1/quickbooks-desktop/credit-card-credits` | List credit card credits. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCredits.retrieve(id: string, options?): APIPromise<CreditCardCredit>` | `GET /v1/quickbooks-desktop/credit-card-credits/{id}` | Retrieve a credit card credit. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCredits.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/credit-card-credits/{id}/custom-fields` | Set a custom field on a credit card credit. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCredits.update(id: string, params: CreditCardCreditUpdateInput & ConductorEndUserParam, options?): APIPromise<CreditCardCredit>` | `POST /v1/quickbooks-desktop/credit-card-credits/{id}` | Update a credit card credit. Async mode: `{ async: true }`. |
| `client.qbd.creditCardCredits.void(id: string, options?): APIPromise<CreditCardCreditVoided>` | `POST /v1/quickbooks-desktop/credit-card-credits/{id}/void` | Void a credit card credit. Async mode: `{ async: true }`. |

## client.qbd.creditCardRefunds

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.creditCardRefunds.create(params: CreditCardRefundCreateInput & ConductorEndUserParam, options?): APIPromise<CreditCardRefund>` | `POST /v1/quickbooks-desktop/credit-card-refunds` | Create a credit card refund. Async mode: `{ async: true }`. |
| `client.qbd.creditCardRefunds.delete(id: string, options?): APIPromise<CreditCardRefundDeleted>` | `DELETE /v1/quickbooks-desktop/credit-card-refunds/{id}` | Delete a credit card refund. Async mode: `{ async: true }`. |
| `client.qbd.creditCardRefunds.list(params?: CreditCardRefundListParams & ConductorEndUserParam, options?): PagePromise<CreditCardRefund>` | `GET /v1/quickbooks-desktop/credit-card-refunds` | List credit card refunds. Async mode: `{ async: true }`. |
| `client.qbd.creditCardRefunds.retrieve(id: string, options?): APIPromise<CreditCardRefund>` | `GET /v1/quickbooks-desktop/credit-card-refunds/{id}` | Retrieve a credit card refund. Async mode: `{ async: true }`. |
| `client.qbd.creditCardRefunds.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/credit-card-refunds/{id}/custom-fields` | Set a custom field on a credit card refund. Async mode: `{ async: true }`. |
| `client.qbd.creditCardRefunds.void(id: string, options?): APIPromise<CreditCardRefundVoided>` | `POST /v1/quickbooks-desktop/credit-card-refunds/{id}/void` | Void a credit card refund. Async mode: `{ async: true }`. |

## client.qbd.creditMemos

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.creditMemos.create(params: CreditMemoCreateInput & ConductorEndUserParam, options?): APIPromise<CreditMemo>` | `POST /v1/quickbooks-desktop/credit-memos` | Create a credit memo. Async mode: `{ async: true }`. |
| `client.qbd.creditMemos.delete(id: string, options?): APIPromise<CreditMemoDeleted>` | `DELETE /v1/quickbooks-desktop/credit-memos/{id}` | Delete a credit memo. Async mode: `{ async: true }`. |
| `client.qbd.creditMemos.list(params?: CreditMemoListParams & ConductorEndUserParam, options?): PagePromise<CreditMemo>` | `GET /v1/quickbooks-desktop/credit-memos` | List credit memos. Async mode: `{ async: true }`. |
| `client.qbd.creditMemos.retrieve(id: string, options?): APIPromise<CreditMemo>` | `GET /v1/quickbooks-desktop/credit-memos/{id}` | Retrieve a credit memo. Async mode: `{ async: true }`. |
| `client.qbd.creditMemos.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/credit-memos/{id}/custom-fields` | Set a custom field on a credit memo. Async mode: `{ async: true }`. |
| `client.qbd.creditMemos.update(id: string, params: CreditMemoUpdateInput & ConductorEndUserParam, options?): APIPromise<CreditMemo>` | `POST /v1/quickbooks-desktop/credit-memos/{id}` | Update a credit memo. Async mode: `{ async: true }`. |
| `client.qbd.creditMemos.void(id: string, options?): APIPromise<CreditMemoVoided>` | `POST /v1/quickbooks-desktop/credit-memos/{id}/void` | Void a credit memo. Async mode: `{ async: true }`. |

## client.qbd.currencies

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.currencies.create(params: CurrencyCreateInput & ConductorEndUserParam, options?): APIPromise<Currency>` | `POST /v1/quickbooks-desktop/currencies` | Create a currency. Async mode: `{ async: true }`. |
| `client.qbd.currencies.delete(id: string, params: CurrencyDeleteParams & ConductorEndUserParam, options?): APIPromise<CurrencyDeleted>` | `DELETE /v1/quickbooks-desktop/currencies/{id}` | Delete a currency. Async mode: `{ async: true }`. |
| `client.qbd.currencies.list(params?: CurrencyListParams & ConductorEndUserParam, options?): APIPromise<CurrencyList>` | `GET /v1/quickbooks-desktop/currencies` | List currencies. Async mode: `{ async: true }`. |
| `client.qbd.currencies.retrieve(id: string, options?): APIPromise<Currency>` | `GET /v1/quickbooks-desktop/currencies/{id}` | Retrieve a currency. Async mode: `{ async: true }`. |
| `client.qbd.currencies.update(id: string, params: CurrencyUpdateInput & ConductorEndUserParam, options?): APIPromise<Currency>` | `POST /v1/quickbooks-desktop/currencies/{id}` | Update a currency. Async mode: `{ async: true }`. |

## client.qbd.customerMessages

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.customerMessages.create(params: CustomerMessageCreateInput & ConductorEndUserParam, options?): APIPromise<CustomerMessage>` | `POST /v1/quickbooks-desktop/customer-messages` | Create a customer message. Async mode: `{ async: true }`. |
| `client.qbd.customerMessages.delete(id: string, params: CustomerMessageDeleteParams & ConductorEndUserParam, options?): APIPromise<CustomerMessageDeleted>` | `DELETE /v1/quickbooks-desktop/customer-messages/{id}` | Delete a customer message. Async mode: `{ async: true }`. |
| `client.qbd.customerMessages.list(params?: CustomerMessageListParams & ConductorEndUserParam, options?): APIPromise<CustomerMessageList>` | `GET /v1/quickbooks-desktop/customer-messages` | List customer messages. Async mode: `{ async: true }`. |
| `client.qbd.customerMessages.retrieve(id: string, options?): APIPromise<CustomerMessage>` | `GET /v1/quickbooks-desktop/customer-messages/{id}` | Retrieve a customer message. Async mode: `{ async: true }`. |

## client.qbd.customers

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.customers.create(params: CustomerCreateInput & ConductorEndUserParam, options?): APIPromise<Customer>` | `POST /v1/quickbooks-desktop/customers` | Create a customer. Async mode: `{ async: true }`. |
| `client.qbd.customers.delete(id: string, params: CustomerDeleteParams & ConductorEndUserParam, options?): APIPromise<CustomerDeleted>` | `DELETE /v1/quickbooks-desktop/customers/{id}` | Delete a customer. Async mode: `{ async: true }`. |
| `client.qbd.customers.list(params?: CustomerListParams & ConductorEndUserParam, options?): PagePromise<Customer>` | `GET /v1/quickbooks-desktop/customers` | List customers. Async mode: `{ async: true }`. |
| `client.qbd.customers.merge(id: string, params: CustomerMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/customers/{id}/merge` | Merge a customer into another. Async mode: `{ async: true }`. |
| `client.qbd.customers.retrieve(id: string, options?): APIPromise<Customer>` | `GET /v1/quickbooks-desktop/customers/{id}` | Retrieve a customer. Async mode: `{ async: true }`. |
| `client.qbd.customers.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/customers/{id}/custom-fields` | Set a custom field on a customer. Async mode: `{ async: true }`. |
| `client.qbd.customers.update(id: string, params: CustomerUpdateInput & ConductorEndUserParam, options?): APIPromise<Customer>` | `POST /v1/quickbooks-desktop/customers/{id}` | Update a customer. Async mode: `{ async: true }`. |

## client.qbd.customerTypes

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.customerTypes.create(params: CustomerTypeCreateInput & ConductorEndUserParam, options?): APIPromise<CustomerType>` | `POST /v1/quickbooks-desktop/customer-types` | Create a customer type. Async mode: `{ async: true }`. |
| `client.qbd.customerTypes.delete(id: string, params: CustomerTypeDeleteParams & ConductorEndUserParam, options?): APIPromise<CustomerTypeDeleted>` | `DELETE /v1/quickbooks-desktop/customer-types/{id}` | Delete a customer type. Async mode: `{ async: true }`. |
| `client.qbd.customerTypes.list(params?: CustomerTypeListParams & ConductorEndUserParam, options?): APIPromise<CustomerTypeList>` | `GET /v1/quickbooks-desktop/customer-types` | List customer types. Async mode: `{ async: true }`. |
| `client.qbd.customerTypes.retrieve(id: string, options?): APIPromise<CustomerType>` | `GET /v1/quickbooks-desktop/customer-types/{id}` | Retrieve a customer type. Async mode: `{ async: true }`. |

## client.qbd.customFieldDefinitions

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.customFieldDefinitions.create(params: CustomFieldDefinitionCreateInput & ConductorEndUserParam, options?): APIPromise<CustomFieldDefinition>` | `POST /v1/quickbooks-desktop/custom-field-definitions` | Create a custom field definition. Async mode: `{ async: true }`. |
| `client.qbd.customFieldDefinitions.delete(definitionName: string, params: CustomFieldDefinitionDeleteParams & ConductorEndUserParam, options?): APIPromise<CustomFieldDefinitionDeleted>` | `DELETE /v1/quickbooks-desktop/custom-field-definitions/{definitionName}` | Request deletion of a private custom field definition. Async mode: `{ async: true }`. |
| `client.qbd.customFieldDefinitions.list(params?: CustomFieldDefinitionListParams & ConductorEndUserParam, options?): APIPromise<CustomFieldDefinitionList>` | `GET /v1/quickbooks-desktop/custom-field-definitions` | List custom field definitions. Async mode: `{ async: true }`. |
| `client.qbd.customFieldDefinitions.update(definitionName: string, params: CustomFieldDefinitionUpdateInput & ConductorEndUserParam, options?): APIPromise<CustomFieldDefinition>` | `POST /v1/quickbooks-desktop/custom-field-definitions/{definitionName}` | Update a custom field definition. Async mode: `{ async: true }`. |

## client.qbd.dateDrivenTerms

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.dateDrivenTerms.create(params: DateDrivenTermCreateInput & ConductorEndUserParam, options?): APIPromise<DateDrivenTerm>` | `POST /v1/quickbooks-desktop/date-driven-terms` | Create a date-driven term. Async mode: `{ async: true }`. |
| `client.qbd.dateDrivenTerms.delete(id: string, params: DateDrivenTermDeleteParams & ConductorEndUserParam, options?): APIPromise<DateDrivenTermDeleted>` | `DELETE /v1/quickbooks-desktop/date-driven-terms/{id}` | Delete a date-driven term. Async mode: `{ async: true }`. |
| `client.qbd.dateDrivenTerms.list(params?: DateDrivenTermListParams & ConductorEndUserParam, options?): APIPromise<DateDrivenTermList>` | `GET /v1/quickbooks-desktop/date-driven-terms` | List date-driven terms. Async mode: `{ async: true }`. |
| `client.qbd.dateDrivenTerms.retrieve(id: string, options?): APIPromise<DateDrivenTerm>` | `GET /v1/quickbooks-desktop/date-driven-terms/{id}` | Retrieve a date-driven term. Async mode: `{ async: true }`. |

## client.qbd.deletedListObjects

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.deletedListObjects.list(params: DeletedListObjectListParams & ConductorEndUserParam, options?): APIPromise<DeletedListObjectList>` | `GET /v1/quickbooks-desktop/deleted-list-objects` | List deleted list objects. Async mode: `{ async: true }`. |

## client.qbd.deletedTransactions

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.deletedTransactions.list(params: DeletedTransactionListParams & ConductorEndUserParam, options?): APIPromise<DeletedTransactionList>` | `GET /v1/quickbooks-desktop/deleted-transactions` | List deleted transactions. Async mode: `{ async: true }`. |

## client.qbd.deposits

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.deposits.create(params: DepositCreateInput & ConductorEndUserParam, options?): APIPromise<Deposit>` | `POST /v1/quickbooks-desktop/deposits` | Create a deposit. Async mode: `{ async: true }`. |
| `client.qbd.deposits.delete(id: string, options?): APIPromise<DepositDeleted>` | `DELETE /v1/quickbooks-desktop/deposits/{id}` | Delete a deposit. Async mode: `{ async: true }`. |
| `client.qbd.deposits.list(params?: DepositListParams & ConductorEndUserParam, options?): PagePromise<Deposit>` | `GET /v1/quickbooks-desktop/deposits` | List deposits. Async mode: `{ async: true }`. |
| `client.qbd.deposits.retrieve(id: string, options?): APIPromise<Deposit>` | `GET /v1/quickbooks-desktop/deposits/{id}` | Retrieve a deposit. Async mode: `{ async: true }`. |
| `client.qbd.deposits.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/deposits/{id}/custom-fields` | Set a custom field on a deposit. Async mode: `{ async: true }`. |
| `client.qbd.deposits.update(id: string, params: DepositUpdateInput & ConductorEndUserParam, options?): APIPromise<Deposit>` | `POST /v1/quickbooks-desktop/deposits/{id}` | Update a deposit. Async mode: `{ async: true }`. |
| `client.qbd.deposits.void(id: string, options?): APIPromise<DepositVoided>` | `POST /v1/quickbooks-desktop/deposits/{id}/void` | Void a deposit. Async mode: `{ async: true }`. |

## client.qbd.discountItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.discountItems.create(params: DiscountItemCreateInput & ConductorEndUserParam, options?): APIPromise<DiscountItem>` | `POST /v1/quickbooks-desktop/discount-items` | Create a discount item. Async mode: `{ async: true }`. |
| `client.qbd.discountItems.delete(id: string, params: DiscountItemDeleteParams & ConductorEndUserParam, options?): APIPromise<DiscountItemDeleted>` | `DELETE /v1/quickbooks-desktop/discount-items/{id}` | Delete a discount item. Async mode: `{ async: true }`. |
| `client.qbd.discountItems.list(params?: DiscountItemListParams & ConductorEndUserParam, options?): PagePromise<DiscountItem>` | `GET /v1/quickbooks-desktop/discount-items` | List discount items. Async mode: `{ async: true }`. |
| `client.qbd.discountItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/discount-items/{id}/merge` | Merge a discount item into another. Async mode: `{ async: true }`. |
| `client.qbd.discountItems.retrieve(id: string, options?): APIPromise<DiscountItem>` | `GET /v1/quickbooks-desktop/discount-items/{id}` | Retrieve a discount item. Async mode: `{ async: true }`. |
| `client.qbd.discountItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/discount-items/{id}/custom-fields` | Set a custom field on a discount item. Async mode: `{ async: true }`. |
| `client.qbd.discountItems.update(id: string, params: DiscountItemUpdateInput & ConductorEndUserParam, options?): APIPromise<DiscountItem>` | `POST /v1/quickbooks-desktop/discount-items/{id}` | Update a discount item. Async mode: `{ async: true }`. |

## client.qbd.employees

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.employees.create(params: EmployeeCreateInput & ConductorEndUserParam, options?): APIPromise<Employee>` | `POST /v1/quickbooks-desktop/employees` | Create an employee. Async mode: `{ async: true }`. |
| `client.qbd.employees.delete(id: string, params: EmployeeDeleteParams & ConductorEndUserParam, options?): APIPromise<EmployeeDeleted>` | `DELETE /v1/quickbooks-desktop/employees/{id}` | Delete an employee. Async mode: `{ async: true }`. |
| `client.qbd.employees.list(params?: EmployeeListParams & ConductorEndUserParam, options?): APIPromise<EmployeeList>` | `GET /v1/quickbooks-desktop/employees` | List employees. Async mode: `{ async: true }`. |
| `client.qbd.employees.retrieve(id: string, options?): APIPromise<Employee>` | `GET /v1/quickbooks-desktop/employees/{id}` | Retrieve an employee. Async mode: `{ async: true }`. |
| `client.qbd.employees.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/employees/{id}/custom-fields` | Set a custom field on an employee. Async mode: `{ async: true }`. |
| `client.qbd.employees.update(id: string, params: EmployeeUpdateInput & ConductorEndUserParam, options?): APIPromise<Employee>` | `POST /v1/quickbooks-desktop/employees/{id}` | Update an employee. Async mode: `{ async: true }`. |

## client.qbd.entities

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.entities.list(params?: EntityListParams & ConductorEndUserParam, options?): PagePromise<Entity>` | `GET /v1/quickbooks-desktop/entities` | List entities. Async mode: `{ async: true }`. |
| `client.qbd.entities.retrieve(id: string, options?): APIPromise<Entity>` | `GET /v1/quickbooks-desktop/entities/{id}` | Retrieve an entity. Async mode: `{ async: true }`. |

## client.qbd.estimates

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.estimates.create(params: EstimateCreateInput & ConductorEndUserParam, options?): APIPromise<Estimate>` | `POST /v1/quickbooks-desktop/estimates` | Create an estimate. Async mode: `{ async: true }`. |
| `client.qbd.estimates.delete(id: string, options?): APIPromise<EstimateDeleted>` | `DELETE /v1/quickbooks-desktop/estimates/{id}` | Delete an estimate. Async mode: `{ async: true }`. |
| `client.qbd.estimates.list(params?: EstimateListParams & ConductorEndUserParam, options?): PagePromise<Estimate>` | `GET /v1/quickbooks-desktop/estimates` | List estimates. Async mode: `{ async: true }`. |
| `client.qbd.estimates.retrieve(id: string, options?): APIPromise<Estimate>` | `GET /v1/quickbooks-desktop/estimates/{id}` | Retrieve an estimate. Async mode: `{ async: true }`. |
| `client.qbd.estimates.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/estimates/{id}/custom-fields` | Set a custom field on an estimate. Async mode: `{ async: true }`. |
| `client.qbd.estimates.update(id: string, params: EstimateUpdateInput & ConductorEndUserParam, options?): APIPromise<Estimate>` | `POST /v1/quickbooks-desktop/estimates/{id}` | Update an estimate. Async mode: `{ async: true }`. |

## client.qbd.fixedAssetItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.fixedAssetItems.create(params: FixedAssetItemCreateInput & ConductorEndUserParam, options?): APIPromise<FixedAssetItem>` | `POST /v1/quickbooks-desktop/fixed-asset-items` | Create a fixed asset item. Async mode: `{ async: true }`. |
| `client.qbd.fixedAssetItems.delete(id: string, params: FixedAssetItemDeleteParams & ConductorEndUserParam, options?): APIPromise<FixedAssetItemDeleted>` | `DELETE /v1/quickbooks-desktop/fixed-asset-items/{id}` | Delete a fixed asset item. Async mode: `{ async: true }`. |
| `client.qbd.fixedAssetItems.list(params?: FixedAssetItemListParams & ConductorEndUserParam, options?): PagePromise<FixedAssetItem>` | `GET /v1/quickbooks-desktop/fixed-asset-items` | List fixed asset items. Async mode: `{ async: true }`. |
| `client.qbd.fixedAssetItems.retrieve(id: string, options?): APIPromise<FixedAssetItem>` | `GET /v1/quickbooks-desktop/fixed-asset-items/{id}` | Retrieve a fixed asset item. Async mode: `{ async: true }`. |
| `client.qbd.fixedAssetItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/fixed-asset-items/{id}/custom-fields` | Set a custom field on a fixed asset item. Async mode: `{ async: true }`. |
| `client.qbd.fixedAssetItems.update(id: string, params: FixedAssetItemUpdateInput & ConductorEndUserParam, options?): APIPromise<FixedAssetItem>` | `POST /v1/quickbooks-desktop/fixed-asset-items/{id}` | Update a fixed asset item. Async mode: `{ async: true }`. |

## client.qbd.inventoryAdjustments

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.inventoryAdjustments.create(params: InventoryAdjustmentCreateInput & ConductorEndUserParam, options?): APIPromise<InventoryAdjustment>` | `POST /v1/quickbooks-desktop/inventory-adjustments` | Create an inventory adjustment. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAdjustments.delete(id: string, options?): APIPromise<InventoryAdjustmentDeleted>` | `DELETE /v1/quickbooks-desktop/inventory-adjustments/{id}` | Delete an inventory adjustment. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAdjustments.list(params?: InventoryAdjustmentListParams & ConductorEndUserParam, options?): APIPromise<InventoryAdjustmentList>` | `GET /v1/quickbooks-desktop/inventory-adjustments` | List inventory adjustments. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAdjustments.retrieve(id: string, options?): APIPromise<InventoryAdjustment>` | `GET /v1/quickbooks-desktop/inventory-adjustments/{id}` | Retrieve an inventory adjustment. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAdjustments.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/inventory-adjustments/{id}/custom-fields` | Set a custom field on an inventory adjustment. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAdjustments.update(id: string, params: InventoryAdjustmentUpdateInput & ConductorEndUserParam, options?): APIPromise<InventoryAdjustment>` | `POST /v1/quickbooks-desktop/inventory-adjustments/{id}` | Update an inventory adjustment. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAdjustments.void(id: string, options?): APIPromise<InventoryAdjustmentVoided>` | `POST /v1/quickbooks-desktop/inventory-adjustments/{id}/void` | Void an inventory adjustment. Async mode: `{ async: true }`. |

## client.qbd.inventoryAssemblyItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.inventoryAssemblyItems.canBuild(id: string, params: InventoryAssemblyItemCanBuildParams & ConductorEndUserParam, options?): APIPromise<AssemblyBuildCapacity>` | `GET /v1/quickbooks-desktop/inventory-assembly-items/{id}/can-build` | Check how many assemblies can be built. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAssemblyItems.create(params: InventoryAssemblyItemCreateInput & ConductorEndUserParam, options?): APIPromise<InventoryAssemblyItem>` | `POST /v1/quickbooks-desktop/inventory-assembly-items` | Create an inventory assembly item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAssemblyItems.delete(id: string, params: InventoryAssemblyItemDeleteParams & ConductorEndUserParam, options?): APIPromise<InventoryAssemblyItemDeleted>` | `DELETE /v1/quickbooks-desktop/inventory-assembly-items/{id}` | Delete an inventory assembly item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAssemblyItems.list(params?: InventoryAssemblyItemListParams & ConductorEndUserParam, options?): PagePromise<InventoryAssemblyItem>` | `GET /v1/quickbooks-desktop/inventory-assembly-items` | List inventory assembly items. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAssemblyItems.retrieve(id: string, options?): APIPromise<InventoryAssemblyItem>` | `GET /v1/quickbooks-desktop/inventory-assembly-items/{id}` | Retrieve an inventory assembly item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAssemblyItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/inventory-assembly-items/{id}/custom-fields` | Set a custom field on an inventory assembly item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryAssemblyItems.update(id: string, params: InventoryAssemblyItemUpdateInput & ConductorEndUserParam, options?): APIPromise<InventoryAssemblyItem>` | `POST /v1/quickbooks-desktop/inventory-assembly-items/{id}` | Update an inventory assembly item. Async mode: `{ async: true }`. |

## client.qbd.inventoryItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.inventoryItems.create(params: InventoryItemCreateInput & ConductorEndUserParam, options?): APIPromise<InventoryItem>` | `POST /v1/quickbooks-desktop/inventory-items` | Create an inventory item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryItems.delete(id: string, params: InventoryItemDeleteParams & ConductorEndUserParam, options?): APIPromise<InventoryItemDeleted>` | `DELETE /v1/quickbooks-desktop/inventory-items/{id}` | Delete an inventory item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryItems.list(params?: InventoryItemListParams & ConductorEndUserParam, options?): PagePromise<InventoryItem>` | `GET /v1/quickbooks-desktop/inventory-items` | List inventory items. Async mode: `{ async: true }`. |
| `client.qbd.inventoryItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/inventory-items/{id}/merge` | Merge an inventory item into another. Async mode: `{ async: true }`. |
| `client.qbd.inventoryItems.retrieve(id: string, options?): APIPromise<InventoryItem>` | `GET /v1/quickbooks-desktop/inventory-items/{id}` | Retrieve an inventory item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/inventory-items/{id}/custom-fields` | Set a custom field on an inventory item. Async mode: `{ async: true }`. |
| `client.qbd.inventoryItems.update(id: string, params: InventoryItemUpdateInput & ConductorEndUserParam, options?): APIPromise<InventoryItem>` | `POST /v1/quickbooks-desktop/inventory-items/{id}` | Update an inventory item. Async mode: `{ async: true }`. |

## client.qbd.inventorySites

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.inventorySites.create(params: InventorySiteCreateInput & ConductorEndUserParam, options?): APIPromise<InventorySite>` | `POST /v1/quickbooks-desktop/inventory-sites` | Create an inventory site. Async mode: `{ async: true }`. |
| `client.qbd.inventorySites.delete(id: string, params: InventorySiteDeleteParams & ConductorEndUserParam, options?): APIPromise<InventorySiteDeleted>` | `DELETE /v1/quickbooks-desktop/inventory-sites/{id}` | Delete an inventory site. Async mode: `{ async: true }`. |
| `client.qbd.inventorySites.list(params?: InventorySiteListParams & ConductorEndUserParam, options?): APIPromise<InventorySiteList>` | `GET /v1/quickbooks-desktop/inventory-sites` | List inventory sites. Async mode: `{ async: true }`. |
| `client.qbd.inventorySites.retrieve(id: string, options?): APIPromise<InventorySite>` | `GET /v1/quickbooks-desktop/inventory-sites/{id}` | Retrieve an inventory site. Async mode: `{ async: true }`. |
| `client.qbd.inventorySites.update(id: string, params: InventorySiteUpdateInput & ConductorEndUserParam, options?): APIPromise<InventorySite>` | `POST /v1/quickbooks-desktop/inventory-sites/{id}` | Update an inventory site. Async mode: `{ async: true }`. |

## client.qbd.inventoryTransfers

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.inventoryTransfers.create(params: InventoryTransferCreateInput & ConductorEndUserParam, options?): APIPromise<InventoryTransfer>` | `POST /v1/quickbooks-desktop/inventory-transfers` | Create an inventory transfer. Async mode: `{ async: true }`. |
| `client.qbd.inventoryTransfers.delete(id: string, options?): APIPromise<InventoryTransferDeleted>` | `DELETE /v1/quickbooks-desktop/inventory-transfers/{id}` | Delete an inventory transfer. Async mode: `{ async: true }`. |
| `client.qbd.inventoryTransfers.list(params?: InventoryTransferListParams & ConductorEndUserParam, options?): PagePromise<InventoryTransfer>` | `GET /v1/quickbooks-desktop/inventory-transfers` | List inventory transfers. Async mode: `{ async: true }`. |
| `client.qbd.inventoryTransfers.retrieve(id: string, options?): APIPromise<InventoryTransfer>` | `GET /v1/quickbooks-desktop/inventory-transfers/{id}` | Retrieve an inventory transfer. Async mode: `{ async: true }`. |
| `client.qbd.inventoryTransfers.update(id: string, params: InventoryTransferUpdateInput & ConductorEndUserParam, options?): APIPromise<InventoryTransfer>` | `POST /v1/quickbooks-desktop/inventory-transfers/{id}` | Update an inventory transfer. Async mode: `{ async: true }`. |

## client.qbd.invoices

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.invoices.create(params: InvoiceCreateInput & ConductorEndUserParam, options?): APIPromise<Invoice>` | `POST /v1/quickbooks-desktop/invoices` | Create an invoice. Async mode: `{ async: true }`. |
| `client.qbd.invoices.delete(id: string, options?): APIPromise<InvoiceDeleted>` | `DELETE /v1/quickbooks-desktop/invoices/{id}` | Delete an invoice. Async mode: `{ async: true }`. |
| `client.qbd.invoices.list(params?: InvoiceListParams & ConductorEndUserParam, options?): PagePromise<Invoice>` | `GET /v1/quickbooks-desktop/invoices` | List invoices. Async mode: `{ async: true }`. |
| `client.qbd.invoices.retrieve(id: string, options?): APIPromise<Invoice>` | `GET /v1/quickbooks-desktop/invoices/{id}` | Retrieve an invoice. Async mode: `{ async: true }`. |
| `client.qbd.invoices.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/invoices/{id}/custom-fields` | Set a custom field on an invoice. Async mode: `{ async: true }`. |
| `client.qbd.invoices.update(id: string, params: InvoiceUpdateInput & ConductorEndUserParam, options?): APIPromise<Invoice>` | `POST /v1/quickbooks-desktop/invoices/{id}` | Update an invoice. Async mode: `{ async: true }`. |
| `client.qbd.invoices.void(id: string, options?): APIPromise<InvoiceVoided>` | `POST /v1/quickbooks-desktop/invoices/{id}/void` | Void an invoice. Async mode: `{ async: true }`. |

## client.qbd.itemGroups

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.itemGroups.create(params: ItemGroupCreateInput & ConductorEndUserParam, options?): APIPromise<ItemGroup>` | `POST /v1/quickbooks-desktop/item-groups` | Create an item group. Async mode: `{ async: true }`. |
| `client.qbd.itemGroups.delete(id: string, params: ItemGroupDeleteParams & ConductorEndUserParam, options?): APIPromise<ItemGroupDeleted>` | `DELETE /v1/quickbooks-desktop/item-groups/{id}` | Delete an item group. Async mode: `{ async: true }`. |
| `client.qbd.itemGroups.list(params?: ItemGroupListParams & ConductorEndUserParam, options?): PagePromise<ItemGroup>` | `GET /v1/quickbooks-desktop/item-groups` | List item groups. Async mode: `{ async: true }`. |
| `client.qbd.itemGroups.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/item-groups/{id}/merge` | Merge an item group into another. Async mode: `{ async: true }`. |
| `client.qbd.itemGroups.retrieve(id: string, options?): APIPromise<ItemGroup>` | `GET /v1/quickbooks-desktop/item-groups/{id}` | Retrieve an item group. Async mode: `{ async: true }`. |
| `client.qbd.itemGroups.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/item-groups/{id}/custom-fields` | Set a custom field on an item group. Async mode: `{ async: true }`. |
| `client.qbd.itemGroups.update(id: string, params: ItemGroupUpdateInput & ConductorEndUserParam, options?): APIPromise<ItemGroup>` | `POST /v1/quickbooks-desktop/item-groups/{id}` | Update an item group. Async mode: `{ async: true }`. |

## client.qbd.itemReceipts

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.itemReceipts.create(params: ItemReceiptCreateInput & ConductorEndUserParam, options?): APIPromise<ItemReceipt>` | `POST /v1/quickbooks-desktop/item-receipts` | Create an item receipt. Async mode: `{ async: true }`. |
| `client.qbd.itemReceipts.delete(id: string, options?): APIPromise<ItemReceiptDeleted>` | `DELETE /v1/quickbooks-desktop/item-receipts/{id}` | Delete an item receipt. Async mode: `{ async: true }`. |
| `client.qbd.itemReceipts.list(params?: ItemReceiptListParams & ConductorEndUserParam, options?): PagePromise<ItemReceipt>` | `GET /v1/quickbooks-desktop/item-receipts` | List item receipts. Async mode: `{ async: true }`. |
| `client.qbd.itemReceipts.retrieve(id: string, options?): APIPromise<ItemReceipt>` | `GET /v1/quickbooks-desktop/item-receipts/{id}` | Retrieve an item receipt. Async mode: `{ async: true }`. |
| `client.qbd.itemReceipts.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/item-receipts/{id}/custom-fields` | Set a custom field on an item receipt. Async mode: `{ async: true }`. |
| `client.qbd.itemReceipts.update(id: string, params: ItemReceiptUpdateInput & ConductorEndUserParam, options?): APIPromise<ItemReceipt>` | `POST /v1/quickbooks-desktop/item-receipts/{id}` | Update an item receipt. Async mode: `{ async: true }`. |
| `client.qbd.itemReceipts.void(id: string, options?): APIPromise<ItemReceiptVoided>` | `POST /v1/quickbooks-desktop/item-receipts/{id}/void` | Void an item receipt. Async mode: `{ async: true }`. |

## client.qbd.items

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.items.list(params?: ItemListParams & ConductorEndUserParam, options?): PagePromise<Item>` | `GET /v1/quickbooks-desktop/items` | List items. Async mode: `{ async: true }`. |
| `client.qbd.items.retrieve(id: string, options?): APIPromise<Item>` | `GET /v1/quickbooks-desktop/items/{id}` | Retrieve an item. Async mode: `{ async: true }`. |

## client.qbd.itemSites

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.itemSites.list(params?: ItemSiteListParams & ConductorEndUserParam, options?): PagePromise<ItemSite>` | `GET /v1/quickbooks-desktop/item-sites` | List item sites. Async mode: `{ async: true }`. |
| `client.qbd.itemSites.retrieve(id: string, options?): APIPromise<ItemSite>` | `GET /v1/quickbooks-desktop/item-sites/{id}` | Retrieve an item site. Async mode: `{ async: true }`. |

## client.qbd.jobTypes

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.jobTypes.create(params: JobTypeCreateInput & ConductorEndUserParam, options?): APIPromise<JobType>` | `POST /v1/quickbooks-desktop/job-types` | Create a job type. Async mode: `{ async: true }`. |
| `client.qbd.jobTypes.delete(id: string, params: JobTypeDeleteParams & ConductorEndUserParam, options?): APIPromise<JobTypeDeleted>` | `DELETE /v1/quickbooks-desktop/job-types/{id}` | Delete a job type. Async mode: `{ async: true }`. |
| `client.qbd.jobTypes.list(params?: JobTypeListParams & ConductorEndUserParam, options?): APIPromise<JobTypeList>` | `GET /v1/quickbooks-desktop/job-types` | List job types. Async mode: `{ async: true }`. |
| `client.qbd.jobTypes.retrieve(id: string, options?): APIPromise<JobType>` | `GET /v1/quickbooks-desktop/job-types/{id}` | Retrieve a job type. Async mode: `{ async: true }`. |

## client.qbd.journalEntries

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.journalEntries.create(params: JournalEntryCreateInput & ConductorEndUserParam, options?): APIPromise<JournalEntry>` | `POST /v1/quickbooks-desktop/journal-entries` | Create a journal entry. Async mode: `{ async: true }`. |
| `client.qbd.journalEntries.delete(id: string, options?): APIPromise<JournalEntryDeleted>` | `DELETE /v1/quickbooks-desktop/journal-entries/{id}` | Delete a journal entry. Async mode: `{ async: true }`. |
| `client.qbd.journalEntries.list(params?: JournalEntryListParams & ConductorEndUserParam, options?): PagePromise<JournalEntry>` | `GET /v1/quickbooks-desktop/journal-entries` | List journal entries. Async mode: `{ async: true }`. |
| `client.qbd.journalEntries.retrieve(id: string, options?): APIPromise<JournalEntry>` | `GET /v1/quickbooks-desktop/journal-entries/{id}` | Retrieve a journal entry. Async mode: `{ async: true }`. |
| `client.qbd.journalEntries.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/journal-entries/{id}/custom-fields` | Set a custom field on a journal entry. Async mode: `{ async: true }`. |
| `client.qbd.journalEntries.update(id: string, params: JournalEntryUpdateInput & ConductorEndUserParam, options?): APIPromise<JournalEntry>` | `POST /v1/quickbooks-desktop/journal-entries/{id}` | Update a journal entry. Async mode: `{ async: true }`. |
| `client.qbd.journalEntries.void(id: string, options?): APIPromise<JournalEntryVoided>` | `POST /v1/quickbooks-desktop/journal-entries/{id}/void` | Void a journal entry. Async mode: `{ async: true }`. |

## client.qbd.leads

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.leads.create(params: LeadCreateInput & ConductorEndUserParam, options?): APIPromise<Lead>` | `POST /v1/quickbooks-desktop/leads` | Create a lead. Async mode: `{ async: true }`. |
| `client.qbd.leads.list(params?: LeadListParams & ConductorEndUserParam, options?): PagePromise<Lead>` | `GET /v1/quickbooks-desktop/leads` | List leads. Async mode: `{ async: true }`. |
| `client.qbd.leads.retrieve(id: string, options?): APIPromise<Lead>` | `GET /v1/quickbooks-desktop/leads/{id}` | Retrieve a lead. Async mode: `{ async: true }`. |
| `client.qbd.leads.update(id: string, params: LeadUpdateInput & ConductorEndUserParam, options?): APIPromise<Lead>` | `POST /v1/quickbooks-desktop/leads/{id}` | Update a lead. Async mode: `{ async: true }`. |

## client.qbd.nonInventoryItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.nonInventoryItems.create(params: NonInventoryItemCreateInput & ConductorEndUserParam, options?): APIPromise<NonInventoryItem>` | `POST /v1/quickbooks-desktop/non-inventory-items` | Create a non-inventory item. Async mode: `{ async: true }`. |
| `client.qbd.nonInventoryItems.delete(id: string, params: NonInventoryItemDeleteParams & ConductorEndUserParam, options?): APIPromise<NonInventoryItemDeleted>` | `DELETE /v1/quickbooks-desktop/non-inventory-items/{id}` | Delete a non-inventory item. Async mode: `{ async: true }`. |
| `client.qbd.nonInventoryItems.list(params?: NonInventoryItemListParams & ConductorEndUserParam, options?): PagePromise<NonInventoryItem>` | `GET /v1/quickbooks-desktop/non-inventory-items` | List non-inventory items. Async mode: `{ async: true }`. |
| `client.qbd.nonInventoryItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/non-inventory-items/{id}/merge` | Merge a non-inventory item into another. Async mode: `{ async: true }`. |
| `client.qbd.nonInventoryItems.retrieve(id: string, options?): APIPromise<NonInventoryItem>` | `GET /v1/quickbooks-desktop/non-inventory-items/{id}` | Retrieve a non-inventory item. Async mode: `{ async: true }`. |
| `client.qbd.nonInventoryItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/non-inventory-items/{id}/custom-fields` | Set a custom field on a non-inventory item. Async mode: `{ async: true }`. |
| `client.qbd.nonInventoryItems.update(id: string, params: NonInventoryItemUpdateInput & ConductorEndUserParam, options?): APIPromise<NonInventoryItem>` | `POST /v1/quickbooks-desktop/non-inventory-items/{id}` | Update a non-inventory item. Async mode: `{ async: true }`. |

## client.qbd.otherChargeItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.otherChargeItems.create(params: OtherChargeItemCreateInput & ConductorEndUserParam, options?): APIPromise<OtherChargeItem>` | `POST /v1/quickbooks-desktop/other-charge-items` | Create an other charge item. Async mode: `{ async: true }`. |
| `client.qbd.otherChargeItems.delete(id: string, params: OtherChargeItemDeleteParams & ConductorEndUserParam, options?): APIPromise<OtherChargeItemDeleted>` | `DELETE /v1/quickbooks-desktop/other-charge-items/{id}` | Delete an other charge item. Async mode: `{ async: true }`. |
| `client.qbd.otherChargeItems.list(params?: OtherChargeItemListParams & ConductorEndUserParam, options?): PagePromise<OtherChargeItem>` | `GET /v1/quickbooks-desktop/other-charge-items` | List other charge items. Async mode: `{ async: true }`. |
| `client.qbd.otherChargeItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/other-charge-items/{id}/merge` | Merge an other charge item into another. Async mode: `{ async: true }`. |
| `client.qbd.otherChargeItems.retrieve(id: string, options?): APIPromise<OtherChargeItem>` | `GET /v1/quickbooks-desktop/other-charge-items/{id}` | Retrieve an other charge item. Async mode: `{ async: true }`. |
| `client.qbd.otherChargeItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/other-charge-items/{id}/custom-fields` | Set a custom field on an other charge item. Async mode: `{ async: true }`. |
| `client.qbd.otherChargeItems.update(id: string, params: OtherChargeItemUpdateInput & ConductorEndUserParam, options?): APIPromise<OtherChargeItem>` | `POST /v1/quickbooks-desktop/other-charge-items/{id}` | Update an other charge item. Async mode: `{ async: true }`. |

## client.qbd.otherNames

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.otherNames.create(params: OtherNameCreateInput & ConductorEndUserParam, options?): APIPromise<OtherName>` | `POST /v1/quickbooks-desktop/other-names` | Create an other name. Async mode: `{ async: true }`. |
| `client.qbd.otherNames.delete(id: string, params: OtherNameDeleteParams & ConductorEndUserParam, options?): APIPromise<OtherNameDeleted>` | `DELETE /v1/quickbooks-desktop/other-names/{id}` | Delete an other name. Async mode: `{ async: true }`. |
| `client.qbd.otherNames.list(params?: OtherNameListParams & ConductorEndUserParam, options?): APIPromise<OtherNameList>` | `GET /v1/quickbooks-desktop/other-names` | List other names. Async mode: `{ async: true }`. |
| `client.qbd.otherNames.retrieve(id: string, options?): APIPromise<OtherName>` | `GET /v1/quickbooks-desktop/other-names/{id}` | Retrieve an other name. Async mode: `{ async: true }`. |
| `client.qbd.otherNames.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/other-names/{id}/custom-fields` | Set a custom field on an other name. Async mode: `{ async: true }`. |
| `client.qbd.otherNames.update(id: string, params: OtherNameUpdateInput & ConductorEndUserParam, options?): APIPromise<OtherName>` | `POST /v1/quickbooks-desktop/other-names/{id}` | Update an other name. Async mode: `{ async: true }`. |

## client.qbd.paymentItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.paymentItems.create(params: PaymentItemCreateInput & ConductorEndUserParam, options?): APIPromise<PaymentItem>` | `POST /v1/quickbooks-desktop/payment-items` | Create a payment item. Async mode: `{ async: true }`. |
| `client.qbd.paymentItems.delete(id: string, params: PaymentItemDeleteParams & ConductorEndUserParam, options?): APIPromise<PaymentItemDeleted>` | `DELETE /v1/quickbooks-desktop/payment-items/{id}` | Delete a payment item. Async mode: `{ async: true }`. |
| `client.qbd.paymentItems.list(params?: PaymentItemListParams & ConductorEndUserParam, options?): PagePromise<PaymentItem>` | `GET /v1/quickbooks-desktop/payment-items` | List payment items. Async mode: `{ async: true }`. |
| `client.qbd.paymentItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/payment-items/{id}/merge` | Merge a payment item into another. Async mode: `{ async: true }`. |
| `client.qbd.paymentItems.retrieve(id: string, options?): APIPromise<PaymentItem>` | `GET /v1/quickbooks-desktop/payment-items/{id}` | Retrieve a payment item. Async mode: `{ async: true }`. |
| `client.qbd.paymentItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/payment-items/{id}/custom-fields` | Set a custom field on a payment item. Async mode: `{ async: true }`. |
| `client.qbd.paymentItems.update(id: string, params: PaymentItemUpdateInput & ConductorEndUserParam, options?): APIPromise<PaymentItem>` | `POST /v1/quickbooks-desktop/payment-items/{id}` | Update a payment item. Async mode: `{ async: true }`. |

## client.qbd.paymentMethods

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.paymentMethods.create(params: PaymentMethodCreateInput & ConductorEndUserParam, options?): APIPromise<PaymentMethod>` | `POST /v1/quickbooks-desktop/payment-methods` | Create a payment method. Async mode: `{ async: true }`. |
| `client.qbd.paymentMethods.delete(id: string, params: PaymentMethodDeleteParams & ConductorEndUserParam, options?): APIPromise<PaymentMethodDeleted>` | `DELETE /v1/quickbooks-desktop/payment-methods/{id}` | Delete a payment method. Async mode: `{ async: true }`. |
| `client.qbd.paymentMethods.list(params?: PaymentMethodListParams & ConductorEndUserParam, options?): APIPromise<PaymentMethodList>` | `GET /v1/quickbooks-desktop/payment-methods` | List payment methods. Async mode: `{ async: true }`. |
| `client.qbd.paymentMethods.retrieve(id: string, options?): APIPromise<PaymentMethod>` | `GET /v1/quickbooks-desktop/payment-methods/{id}` | Retrieve a payment method. Async mode: `{ async: true }`. |

## client.qbd.paymentsToDeposit

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.paymentsToDeposit.list(options?): APIPromise<PaymentsToDepositList>` | `GET /v1/quickbooks-desktop/payments-to-deposit` | List payment to deposits. Async mode: `{ async: true }`. |

## client.qbd.payrollNonWageItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.payrollNonWageItems.delete(id: string, params: PayrollNonWageItemDeleteParams & ConductorEndUserParam, options?): APIPromise<PayrollNonWageItemDeleted>` | `DELETE /v1/quickbooks-desktop/payroll-non-wage-items/{id}` | Delete a payroll non-wage item. Async mode: `{ async: true }`. |
| `client.qbd.payrollNonWageItems.list(params?: PayrollNonWageItemListParams & ConductorEndUserParam, options?): APIPromise<PayrollNonWageItemList>` | `GET /v1/quickbooks-desktop/payroll-non-wage-items` | List payroll non-wage items. Async mode: `{ async: true }`. |
| `client.qbd.payrollNonWageItems.retrieve(id: string, options?): APIPromise<PayrollNonWageItem>` | `GET /v1/quickbooks-desktop/payroll-non-wage-items/{id}` | Retrieve a payroll non-wage item. Async mode: `{ async: true }`. |

## client.qbd.payrollWageItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.payrollWageItems.create(params: PayrollWageItemCreateInput & ConductorEndUserParam, options?): APIPromise<PayrollWageItem>` | `POST /v1/quickbooks-desktop/payroll-wage-items` | Create a payroll wage item. Async mode: `{ async: true }`. |
| `client.qbd.payrollWageItems.delete(id: string, params: PayrollWageItemDeleteParams & ConductorEndUserParam, options?): APIPromise<PayrollWageItemDeleted>` | `DELETE /v1/quickbooks-desktop/payroll-wage-items/{id}` | Delete a payroll wage item. Async mode: `{ async: true }`. |
| `client.qbd.payrollWageItems.list(params?: PayrollWageItemListParams & ConductorEndUserParam, options?): APIPromise<PayrollWageItemList>` | `GET /v1/quickbooks-desktop/payroll-wage-items` | List payroll wage items. Async mode: `{ async: true }`. |
| `client.qbd.payrollWageItems.retrieve(id: string, options?): APIPromise<PayrollWageItem>` | `GET /v1/quickbooks-desktop/payroll-wage-items/{id}` | Retrieve a payroll wage item. Async mode: `{ async: true }`. |
| `client.qbd.payrollWageItems.update(id: string, params: PayrollWageItemUpdateInput & ConductorEndUserParam, options?): APIPromise<PayrollWageItem>` | `POST /v1/quickbooks-desktop/payroll-wage-items/{id}` | Update a payroll wage item. Async mode: `{ async: true }`. |

## client.qbd.preferences

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.preferences.retrieve(options?): APIPromise<Preference>` | `GET /v1/quickbooks-desktop/preferences` | Retrieve company preferences. Async mode: `{ async: true }`. |

## client.qbd.priceLevels

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.priceLevels.create(params: PriceLevelCreateInput & ConductorEndUserParam, options?): APIPromise<PriceLevel>` | `POST /v1/quickbooks-desktop/price-levels` | Create a price level. Async mode: `{ async: true }`. |
| `client.qbd.priceLevels.delete(id: string, params: PriceLevelDeleteParams & ConductorEndUserParam, options?): APIPromise<PriceLevelDeleted>` | `DELETE /v1/quickbooks-desktop/price-levels/{id}` | Delete a price level. Async mode: `{ async: true }`. |
| `client.qbd.priceLevels.list(params?: PriceLevelListParams & ConductorEndUserParam, options?): APIPromise<PriceLevelList>` | `GET /v1/quickbooks-desktop/price-levels` | List price levels. Async mode: `{ async: true }`. |
| `client.qbd.priceLevels.retrieve(id: string, options?): APIPromise<PriceLevel>` | `GET /v1/quickbooks-desktop/price-levels/{id}` | Retrieve a price level. Async mode: `{ async: true }`. |
| `client.qbd.priceLevels.update(id: string, params: PriceLevelUpdateInput & ConductorEndUserParam, options?): APIPromise<PriceLevel>` | `POST /v1/quickbooks-desktop/price-levels/{id}` | Update a price level. Async mode: `{ async: true }`. |

## client.qbd.purchaseOrders

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.purchaseOrders.create(params: PurchaseOrderCreateInput & ConductorEndUserParam, options?): APIPromise<PurchaseOrder>` | `POST /v1/quickbooks-desktop/purchase-orders` | Create a purchase order. Async mode: `{ async: true }`. |
| `client.qbd.purchaseOrders.delete(id: string, options?): APIPromise<PurchaseOrderDeleted>` | `DELETE /v1/quickbooks-desktop/purchase-orders/{id}` | Delete a purchase order. Async mode: `{ async: true }`. |
| `client.qbd.purchaseOrders.list(params?: PurchaseOrderListParams & ConductorEndUserParam, options?): PagePromise<PurchaseOrder>` | `GET /v1/quickbooks-desktop/purchase-orders` | List purchase orders. Async mode: `{ async: true }`. |
| `client.qbd.purchaseOrders.retrieve(id: string, options?): APIPromise<PurchaseOrder>` | `GET /v1/quickbooks-desktop/purchase-orders/{id}` | Retrieve a purchase order. Async mode: `{ async: true }`. |
| `client.qbd.purchaseOrders.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/purchase-orders/{id}/custom-fields` | Set a custom field on a purchase order. Async mode: `{ async: true }`. |
| `client.qbd.purchaseOrders.update(id: string, params: PurchaseOrderUpdateInput & ConductorEndUserParam, options?): APIPromise<PurchaseOrder>` | `POST /v1/quickbooks-desktop/purchase-orders/{id}` | Update a purchase order. Async mode: `{ async: true }`. |

## client.qbd.receivePayments

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.receivePayments.create(params: ReceivePaymentCreateInput & ConductorEndUserParam, options?): APIPromise<ReceivePayment>` | `POST /v1/quickbooks-desktop/receive-payments` | Create a received payment. Async mode: `{ async: true }`. |
| `client.qbd.receivePayments.delete(id: string, options?): APIPromise<ReceivePaymentDeleted>` | `DELETE /v1/quickbooks-desktop/receive-payments/{id}` | Delete a received payment. Async mode: `{ async: true }`. |
| `client.qbd.receivePayments.list(params?: ReceivePaymentListParams & ConductorEndUserParam, options?): PagePromise<ReceivePayment>` | `GET /v1/quickbooks-desktop/receive-payments` | List received payments. Async mode: `{ async: true }`. |
| `client.qbd.receivePayments.retrieve(id: string, options?): APIPromise<ReceivePayment>` | `GET /v1/quickbooks-desktop/receive-payments/{id}` | Retrieve a received payment. Async mode: `{ async: true }`. |
| `client.qbd.receivePayments.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/receive-payments/{id}/custom-fields` | Set a custom field on a received payment. Async mode: `{ async: true }`. |
| `client.qbd.receivePayments.update(id: string, params: ReceivePaymentUpdateInput & ConductorEndUserParam, options?): APIPromise<ReceivePayment>` | `POST /v1/quickbooks-desktop/receive-payments/{id}` | Update a received payment. Async mode: `{ async: true }`. |

## client.qbd.reports

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.reports.aging(params: ReportAgingParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/aging` | Run an aging report. Async mode: `{ async: true }`. |
| `client.qbd.reports.budgetSummary(params: ReportBudgetSummaryParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/budget-summary` | Run a budget summary report. Async mode: `{ async: true }`. |
| `client.qbd.reports.customDetail(params: ReportCustomDetailParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/custom-detail` | Run a custom detail report. Async mode: `{ async: true }`. |
| `client.qbd.reports.customSummary(params: ReportCustomSummaryParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/custom-summary` | Run a custom summary report. Async mode: `{ async: true }`. |
| `client.qbd.reports.generalDetail(params: ReportGeneralDetailParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/general-detail` | Run a general detail report. Async mode: `{ async: true }`. |
| `client.qbd.reports.generalSummary(params: ReportGeneralSummaryParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/general-summary` | Run a general summary report. Async mode: `{ async: true }`. |
| `client.qbd.reports.job(params: ReportJobParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/job` | Run a job report. Async mode: `{ async: true }`. |
| `client.qbd.reports.payrollDetail(params: ReportPayrollDetailParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/payroll-detail` | Run a payroll detail report. Async mode: `{ async: true }`. |
| `client.qbd.reports.payrollSummary(params: ReportPayrollSummaryParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/payroll-summary` | Run a payroll summary report. Async mode: `{ async: true }`. |
| `client.qbd.reports.time(params: ReportTimeParams & ConductorEndUserParam, options?): APIPromise<Report>` | `GET /v1/quickbooks-desktop/reports/time` | Run a time report. Async mode: `{ async: true }`. |

## client.qbd.salesOrders

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesOrders.create(params: SalesOrderCreateInput & ConductorEndUserParam, options?): APIPromise<SalesOrder>` | `POST /v1/quickbooks-desktop/sales-orders` | Create a sales order. Async mode: `{ async: true }`. |
| `client.qbd.salesOrders.delete(id: string, options?): APIPromise<SalesOrderDeleted>` | `DELETE /v1/quickbooks-desktop/sales-orders/{id}` | Delete a sales order. Async mode: `{ async: true }`. |
| `client.qbd.salesOrders.list(params?: SalesOrderListParams & ConductorEndUserParam, options?): PagePromise<SalesOrder>` | `GET /v1/quickbooks-desktop/sales-orders` | List sales orders. Async mode: `{ async: true }`. |
| `client.qbd.salesOrders.retrieve(id: string, options?): APIPromise<SalesOrder>` | `GET /v1/quickbooks-desktop/sales-orders/{id}` | Retrieve a sales order. Async mode: `{ async: true }`. |
| `client.qbd.salesOrders.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/sales-orders/{id}/custom-fields` | Set a custom field on a sales order. Async mode: `{ async: true }`. |
| `client.qbd.salesOrders.update(id: string, params: SalesOrderUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesOrder>` | `POST /v1/quickbooks-desktop/sales-orders/{id}` | Update a sales order. Async mode: `{ async: true }`. |

## client.qbd.salesReceipts

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesReceipts.create(params: SalesReceiptCreateInput & ConductorEndUserParam, options?): APIPromise<SalesReceipt>` | `POST /v1/quickbooks-desktop/sales-receipts` | Create a sales receipt. Async mode: `{ async: true }`. |
| `client.qbd.salesReceipts.delete(id: string, options?): APIPromise<SalesReceiptDeleted>` | `DELETE /v1/quickbooks-desktop/sales-receipts/{id}` | Delete a sales receipt. Async mode: `{ async: true }`. |
| `client.qbd.salesReceipts.list(params?: SalesReceiptListParams & ConductorEndUserParam, options?): PagePromise<SalesReceipt>` | `GET /v1/quickbooks-desktop/sales-receipts` | List sales receipts. Async mode: `{ async: true }`. |
| `client.qbd.salesReceipts.retrieve(id: string, options?): APIPromise<SalesReceipt>` | `GET /v1/quickbooks-desktop/sales-receipts/{id}` | Retrieve a sales receipt. Async mode: `{ async: true }`. |
| `client.qbd.salesReceipts.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/sales-receipts/{id}/custom-fields` | Set a custom field on a sales receipt. Async mode: `{ async: true }`. |
| `client.qbd.salesReceipts.update(id: string, params: SalesReceiptUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesReceipt>` | `POST /v1/quickbooks-desktop/sales-receipts/{id}` | Update a sales receipt. Async mode: `{ async: true }`. |
| `client.qbd.salesReceipts.void(id: string, options?): APIPromise<SalesReceiptVoided>` | `POST /v1/quickbooks-desktop/sales-receipts/{id}/void` | Void a sales receipt. Async mode: `{ async: true }`. |

## client.qbd.salesRepresentatives

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesRepresentatives.create(params: SalesRepresentativeCreateInput & ConductorEndUserParam, options?): APIPromise<SalesRepresentative>` | `POST /v1/quickbooks-desktop/sales-representatives` | Create a sales representative. Async mode: `{ async: true }`. |
| `client.qbd.salesRepresentatives.delete(id: string, params: SalesRepresentativeDeleteParams & ConductorEndUserParam, options?): APIPromise<SalesRepresentativeDeleted>` | `DELETE /v1/quickbooks-desktop/sales-representatives/{id}` | Delete a sales representative. Async mode: `{ async: true }`. |
| `client.qbd.salesRepresentatives.list(params?: SalesRepresentativeListParams & ConductorEndUserParam, options?): APIPromise<SalesRepresentativeList>` | `GET /v1/quickbooks-desktop/sales-representatives` | List sales representatives. Async mode: `{ async: true }`. |
| `client.qbd.salesRepresentatives.retrieve(id: string, options?): APIPromise<SalesRepresentative>` | `GET /v1/quickbooks-desktop/sales-representatives/{id}` | Retrieve a sales representative. Async mode: `{ async: true }`. |
| `client.qbd.salesRepresentatives.update(id: string, params: SalesRepresentativeUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesRepresentative>` | `POST /v1/quickbooks-desktop/sales-representatives/{id}` | Update a sales representative. Async mode: `{ async: true }`. |

## client.qbd.salesTaxCodes

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesTaxCodes.create(params: SalesTaxCodeCreateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxCode>` | `POST /v1/quickbooks-desktop/sales-tax-codes` | Create a sales tax code. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxCodes.delete(id: string, params: SalesTaxCodeDeleteParams & ConductorEndUserParam, options?): APIPromise<SalesTaxCodeDeleted>` | `DELETE /v1/quickbooks-desktop/sales-tax-codes/{id}` | Delete a sales tax code. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxCodes.list(params?: SalesTaxCodeListParams & ConductorEndUserParam, options?): APIPromise<SalesTaxCodeList>` | `GET /v1/quickbooks-desktop/sales-tax-codes` | List sales tax codes. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxCodes.retrieve(id: string, options?): APIPromise<SalesTaxCode>` | `GET /v1/quickbooks-desktop/sales-tax-codes/{id}` | Retrieve a sales tax code. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxCodes.update(id: string, params: SalesTaxCodeUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxCode>` | `POST /v1/quickbooks-desktop/sales-tax-codes/{id}` | Update a sales tax code. Async mode: `{ async: true }`. |

## client.qbd.salesTaxGroupItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesTaxGroupItems.create(params: SalesTaxGroupItemCreateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxGroupItem>` | `POST /v1/quickbooks-desktop/sales-tax-group-items` | Create a sales tax group item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxGroupItems.delete(id: string, params: SalesTaxGroupItemDeleteParams & ConductorEndUserParam, options?): APIPromise<SalesTaxGroupItemDeleted>` | `DELETE /v1/quickbooks-desktop/sales-tax-group-items/{id}` | Delete a sales tax group item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxGroupItems.list(params?: SalesTaxGroupItemListParams & ConductorEndUserParam, options?): PagePromise<SalesTaxGroupItem>` | `GET /v1/quickbooks-desktop/sales-tax-group-items` | List sales tax group items. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxGroupItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/sales-tax-group-items/{id}/merge` | Merge a sales tax group item into another. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxGroupItems.retrieve(id: string, options?): APIPromise<SalesTaxGroupItem>` | `GET /v1/quickbooks-desktop/sales-tax-group-items/{id}` | Retrieve a sales tax group item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxGroupItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/sales-tax-group-items/{id}/custom-fields` | Set a custom field on a sales tax group item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxGroupItems.update(id: string, params: SalesTaxGroupItemUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxGroupItem>` | `POST /v1/quickbooks-desktop/sales-tax-group-items/{id}` | Update a sales tax group item. Async mode: `{ async: true }`. |

## client.qbd.salesTaxItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesTaxItems.create(params: SalesTaxItemCreateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxItem>` | `POST /v1/quickbooks-desktop/sales-tax-items` | Create a sales tax item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxItems.delete(id: string, params: SalesTaxItemDeleteParams & ConductorEndUserParam, options?): APIPromise<SalesTaxItemDeleted>` | `DELETE /v1/quickbooks-desktop/sales-tax-items/{id}` | Delete a sales tax item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxItems.list(params?: SalesTaxItemListParams & ConductorEndUserParam, options?): PagePromise<SalesTaxItem>` | `GET /v1/quickbooks-desktop/sales-tax-items` | List sales tax items. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/sales-tax-items/{id}/merge` | Merge a sales tax item into another. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxItems.retrieve(id: string, options?): APIPromise<SalesTaxItem>` | `GET /v1/quickbooks-desktop/sales-tax-items/{id}` | Retrieve a sales tax item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/sales-tax-items/{id}/custom-fields` | Set a custom field on a sales tax item. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxItems.update(id: string, params: SalesTaxItemUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxItem>` | `POST /v1/quickbooks-desktop/sales-tax-items/{id}` | Update a sales tax item. Async mode: `{ async: true }`. |

## client.qbd.salesTaxPaymentChecks

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.salesTaxPaymentChecks.create(params: SalesTaxPaymentCheckCreateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxPaymentCheck>` | `POST /v1/quickbooks-desktop/sales-tax-payment-checks` | Create a sales tax payment check. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxPaymentChecks.delete(id: string, options?): APIPromise<SalesTaxPaymentCheckDeleted>` | `DELETE /v1/quickbooks-desktop/sales-tax-payment-checks/{id}` | Delete a sales tax payment check. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxPaymentChecks.list(params?: SalesTaxPaymentCheckListParams & ConductorEndUserParam, options?): PagePromise<SalesTaxPaymentCheck>` | `GET /v1/quickbooks-desktop/sales-tax-payment-checks` | List sales tax payment checks. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxPaymentChecks.retrieve(id: string, options?): APIPromise<SalesTaxPaymentCheck>` | `GET /v1/quickbooks-desktop/sales-tax-payment-checks/{id}` | Retrieve a sales tax payment check. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxPaymentChecks.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/sales-tax-payment-checks/{id}/custom-fields` | Set a custom field on a sales tax payment check. Async mode: `{ async: true }`. |
| `client.qbd.salesTaxPaymentChecks.update(id: string, params: SalesTaxPaymentCheckUpdateInput & ConductorEndUserParam, options?): APIPromise<SalesTaxPaymentCheck>` | `POST /v1/quickbooks-desktop/sales-tax-payment-checks/{id}` | Update a sales tax payment check. Async mode: `{ async: true }`. |

## client.qbd.serviceItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.serviceItems.create(params: ServiceItemCreateInput & ConductorEndUserParam, options?): APIPromise<ServiceItem>` | `POST /v1/quickbooks-desktop/service-items` | Create a service item. Async mode: `{ async: true }`. |
| `client.qbd.serviceItems.delete(id: string, params: ServiceItemDeleteParams & ConductorEndUserParam, options?): APIPromise<ServiceItemDeleted>` | `DELETE /v1/quickbooks-desktop/service-items/{id}` | Delete a service item. Async mode: `{ async: true }`. |
| `client.qbd.serviceItems.list(params?: ServiceItemListParams & ConductorEndUserParam, options?): PagePromise<ServiceItem>` | `GET /v1/quickbooks-desktop/service-items` | List service items. Async mode: `{ async: true }`. |
| `client.qbd.serviceItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/service-items/{id}/merge` | Merge a service item into another. Async mode: `{ async: true }`. |
| `client.qbd.serviceItems.retrieve(id: string, options?): APIPromise<ServiceItem>` | `GET /v1/quickbooks-desktop/service-items/{id}` | Retrieve a service item. Async mode: `{ async: true }`. |
| `client.qbd.serviceItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/service-items/{id}/custom-fields` | Set a custom field on a service item. Async mode: `{ async: true }`. |
| `client.qbd.serviceItems.update(id: string, params: ServiceItemUpdateInput & ConductorEndUserParam, options?): APIPromise<ServiceItem>` | `POST /v1/quickbooks-desktop/service-items/{id}` | Update a service item. Async mode: `{ async: true }`. |

## client.qbd.shippingMethods

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.shippingMethods.create(params: ShippingMethodCreateInput & ConductorEndUserParam, options?): APIPromise<ShippingMethod>` | `POST /v1/quickbooks-desktop/shipping-methods` | Create a shipping method. Async mode: `{ async: true }`. |
| `client.qbd.shippingMethods.delete(id: string, params: ShippingMethodDeleteParams & ConductorEndUserParam, options?): APIPromise<ShippingMethodDeleted>` | `DELETE /v1/quickbooks-desktop/shipping-methods/{id}` | Delete a shipping method. Async mode: `{ async: true }`. |
| `client.qbd.shippingMethods.list(params?: ShippingMethodListParams & ConductorEndUserParam, options?): APIPromise<ShippingMethodList>` | `GET /v1/quickbooks-desktop/shipping-methods` | List shipping methods. Async mode: `{ async: true }`. |
| `client.qbd.shippingMethods.retrieve(id: string, options?): APIPromise<ShippingMethod>` | `GET /v1/quickbooks-desktop/shipping-methods/{id}` | Retrieve a shipping method. Async mode: `{ async: true }`. |

## client.qbd.standardTerms

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.standardTerms.create(params: StandardTermCreateInput & ConductorEndUserParam, options?): APIPromise<StandardTerm>` | `POST /v1/quickbooks-desktop/standard-terms` | Create a standard term. Async mode: `{ async: true }`. |
| `client.qbd.standardTerms.delete(id: string, params: StandardTermDeleteParams & ConductorEndUserParam, options?): APIPromise<StandardTermDeleted>` | `DELETE /v1/quickbooks-desktop/standard-terms/{id}` | Delete a standard term. Async mode: `{ async: true }`. |
| `client.qbd.standardTerms.list(params?: StandardTermListParams & ConductorEndUserParam, options?): APIPromise<StandardTermList>` | `GET /v1/quickbooks-desktop/standard-terms` | List standard terms. Async mode: `{ async: true }`. |
| `client.qbd.standardTerms.retrieve(id: string, options?): APIPromise<StandardTerm>` | `GET /v1/quickbooks-desktop/standard-terms/{id}` | Retrieve a standard term. Async mode: `{ async: true }`. |

## client.qbd.statementCharges

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.statementCharges.create(params: StatementChargeCreateInput & ConductorEndUserParam, options?): APIPromise<StatementCharge>` | `POST /v1/quickbooks-desktop/statement-charges` | Create a statement charge. Async mode: `{ async: true }`. |
| `client.qbd.statementCharges.delete(id: string, options?): APIPromise<StatementChargeDeleted>` | `DELETE /v1/quickbooks-desktop/statement-charges/{id}` | Delete a statement charge. Async mode: `{ async: true }`. |
| `client.qbd.statementCharges.list(params?: StatementChargeListParams & ConductorEndUserParam, options?): PagePromise<StatementCharge>` | `GET /v1/quickbooks-desktop/statement-charges` | List statement charges. Async mode: `{ async: true }`. |
| `client.qbd.statementCharges.retrieve(id: string, options?): APIPromise<StatementCharge>` | `GET /v1/quickbooks-desktop/statement-charges/{id}` | Retrieve a statement charge. Async mode: `{ async: true }`. |
| `client.qbd.statementCharges.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/statement-charges/{id}/custom-fields` | Set a custom field on a statement charge. Async mode: `{ async: true }`. |
| `client.qbd.statementCharges.update(id: string, params: StatementChargeUpdateInput & ConductorEndUserParam, options?): APIPromise<StatementCharge>` | `POST /v1/quickbooks-desktop/statement-charges/{id}` | Update a statement charge. Async mode: `{ async: true }`. |
| `client.qbd.statementCharges.void(id: string, options?): APIPromise<StatementChargeVoided>` | `POST /v1/quickbooks-desktop/statement-charges/{id}/void` | Void a statement charge. Async mode: `{ async: true }`. |

## client.qbd.subtotalItems

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.subtotalItems.create(params: SubtotalItemCreateInput & ConductorEndUserParam, options?): APIPromise<SubtotalItem>` | `POST /v1/quickbooks-desktop/subtotal-items` | Create a subtotal item. Async mode: `{ async: true }`. |
| `client.qbd.subtotalItems.delete(id: string, params: SubtotalItemDeleteParams & ConductorEndUserParam, options?): APIPromise<SubtotalItemDeleted>` | `DELETE /v1/quickbooks-desktop/subtotal-items/{id}` | Delete a subtotal item. Async mode: `{ async: true }`. |
| `client.qbd.subtotalItems.list(params?: SubtotalItemListParams & ConductorEndUserParam, options?): PagePromise<SubtotalItem>` | `GET /v1/quickbooks-desktop/subtotal-items` | List subtotal items. Async mode: `{ async: true }`. |
| `client.qbd.subtotalItems.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/subtotal-items/{id}/merge` | Merge a subtotal item into another. Async mode: `{ async: true }`. |
| `client.qbd.subtotalItems.retrieve(id: string, options?): APIPromise<SubtotalItem>` | `GET /v1/quickbooks-desktop/subtotal-items/{id}` | Retrieve a subtotal item. Async mode: `{ async: true }`. |
| `client.qbd.subtotalItems.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/subtotal-items/{id}/custom-fields` | Set a custom field on a subtotal item. Async mode: `{ async: true }`. |
| `client.qbd.subtotalItems.update(id: string, params: SubtotalItemUpdateInput & ConductorEndUserParam, options?): APIPromise<SubtotalItem>` | `POST /v1/quickbooks-desktop/subtotal-items/{id}` | Update a subtotal item. Async mode: `{ async: true }`. |

## client.qbd.templates

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.templates.list(options?): APIPromise<TemplateList>` | `GET /v1/quickbooks-desktop/templates` | List templates. Async mode: `{ async: true }`. |

## client.qbd.timeTrackingActivities

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.timeTrackingActivities.create(params: TimeTrackingActivityCreateInput & ConductorEndUserParam, options?): APIPromise<TimeTrackingActivity>` | `POST /v1/quickbooks-desktop/time-tracking-activities` | Create a time tracking activity. Async mode: `{ async: true }`. |
| `client.qbd.timeTrackingActivities.delete(id: string, options?): APIPromise<TimeTrackingActivityDeleted>` | `DELETE /v1/quickbooks-desktop/time-tracking-activities/{id}` | Delete a time tracking activity. Async mode: `{ async: true }`. |
| `client.qbd.timeTrackingActivities.list(params?: TimeTrackingActivityListParams & ConductorEndUserParam, options?): PagePromise<TimeTrackingActivity>` | `GET /v1/quickbooks-desktop/time-tracking-activities` | List time tracking activities. Async mode: `{ async: true }`. |
| `client.qbd.timeTrackingActivities.retrieve(id: string, options?): APIPromise<TimeTrackingActivity>` | `GET /v1/quickbooks-desktop/time-tracking-activities/{id}` | Retrieve a time tracking activity. Async mode: `{ async: true }`. |
| `client.qbd.timeTrackingActivities.update(id: string, params: TimeTrackingActivityUpdateInput & ConductorEndUserParam, options?): APIPromise<TimeTrackingActivity>` | `POST /v1/quickbooks-desktop/time-tracking-activities/{id}` | Update a time tracking activity. Async mode: `{ async: true }`. |

## client.qbd.toDos

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.toDos.create(params: ToDoCreateInput & ConductorEndUserParam, options?): APIPromise<ToDo>` | `POST /v1/quickbooks-desktop/to-dos` | Create a to-do. Async mode: `{ async: true }`. |
| `client.qbd.toDos.delete(id: string, params: ToDoDeleteParams & ConductorEndUserParam, options?): APIPromise<ToDoDeleted>` | `DELETE /v1/quickbooks-desktop/to-dos/{id}` | Delete a to-do. Async mode: `{ async: true }`. |
| `client.qbd.toDos.list(params?: ToDoListParams & ConductorEndUserParam, options?): APIPromise<ToDoList>` | `GET /v1/quickbooks-desktop/to-dos` | List to-dos. Async mode: `{ async: true }`. |
| `client.qbd.toDos.retrieve(id: string, options?): APIPromise<ToDo>` | `GET /v1/quickbooks-desktop/to-dos/{id}` | Retrieve a to-do. Async mode: `{ async: true }`. |
| `client.qbd.toDos.update(id: string, params: ToDoUpdateInput & ConductorEndUserParam, options?): APIPromise<ToDo>` | `POST /v1/quickbooks-desktop/to-dos/{id}` | Update a to-do. Async mode: `{ async: true }`. |

## client.qbd.transactions

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.transactions.list(params?: TransactionListParams & ConductorEndUserParam, options?): PagePromise<Transaction>` | `GET /v1/quickbooks-desktop/transactions` | List transactions. Async mode: `{ async: true }`. |
| `client.qbd.transactions.retrieve(id: string, options?): APIPromise<Transaction>` | `GET /v1/quickbooks-desktop/transactions/{id}` | Retrieve a transaction. Async mode: `{ async: true }`. |
| `client.qbd.transactions.updateClearedStatus(id: string, params: ClearedStatusUpdateInput & ConductorEndUserParam, options?): APIPromise<TransactionClearedStatus>` | `POST /v1/quickbooks-desktop/transactions/{id}/cleared-status` | Update the cleared status of a transaction. Async mode: `{ async: true }`. |

## client.qbd.transfers

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.transfers.create(params: TransferCreateInput & ConductorEndUserParam, options?): APIPromise<Transfer>` | `POST /v1/quickbooks-desktop/transfers` | Create a transfer. Async mode: `{ async: true }`. |
| `client.qbd.transfers.list(params?: TransferListParams & ConductorEndUserParam, options?): PagePromise<Transfer>` | `GET /v1/quickbooks-desktop/transfers` | List transfers. Async mode: `{ async: true }`. |
| `client.qbd.transfers.retrieve(id: string, options?): APIPromise<Transfer>` | `GET /v1/quickbooks-desktop/transfers/{id}` | Retrieve a transfer. Async mode: `{ async: true }`. |
| `client.qbd.transfers.update(id: string, params: TransferUpdateInput & ConductorEndUserParam, options?): APIPromise<Transfer>` | `POST /v1/quickbooks-desktop/transfers/{id}` | Update a transfer. Async mode: `{ async: true }`. |

## client.qbd.unitOfMeasureSets

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.unitOfMeasureSets.create(params: UnitOfMeasureSetCreateInput & ConductorEndUserParam, options?): APIPromise<UnitOfMeasureSet>` | `POST /v1/quickbooks-desktop/unit-of-measure-sets` | Create an unit of measure set. Async mode: `{ async: true }`. |
| `client.qbd.unitOfMeasureSets.list(params?: UnitOfMeasureSetListParams & ConductorEndUserParam, options?): APIPromise<UnitOfMeasureSetList>` | `GET /v1/quickbooks-desktop/unit-of-measure-sets` | List unit of measure sets. Async mode: `{ async: true }`. |
| `client.qbd.unitOfMeasureSets.retrieve(id: string, options?): APIPromise<UnitOfMeasureSet>` | `GET /v1/quickbooks-desktop/unit-of-measure-sets/{id}` | Retrieve an unit of measure set. Async mode: `{ async: true }`. |

## client.qbd.vehicleMileage

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.vehicleMileage.create(params: VehicleMileageCreateInput & ConductorEndUserParam, options?): APIPromise<VehicleMileage>` | `POST /v1/quickbooks-desktop/vehicle-mileage` | Create a vehicle mileage entry. Async mode: `{ async: true }`. |
| `client.qbd.vehicleMileage.delete(id: string, options?): APIPromise<VehicleMileageDeleted>` | `DELETE /v1/quickbooks-desktop/vehicle-mileage/{id}` | Delete a vehicle mileage entry. Async mode: `{ async: true }`. |
| `client.qbd.vehicleMileage.list(params?: VehicleMileageListParams & ConductorEndUserParam, options?): PagePromise<VehicleMileage>` | `GET /v1/quickbooks-desktop/vehicle-mileage` | List vehicle mileage entries. Async mode: `{ async: true }`. |
| `client.qbd.vehicleMileage.retrieve(id: string, options?): APIPromise<VehicleMileage>` | `GET /v1/quickbooks-desktop/vehicle-mileage/{id}` | Retrieve a vehicle mileage entry. Async mode: `{ async: true }`. |

## client.qbd.vehicles

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.vehicles.create(params: VehicleCreateInput & ConductorEndUserParam, options?): APIPromise<Vehicle>` | `POST /v1/quickbooks-desktop/vehicles` | Create a vehicle. Async mode: `{ async: true }`. |
| `client.qbd.vehicles.delete(id: string, params: VehicleDeleteParams & ConductorEndUserParam, options?): APIPromise<VehicleDeleted>` | `DELETE /v1/quickbooks-desktop/vehicles/{id}` | Delete a vehicle. Async mode: `{ async: true }`. |
| `client.qbd.vehicles.list(params?: VehicleListParams & ConductorEndUserParam, options?): APIPromise<VehicleList>` | `GET /v1/quickbooks-desktop/vehicles` | List vehicles. Async mode: `{ async: true }`. |
| `client.qbd.vehicles.retrieve(id: string, options?): APIPromise<Vehicle>` | `GET /v1/quickbooks-desktop/vehicles/{id}` | Retrieve a vehicle. Async mode: `{ async: true }`. |
| `client.qbd.vehicles.update(id: string, params: VehicleUpdateInput & ConductorEndUserParam, options?): APIPromise<Vehicle>` | `POST /v1/quickbooks-desktop/vehicles/{id}` | Update a vehicle. Async mode: `{ async: true }`. |

## client.qbd.vendorCredits

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.vendorCredits.create(params: VendorCreditCreateInput & ConductorEndUserParam, options?): APIPromise<VendorCredit>` | `POST /v1/quickbooks-desktop/vendor-credits` | Create a vendor credit. Async mode: `{ async: true }`. |
| `client.qbd.vendorCredits.delete(id: string, options?): APIPromise<VendorCreditDeleted>` | `DELETE /v1/quickbooks-desktop/vendor-credits/{id}` | Delete a vendor credit. Async mode: `{ async: true }`. |
| `client.qbd.vendorCredits.list(params?: VendorCreditListParams & ConductorEndUserParam, options?): PagePromise<VendorCredit>` | `GET /v1/quickbooks-desktop/vendor-credits` | List vendor credits. Async mode: `{ async: true }`. |
| `client.qbd.vendorCredits.retrieve(id: string, options?): APIPromise<VendorCredit>` | `GET /v1/quickbooks-desktop/vendor-credits/{id}` | Retrieve a vendor credit. Async mode: `{ async: true }`. |
| `client.qbd.vendorCredits.setCustomField(id: string, params: TransactionCustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/vendor-credits/{id}/custom-fields` | Set a custom field on a vendor credit. Async mode: `{ async: true }`. |
| `client.qbd.vendorCredits.update(id: string, params: VendorCreditUpdateInput & ConductorEndUserParam, options?): APIPromise<VendorCredit>` | `POST /v1/quickbooks-desktop/vendor-credits/{id}` | Update a vendor credit. Async mode: `{ async: true }`. |
| `client.qbd.vendorCredits.void(id: string, options?): APIPromise<VendorCreditVoided>` | `POST /v1/quickbooks-desktop/vendor-credits/{id}/void` | Void a vendor credit. Async mode: `{ async: true }`. |

## client.qbd.vendors

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.vendors.create(params: VendorCreateInput & ConductorEndUserParam, options?): APIPromise<Vendor>` | `POST /v1/quickbooks-desktop/vendors` | Create a vendor. Async mode: `{ async: true }`. |
| `client.qbd.vendors.delete(id: string, params: VendorDeleteParams & ConductorEndUserParam, options?): APIPromise<VendorDeleted>` | `DELETE /v1/quickbooks-desktop/vendors/{id}` | Delete a vendor. Async mode: `{ async: true }`. |
| `client.qbd.vendors.list(params?: VendorListParams & ConductorEndUserParam, options?): PagePromise<Vendor>` | `GET /v1/quickbooks-desktop/vendors` | List vendors. Async mode: `{ async: true }`. |
| `client.qbd.vendors.merge(id: string, params: ListMergeInput & ConductorEndUserParam, options?): APIPromise<ListMerge>` | `POST /v1/quickbooks-desktop/vendors/{id}/merge` | Merge a vendor into another. Async mode: `{ async: true }`. |
| `client.qbd.vendors.retrieve(id: string, options?): APIPromise<Vendor>` | `GET /v1/quickbooks-desktop/vendors/{id}` | Retrieve a vendor. Async mode: `{ async: true }`. |
| `client.qbd.vendors.setCustomField(id: string, params: CustomFieldValueInput & ConductorEndUserParam, options?): APIPromise<CustomFieldValue>` | `POST /v1/quickbooks-desktop/vendors/{id}/custom-fields` | Set a custom field on a vendor. Async mode: `{ async: true }`. |
| `client.qbd.vendors.update(id: string, params: VendorUpdateInput & ConductorEndUserParam, options?): APIPromise<Vendor>` | `POST /v1/quickbooks-desktop/vendors/{id}` | Update a vendor. Async mode: `{ async: true }`. |

## client.qbd.vendorTypes

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.vendorTypes.create(params: VendorTypeCreateInput & ConductorEndUserParam, options?): APIPromise<VendorType>` | `POST /v1/quickbooks-desktop/vendor-types` | Create a vendor type. Async mode: `{ async: true }`. |
| `client.qbd.vendorTypes.delete(id: string, params: VendorTypeDeleteParams & ConductorEndUserParam, options?): APIPromise<VendorTypeDeleted>` | `DELETE /v1/quickbooks-desktop/vendor-types/{id}` | Delete a vendor type. Async mode: `{ async: true }`. |
| `client.qbd.vendorTypes.list(params?: VendorTypeListParams & ConductorEndUserParam, options?): APIPromise<VendorTypeList>` | `GET /v1/quickbooks-desktop/vendor-types` | List vendor types. Async mode: `{ async: true }`. |
| `client.qbd.vendorTypes.retrieve(id: string, options?): APIPromise<VendorType>` | `GET /v1/quickbooks-desktop/vendor-types/{id}` | Retrieve a vendor type. Async mode: `{ async: true }`. |

## client.qbd.workersCompCodes

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.workersCompCodes.create(params: WorkersCompCodeCreateInput & ConductorEndUserParam, options?): APIPromise<WorkersCompCode>` | `POST /v1/quickbooks-desktop/workers-comp-codes` | Create a workers' compensation code. Async mode: `{ async: true }`. |
| `client.qbd.workersCompCodes.delete(id: string, params: WorkersCompCodeDeleteParams & ConductorEndUserParam, options?): APIPromise<WorkersCompCodeDeleted>` | `DELETE /v1/quickbooks-desktop/workers-comp-codes/{id}` | Delete a workers' compensation code. Async mode: `{ async: true }`. |
| `client.qbd.workersCompCodes.list(params?: WorkersCompCodeListParams & ConductorEndUserParam, options?): APIPromise<WorkersCompCodeList>` | `GET /v1/quickbooks-desktop/workers-comp-codes` | List workers' compensation codes. Async mode: `{ async: true }`. |
| `client.qbd.workersCompCodes.retrieve(id: string, options?): APIPromise<WorkersCompCode>` | `GET /v1/quickbooks-desktop/workers-comp-codes/{id}` | Retrieve a workers' compensation code. Async mode: `{ async: true }`. |
| `client.qbd.workersCompCodes.update(id: string, params: WorkersCompCodeUpdateInput & ConductorEndUserParam, options?): APIPromise<WorkersCompCode>` | `POST /v1/quickbooks-desktop/workers-comp-codes/{id}` | Update a workers' compensation code. Async mode: `{ async: true }`. |

## client.qbd

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.qbd.batch(params: Omit<BatchInput, "requests"> & { requests: R } & ConductorEndUserParam, options?): APIPromise<BatchFor<R>>` | `POST /v1/quickbooks-desktop/batch` | Run several operations in one round trip. Async mode: `{ async: true }`. |
| `client.qbd.healthCheck(options?): APIPromise<HealthCheck>` | `GET /v1/quickbooks-desktop/health-check` | Check the QuickBooks Desktop connection. Async mode: `{ async: true }`. |

## client.requests

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.requests.cancel(id: string, options?): APIPromise<Request>` | `POST /v1/requests/{id}/cancel` | Cancel a request. |
| `client.requests.list(params?: RequestListParams, options?): PagePromise<RequestSummary>` | `GET /v1/requests` | List requests. |
| `client.requests.retrieve(id: string, params?: RequestRetrieveParams, options?): APIPromise<Request>` | `GET /v1/requests/{id}` | Retrieve a request. |

## client.webhookEndpoints

| Method | HTTP | Summary |
| --- | --- | --- |
| `client.webhookEndpoints.create(params: WebhookEndpointCreateInput, options?): APIPromise<WebhookEndpointWithSecret>` | `POST /v1/webhook-endpoints` | Create a webhook endpoint. |
| `client.webhookEndpoints.delete(id: string, options?): APIPromise<WebhookEndpointDeleted>` | `DELETE /v1/webhook-endpoints/{id}` | Delete a webhook endpoint. |
| `client.webhookEndpoints.list(params?: WebhookEndpointListParams, options?): PagePromise<WebhookEndpoint>` | `GET /v1/webhook-endpoints` | List webhook endpoints. |
| `client.webhookEndpoints.listDeliveries(id: string, params?: WebhookEndpointListDeliveriesParams, options?): PagePromise<WebhookDelivery>` | `GET /v1/webhook-endpoints/{id}/deliveries` | List deliveries. |
| `client.webhookEndpoints.resendDelivery(id: string, deliveryId: string, options?): APIPromise<WebhookDelivery>` | `POST /v1/webhook-endpoints/{id}/deliveries/{deliveryId}/resend` | Resend a delivery. |
| `client.webhookEndpoints.retrieve(id: string, options?): APIPromise<WebhookEndpoint>` | `GET /v1/webhook-endpoints/{id}` | Retrieve a webhook endpoint. |
| `client.webhookEndpoints.rotateSecret(id: string, options?): APIPromise<WebhookEndpointWithSecret>` | `POST /v1/webhook-endpoints/{id}/rotate-secret` | Rotate the signing secret. |
| `client.webhookEndpoints.sendTestEvent(id: string, options?): APIPromise<WebhookDelivery>` | `POST /v1/webhook-endpoints/{id}/test` | Send a test event. |
| `client.webhookEndpoints.update(id: string, params: WebhookEndpointUpdateInput, options?): APIPromise<WebhookEndpoint>` | `POST /v1/webhook-endpoints/{id}` | Update a webhook endpoint. |
