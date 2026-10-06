// Async-mode request handle. Hand-written runtime.

import type { Request } from "../generated/models.ts";
import { RequestPendingError } from "./errors.ts";

/** @internal What a handle needs from the client. */
export interface RequestHandleBackend<T> {
  /** One `GET /v1/requests/{id}` without waiting. */
  retrieve(id: string): Promise<Request>;
  /** Long-polls until the request settles or the deadline passes. */
  waitFor(id: string, deadline: number, last: Request): Promise<T>;
  /** Returns the typed result of a settled request, throws its typed error, or returns undefined if it has not settled. */
  settle(request: Request): { value: T } | undefined;
  /** Default wait budget in milliseconds (the client timeout). */
  defaultTimeout: number;
}

/**
 * Handle for a request accepted in async mode (`Prefer: respond-async`, `202 Accepted`).
 * The SDK resolves it into the operation's typed result.
 */
export class RequestHandle<T> {
  /** Request ID (`req_...`). */
  readonly id: string;
  /** Request snapshot from the 202 response. */
  readonly request: Request;
  readonly #backend: RequestHandleBackend<T>;

  /** @internal */
  constructor(request: Request, backend: RequestHandleBackend<T>) {
    this.id = request.id;
    this.request = request;
    this.#backend = backend;
  }

  /** Current request resource (one GET, no waiting). */
  status(): Promise<Request> {
    return this.#backend.retrieve(this.id);
  }

  /**
   * Long-polls `GET /v1/requests/{id}?waitSeconds=...` until the request settles.
   * Returns the typed result on `succeeded`; throws the typed error on `failed`, `canceled` or
   * `outcome_unknown`; throws `RequestPendingError` when `timeout` (milliseconds, default the
   * client timeout) passes first.
   */
  wait(options: { timeout?: number | undefined } = {}): Promise<T> {
    const deadline = Date.now() + (options.timeout ?? this.#backend.defaultTimeout);
    return this.#backend.waitFor(this.id, deadline, this.request);
  }

  /**
   * One GET: the typed result if the request succeeded, the typed error if it failed, or
   * `RequestPendingError` if it has not finished yet.
   */
  async result(): Promise<T> {
    const request = await this.#backend.retrieve(this.id);
    const settled = this.#backend.settle(request);
    if (settled) return settled.value;
    throw new RequestPendingError(this.id, request);
  }
}
