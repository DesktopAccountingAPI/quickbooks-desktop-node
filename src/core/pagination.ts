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

/** Progress of one iteration, for {@link CursorExpiredError}. */
interface Progress<T> {
  items: number;
  pages: number;
  last: T | undefined;
}

/**
 * Result of a cursor-list method.
 *
 * - `await list(...)` fetches only the first page.
 * - `for await (const item of list(...))` iterates every item across pages.
 * - `.pages()` iterates pages; `.listAll()` collects every item into an array.
 *
 * The next page is requested only when the iteration needs it, so a loop that stops early
 * (`break`, `return`, an exception) never sends an extra QuickBooks query. While you work through
 * a page item by item, the next page is requested in the background once the page has been in
 * hand for {@link PagePromise.readAheadAfterMs} (2 s): slow consumers stay inside the server's cursor
 * idle window (about 10 s) without fast loops paying for a page they never read. `listAll()`
 * always reads ahead. A network error on a continuation request retries the same cursor. If the
 * cursor expires (`410 CURSOR_EXPIRED`) the iteration throws {@link CursorExpiredError} with
 * progress fields; it never restarts the query.
 */
export class PagePromise<T> implements PromiseLike<CursorPage<T>>, AsyncIterable<T> {
  /**
   * How long (ms) the item iterator holds a page before it requests the next one in the
   * background. @internal Tests lower it; not a stable API.
   */
  static readAheadAfterMs = 2000;

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

  /** Starts the request for the page after `page` (its error, if any, surfaces when awaited). */
  #request(cursor: string): Promise<CursorPage<T>> {
    const next = Promise.resolve(this.#fetch(cursor));
    next.catch(() => undefined);
    return next;
  }

  /** Awaits a page; adds the iteration's progress to a {@link CursorExpiredError}. */
  async #await(page: Promise<CursorPage<T>>, progress: Progress<T>): Promise<CursorPage<T>> {
    try {
      return await page;
    } catch (err) {
      if (err instanceof CursorExpiredError) {
        const item = progress.last as { id?: unknown; updatedAt?: unknown } | undefined;
        throw new CursorExpiredError(err.status, err.error, err.headers, {
          itemsYielded: progress.items,
          pagesServed: progress.pages,
          lastId: typeof item?.id === "string" ? item.id : null,
          lastUpdatedAt: typeof item?.updatedAt === "string" ? item.updatedAt : null,
        });
      }
      throw err;
    }
  }

  /** Iterates pages. The next page is requested when you ask for it. */
  async *pages(): AsyncGenerator<CursorPage<T>, void, undefined> {
    const progress: Progress<T> = { items: 0, pages: 0, last: undefined };
    let current: Promise<CursorPage<T>> = Promise.resolve(this.#firstPage());
    for (;;) {
      const page = await this.#await(current, progress);
      const cursor = page.hasMore ? page.nextCursor : null;
      progress.pages++;
      progress.items += page.data.length;
      if (page.data.length > 0) progress.last = page.data[page.data.length - 1];
      yield page;
      if (!cursor) return;
      current = this.#request(cursor);
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    const progress: Progress<T> = { items: 0, pages: 0, last: undefined };
    let current: Promise<CursorPage<T>> = Promise.resolve(this.#firstPage());
    for (;;) {
      const page = await this.#await(current, progress);
      const received = Date.now();
      const cursor = page.hasMore ? page.nextCursor : null;
      let next: Promise<CursorPage<T>> | undefined;
      progress.pages++;
      for (const item of page.data) {
        // Read-ahead for slow consumers: the caller asked for another item and has held this page
        // long enough that waiting for its end could let the cursor's idle window lapse.
        if (cursor && next === undefined && Date.now() - received >= PagePromise.readAheadAfterMs) next = this.#request(cursor);
        progress.items++;
        progress.last = item;
        yield item;
      }
      if (!cursor) return;
      current = next ?? this.#request(cursor);
    }
  }

  /** Collects every item of every page into memory, requesting each next page as soon as a page arrives. */
  async listAll(): Promise<T[]> {
    const progress: Progress<T> = { items: 0, pages: 0, last: undefined };
    const out: T[] = [];
    let current: Promise<CursorPage<T>> = Promise.resolve(this.#firstPage());
    for (;;) {
      const page = await this.#await(current, progress);
      const cursor = page.hasMore ? page.nextCursor : null;
      if (cursor) current = this.#request(cursor);
      progress.pages++;
      progress.items += page.data.length;
      if (page.data.length > 0) progress.last = page.data[page.data.length - 1];
      out.push(...page.data);
      if (!cursor) return out;
    }
  }
}
