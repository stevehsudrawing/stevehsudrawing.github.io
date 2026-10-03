/**
 * useRefreshWarningModal — opener for the cached-data refresh warning.
 *
 * Pushes `RefreshWarningModal` (stack id `refresh-warning`) with the
 * caller's cache state: the API id (metadata lookup), the exact request
 * URL (transparency), the cache timestamp, and a confirm callback that
 * performs the re-fetch and reports success (the toast gate).
 *
 * @example
 * const { openRefreshWarningModal } = useRefreshWarningModal();
 * openRefreshWarningModal({ api, url, fetchedAt, refresh, error });
 */

import type { CachedFetchState } from "../core/useCachedFetch";
import { useModalStack } from "./useModalStack";

/**
 * Minimal cache-state surface the opener needs — every endpoint's
 * `useCachedFetch` state satisfies it structurally.
 */
export type RefreshWarningSource = Pick<
  CachedFetchState<unknown>,
  "api" | "url" | "fetchedAt" | "refresh" | "error"
>;

/**
 * Refresh-warning opener.
 *
 * @returns `openRefreshWarningModal(source)` — pushes the modal with
 *          props derived from the cache state.
 */
export function useRefreshWarningModal(): {
  /** Push the refresh warning with props derived from the cache state. */
  openRefreshWarningModal: (source: RefreshWarningSource) => void;
} {
  const { push } = useModalStack();

  function openRefreshWarningModal(source: RefreshWarningSource): void {
    push({
      id: "refresh-warning",
      props: {
        apiId: source.api,
        url: source.url,
        fetchedAt: source.fetchedAt.value,
        refresh: async () => {
          await source.refresh();
          return source.error.value === null;
        },
      },
    });
  }

  return { openRefreshWarningModal };
}
