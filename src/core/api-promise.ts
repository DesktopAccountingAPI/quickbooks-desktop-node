// APIPromise: the awaitable every non-paginated method returns. Hand-written runtime.

/** @internal A finished HTTP exchange whose body has not been parsed yet. */
export interface RawResult<T> {
  response: Response;
  read(): Promise<T>;
  /** The `Idempotency-Key` sent for a write. */
  idempotencyKey?: string | null;
  /** The ID of the request that produced the result when it differs from the response's `Daapi-Request-Id` (a long-polled request). */
  requestId?: string | null;
}

/** Parsed result together with the HTTP response it came from. */
export interface WithResponse<T> {
  data: T;
  response: Response;
  /**
   * The ID of the request that produced the result: the response's `Daapi-Request-Id`, or, after the
   * SDK long-polled a request that timed out on the server, that request's ID (look it up with
   * `client.requests.retrieve(requestId)`). The poll's own ID stays in
   * `response.headers.get("daapi-request-id")`.
   */
  requestId: string | null;
  /** The `Idempotency-Key` the SDK sent for a write (generated unless you passed one), else null. */
  idempotencyKey: string | null;
}

/**
 * A promise for the parsed result of an API call. Await it for the typed data, or call
 * `.withResponse()` to also get the HTTP response (status, headers, `Daapi-Request-Id`,
 * `Daapi-Warnings`), or `.asResponse()` for the unread `Response` alone.
 */
export class APIPromise<T> implements PromiseLike<T> {
  readonly #raw: Promise<RawResult<T>>;
  #parsed: Promise<T> | undefined;

  /** @internal */
  constructor(raw: Promise<RawResult<T>>) {
    this.#raw = raw;
    // Errors surface when the caller awaits; an un-awaited call must not crash the process.
    raw.catch(() => undefined);
  }

  #data(): Promise<T> {
    this.#parsed ??= this.#raw.then((r) => r.read());
    return this.#parsed;
  }

  /**
   * The HTTP response without reading its body. Call it instead of awaiting the promise;
   * after the data was parsed the body is already consumed. For a call that long-polled a
   * pending request, this is the last poll's response; `withResponse().requestId` is the ID of
   * the request that produced the result.
   */
  asResponse(): Promise<Response> {
    return this.#raw.then((r) => r.response);
  }

  /** The parsed data plus the HTTP response and its `Daapi-Request-Id`. */
  async withResponse(): Promise<WithResponse<T>> {
    const raw = await this.#raw;
    const data = await this.#data();
    const requestId = raw.requestId ?? raw.response.headers.get("daapi-request-id");
    return { data, response: raw.response, requestId, idempotencyKey: raw.idempotencyKey ?? null };
  }

  /** @internal Transforms the parsed data, keeping the same response. */
  _thenData<U>(transform: (data: T, response: Response) => U | Promise<U>): APIPromise<U> {
    return new APIPromise<U>(
      this.#raw.then((r) => ({
        response: r.response,
        read: async () => transform(await r.read(), r.response),
        idempotencyKey: r.idempotencyKey ?? null,
        requestId: r.requestId ?? null,
      })),
    );
  }

  then<R1 = T, R2 = never>(
    onfulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.#data().then(onfulfilled, onrejected);
  }

  catch<R = never>(onrejected?: ((reason: unknown) => R | PromiseLike<R>) | null): Promise<T | R> {
    return this.#data().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.#data().finally(onfinally);
  }

  get [Symbol.toStringTag](): string {
    return "APIPromise";
  }
}
