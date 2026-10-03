/**
 * Cached external APIs — display names and documentation links for
 * every upstream behind `useCachedFetch()` (keyed by `CachedApiId`).
 *
 * The refresh-warning dialog resolves its copy here: `name` fills the
 * description's `%1`, `docs` opens the per-language rate-limit page
 * (English fallback — missing variants are omitted, never duplicated).
 */

import type { CachedApiId, LanguageAwareString } from "../types/app";

/** Metadata for one externally cached API. */
export interface CachedApiMeta {
  /** Display name — a proper noun, identical in all languages. */
  name: string;
  /** Related documentation link, per language (English fallback). */
  docs?: LanguageAwareString;
}

/** Per-API metadata keyed by `CachedApiId` (drift fails at typecheck). */
export const CACHED_APIS: Record<CachedApiId, CachedApiMeta> = {
  "github-rest": {
    name: "GitHub REST API",
    docs: {
      en: "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
      "zh-Hans":
        "https://docs.github.com/zh/rest/using-the-rest-api/rate-limits-for-the-rest-api",
      // zh-Hant omitted — no traditional-Chinese edition exists.
    },
  },
  playerdb: {
    name: "PlayerDB",
    docs: { en: "https://playerdb.co/" },
  },
};
