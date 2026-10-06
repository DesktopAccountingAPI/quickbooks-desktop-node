// Package entry point. Hand-written; generation copies it verbatim.

import { DesktopAccountingApi } from "./generated/resources.ts";

export * from "./generated/resources.ts";
export * from "./generated/models.ts";
export { API_VERSION, CONTRACT_SHA256 } from "./generated/meta.ts";
export { VERSION } from "./version.ts";

export {
  BaseClient,
  settleRequest,
  type AsyncRequestOptions,
  type ClientOptions,
  type Fetch,
  type Logger,
  type RequestOptions,
  type SyncRequestOptions,
} from "./core/client.ts";
export { APIPromise, type WithResponse } from "./core/api-promise.ts";
export { PagePromise, type CursorPage } from "./core/pagination.ts";
export { RequestHandle } from "./core/request-handle.ts";
export {
  ApiConnectionError,
  ApiError,
  ApiTimeoutError,
  AuthenticationError,
  BillingError,
  CursorExpiredError,
  DaapiError,
  IntegrationConnectionError,
  IntegrationError,
  InternalError,
  InvalidRequestError,
  OutcomeUnknownError,
  PermissionError,
  RateLimitError,
  RequestPendingError,
  WebhookVerificationError,
  type CursorProgress,
  type ErrorBody,
} from "./core/errors.ts";
export {
  signWebhook,
  verifyWebhook,
  verifyWebhookSignature,
  Webhooks,
  WebhookEventType,
  type WebhookEvent,
  type WebhookPayload,
  type WebhookVerifyOptions,
} from "./core/webhooks.ts";
export { isValidApiKey } from "./core/api-key.ts";
export type { HeadersLike } from "./core/http.ts";

export default DesktopAccountingApi;
