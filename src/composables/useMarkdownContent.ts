/**
 * useMarkdownContent — reactive per-language markdown content selector.
 *
 * Statically imports the per-language raw markdown documents (currently
 * the worldview document) and returns a computed string for the active
 * language with an English fallback — sharing the LanguageAwareString
 * resolver used for image sources.  Reactive to language switches:
 * MarkdownArticle re-parses when the content changes.
 */
import { computed, type ComputedRef } from "vue";
import { useI18n } from "./useI18n";
import { resolveLanguageAwareString } from "../core/utils";
import type { LanguageAwareString } from "../types/app";
import enWorldview from "../configs/i18n/en/worldview.md?raw";
import zhHansWorldview from "../configs/i18n/zh-Hans/worldview.md?raw";
import zhHantWorldview from "../configs/i18n/zh-Hant/worldview.md?raw";

/** Per-language markdown sources, keyed by document id. */
const MARKDOWN_SOURCES: Record<string, LanguageAwareString> = {
  worldview: {
    en: enWorldview,
    "zh-Hans": zhHansWorldview,
    "zh-Hant": zhHantWorldview,
  },
};

/**
 * Reactive markdown content for a document id.
 * @param key - The document id (e.g. "worldview").
 * @returns A computed raw-markdown string for the active language.
 */
export function useMarkdownContent(key: string): {
  content: ComputedRef<string>;
} {
  const { locale } = useI18n();
  const content = computed(() =>
    resolveLanguageAwareString(MARKDOWN_SOURCES[key], locale.value),
  );
  return { content };
}
