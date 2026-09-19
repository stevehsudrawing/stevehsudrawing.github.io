/**
 * Markdown -> HAST helper — the shared parse step behind
 * `MarkdownArticle` and the site changelog modal.
 *
 * `marked.parse` produces HTML; `hast-util-from-html` turns it into
 * the HAST tree that `HastFragment` renders.  Consumers post-process
 * the returned root (e.g. MarkdownArticle swaps headings for
 * `section-heading` markers) or pass `children` straight through —
 * no `v-html` anywhere in the pipeline.
 */

import { fromHtml } from "hast-util-from-html";
import { marked } from "marked";
import type { HastNode } from "../types/hast";

/**
 * Parse a markdown string into a HAST fragment root.
 *
 * @param markdown - Raw markdown source.
 * @returns The fragment ROOT node — pass its `children` to
 *          `HastFragment`, or post-process the tree first.
 */
export function markdownToHast(markdown: string): HastNode {
  const html = marked.parse(markdown) as string;
  return fromHtml(html, { fragment: true }) as unknown as HastNode;
}
