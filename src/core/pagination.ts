// Cursor pagination. Hand-written runtime.

import type { APIPromise, WithResponse } from "./api-promise.ts";
import { CursorExpiredError } from "./errors.ts";

/** One page of a cursor list (`x-daapi-pagination: cursor`). */
export interface CursorPage<T> {
  objectType: "list";
  /** Path of the list endpoint. */
  url: string;
  data: T[];
  /** Cursor for the next page; null on the last page. */
  nextCursor: string | null;
  hasMore: boolean;
  /** Matching records not yet returned; null on the last page or when unknown. */
  remainingCount: number | null;
  /** Server's estimate of the idle deadline for the next page; null on the last page and for platform lists. */
  cursorExpiresAt: string | null;
}

/** @internal Fetches the first page (`cursor` undefined) or a continuation page. */
export type PageFetcher<T> = (cursor: string | undefined) => APIPromise<CursorPage<T>>;

/**
 * Result of a cursor-list method.
 *
 * - `await list(...)` fetches only the first page.
 * - `for await (const item of list(...))` iterates every item across pages.
 * - `.pages()` iterates pages; `.listAll()` collects every item into an array.
 *
 * While iterating, the next page is requested as soon as the current one arrives (one page of
 * read-ahead) so slow consumers stay inside the server's cursor idle window. A network error on a
 * continuation request retries the same cursor. If the cursor expires (`410 CURSOR_EXPIRED`) the
 * iteration throws {@link CursorExpiredError} with progress fields; it never restarts the query.
 */
export class PagePromise<T> implements PromiseLike<CursorPage<T>>, AsyncIterable<T> {
  readonly #fetch: PageFetcher<T>;
  #first: APIPromise<CursorPage<T>> | undefined;

  /** @internal */
  constructor(fetch: PageFetcher<T>) {
    this.#fetch = fetch;
  }

  #firstPage(): APIPromise<CursorPage<T>> {
    this.#first ??= this.#fetch(undefined);
    return this.#first;
  }

  /** First page plus its HTTP response. */
  withResponse(): Promise<WithResponse<CursorPage<T>>> {
    return this.#firstPage().withResponse();
  }

  then<R1 = CursorPage<T>, R2 = never>(
    onfulfilled?: ((value: CursorPage<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.#firstPage().then(onfulfilled, onrejected);
  }

  catch<R = never>(onrejected?: ((reason: unknown) => R | PromiseLike<R>) | null): Promise<CursorPage<T> | R> {
    return this.#firstPage().catch(onrejected);
  }

  /** Iterates pages, fetching one page ahead. */
  async *pages(): AsyncGenerator<CursorPage<T>, void, undefined> {
    let itemsYielded = 0;
    let pagesDelivered = 0;
    let last: T | undefined;
    let next: Promise<CursorPage<T>> = Promise.resolve(this.#firstPage());
    for (;;) {
      let page: CursorPage<T>;
      try {
        page = await next;
      } catch (err) {
        if (err instanceof CursorExpiredError) {
          const item = last as { id?: unknown; updatedAt?: unknown } | undefined;
          throw new CursorExpiredError(err.status, err.error, err.headers, {
            itemsYielded,
            pagesServed: pagesDelivered,
            lastId: typeof item?.id === "string" ? item.id : null,
            lastUpdatedAt: typeof item?.updatedAt === "string" ? item.updatedAt : null,
          });
        }
        throw err;
      }
      const cursor = page.hasMore ? page.nextCursor : null;
      if (cursor) {
        // Read-ahead: request page N+1 now; its error (if any) surfaces when the caller gets there.
        next = Promise.resolve(this.#fetch(cursor));
        next.catch(() => undefined);
      }
      pagesDelivered++;
      itemsYielded += page.data.length;
      if (page.data.length > 0) last = page.data[page.data.length - 1];
      yield page;
      if (!cursor) return;
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    for await (const page of this.pages()) yield* page.data;
  }

  /** Collects every item of every page into memory. */
  async listAll(): Promise<T[]> {
    const out: T[] = [];
    for await (const page of this.pages()) out.push(...page.data);
    return out;
  }
}
