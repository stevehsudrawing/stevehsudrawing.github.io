<!--
  MarkdownArticle.vue — Reusable markdown renderer with built-in scrollspy.

  Accepts a raw markdown string via the `content` prop and renders it through
  a full HAST post-processing pipeline (marked -> fromHtml -> process ->
  HastFragment), then displays the result alongside a desktop sidebar
  scrollspy and a mobile sticky collapsible heading nav.

  Markdown headings (h2–h6) are replaced with `<section-heading>` HAST
  markers that HastFragment renders as SectionHeading, giving every heading
  anchor + copy-link buttons for free.

  Props:
    content      - Raw markdown string (required)
    scrollOffset - Scroll offset for heading clicks, desktop (default 64)
    pagePath     - Page path for heading copy-link URLs (e.g. "/worldview.html")
-->
<script setup lang="ts">
import { BCol, BRow } from "bootstrap-vue-next";
import { fromHtml } from "hast-util-from-html";
import { marked } from "marked";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useBreakpoint } from "../../composables/useBreakpoint";
import { extractPlainText, toDashCase } from "../../core/utils";
import { scrollToHashTarget } from "../../platform/accessibility";
import type { HastNode } from "../../types/hast";
import HastFragment from "../render-functions/HastFragment.vue";

// =========================================================================
// Types
// =========================================================================

/** A heading entry for the scrollspy nav. */
interface HeadingEntry {
  id: string;
  text: string;
  level: number;
}

// =========================================================================
// Props
// =========================================================================

const props = withDefaults(
  defineProps<{
    /** Raw markdown string to render. */
    content: string;
    /** Scroll offset from top for desktop heading clicks. */
    scrollOffset?: number;
    /** Page path for heading copy-link URLs (e.g. "/worldview.html"). */
    pagePath?: string;
  }>(),
  {
    scrollOffset: 64,
  },
);

// =========================================================================
// State
// =========================================================================

/** Collected headings for the scrollspy sidebar. */
const headings = ref<HeadingEntry[]>([]);

/** Currently active heading id based on scroll position. */
const activeId = ref("");

/** Whether the mobile heading list is expanded. */
const headingExpanded = ref(false);

/** Text of the currently active heading (for the mobile collapsed bar). */
const currentHeadingText = computed(() => {
  const h = headings.value.find((h) => h.id === activeId.value);
  return h?.text ?? headings.value[0]?.text ?? "";
});

/**
 * When using the mobile / tablet view, the mobile Scrollspy will be enabled
 * instead of the desktop version. Derived from the shared breakpoint singleton.
 */
const breakpoint = useBreakpoint();
const isDesktop = computed(
  () => breakpoint.value !== "mobile" && breakpoint.value !== "tablet",
);

// =========================================================================
// Actions
// =========================================================================

// -------------------------------------------------------------------------
// HAST post-processing
// -------------------------------------------------------------------------

/**
 * Walk the HAST tree recursively and apply transformations:
 * - Remove h1 elements (title provided by page hero section)
 * - Replace h2–h6 with a `<section-heading>` marker — HastFragment renders
 *   it as SectionHeading (heading with anchor + copy-link buttons); the
 *   original inline children are kept as the heading's slot content so
 *   inline formatting (e.g. `<code>`) is preserved
 * - Collect headings into the reactive `headings` array for scrollspy
 * - Add .table to <table> elements
 * @param node - A HAST node (mutated in place).
 */
function processHastNode(node: HastNode): void {
  if (!node.children) return;

  const newChildren: HastNode[] = [];

  for (const child of node.children) {
    const el = child as HastNode;

    // Remove h1
    if (el.type === "element" && el.tagName === "h1") continue;

    // Replace h2–h6 with a SectionHeading marker; collect for scrollspy
    if (el.type === "element" && el.tagName && /^h[2-6]$/.test(el.tagName)) {
      const text = extractPlainText(el);
      if (text) {
        const id = toDashCase(text);
        const level = parseInt(el.tagName.slice(1), 10);
        headings.value.push({ id, text, level });

        newChildren.push({
          type: "element",
          tagName: "section-heading",
          properties: {
            headingId: id,
            title: text,
            level,
            pagePath: props.pagePath,
          },
          children: el.children ?? [],
        });
        continue;
      }
    }

    // Add Bootstrap .table class to <table> elements
    if (el.type === "element" && el.tagName === "table") {
      el.properties = el.properties || {};
      el.properties.className = el.properties.className
        ? [...(el.properties.className as string[]), "table"]
        : ["table"];
    }

    // Recurse into this element's children
    processHastNode(el);

    newChildren.push(child);
  }

  node.children = newChildren;
}

/** HAST children for the HastFragment recursive renderer. */
const hastChildren = computed<HastNode[]>(() => {
  headings.value = [];
  if (!props.content) return [];
  const html = marked.parse(props.content) as string;
  const root = fromHtml(html, { fragment: true }) as unknown as HastNode;
  processHastNode(root);
  return root.children ?? [];
});

// -------------------------------------------------------------------------
// Scrollspy
// -------------------------------------------------------------------------

/** Breathing room added to detection offsets (desktop 80 = 64 + 16). */
const BREATHING_ROOM_OFFSET = 16;

/** Desktop scrollspy detection offset (navbar 64 + breathing room). */
const SCROLLSPY_OFFSET = 64 + BREATHING_ROOM_OFFSET;

/** Mobile scrollspy detection offset — navbar (64) + sticky heading bar (48). */
const MOBILE_SCROLLSPY_OFFSET = 112;

/** Throttle flag for scroll handler. */
let scrollTicking = false;

/** Update activeId based on current scroll position. */
function onScroll(): void {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const offset = isDesktop.value
        ? SCROLLSPY_OFFSET
        : MOBILE_SCROLLSPY_OFFSET + BREATHING_ROOM_OFFSET;
      const scrollY = window.scrollY + offset;
      let current = "";
      for (const h of headings.value) {
        const el = document.getElementById(h.id);
        if (el && el.offsetTop <= scrollY) current = h.id;
      }
      activeId.value = current;
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}

/**
 * Mobile list expand/collapse height cap (mirrors the CSS
 * `max-height: 60vh` on .scrollspy-mobile-list) — avoids a post-animation
 * snap when an article has more headings than fit on screen.
 */
const MOBILE_LIST_MAX_HEIGHT_VH = 0.6;

/** Pending mobile heading scroll — executed after the list leaves. */
let pendingScrollId: string | null = null;

/** Scroll smoothly to a heading and update the URL hash. */
function onHeadingClick(id: string, isMobileClick: boolean = false): void {
  history.pushState(null, "", `#${id}`);
  if (isMobileClick) {
    // Collapse first and DEFER the scroll until the leave transition
    // finishes: the expanded list is in the flow (up to 60vh), pushing
    // the heading down — scrolling now (against the expanded layout)
    // would land too far UP once the list collapses (heading ends up
    // above the viewport).  After-leave, the layout is stable and the
    // heading sits exactly below the 112 px header (64 navbar + 48 bar).
    headingExpanded.value = false;
    pendingScrollId = id;
    return;
  }
  scrollToHashTarget(id, false, props.scrollOffset);
}

// -------------------------------------------------------------------------
// Mobile list expand/collapse (exact measured height)
// -------------------------------------------------------------------------

/**
 * Cap a list height at the resting 60vh CSS max-height.
 * @param list - The mobile heading list element.
 */
function cappedListHeight(list: HTMLElement): number {
  return Math.min(
    list.scrollHeight,
    Math.floor(window.innerHeight * MOBILE_LIST_MAX_HEIGHT_VH),
  );
}

/**
 * Expand animation — measure the list's real height (capped at 60vh) and
 * animate max-height from 0 to that exact pixel value.
 * @param el - The list element being inserted.
 */
function onMobileListEnter(el: Element): void {
  const list = el as HTMLElement;
  list.style.maxHeight = "none";
  const height = cappedListHeight(list);
  list.style.maxHeight = "0px";
  void list.offsetHeight; // force reflow so the 0px start applies
  list.style.maxHeight = `${height}px`;
}

/** Clear the inline max-height so the resting 60vh CSS cap applies. */
function onMobileListAfterEnter(el: Element): void {
  (el as HTMLElement).style.maxHeight = "";
}

/**
 * Collapse animation — start from the list's real height (capped), then
 * animate down to 0.
 * @param el - The list element being removed.
 */
function onMobileListLeave(el: Element): void {
  const list = el as HTMLElement;
  list.style.maxHeight = `${cappedListHeight(list)}px`;
  void list.offsetHeight; // force reflow so the current height applies
  list.style.maxHeight = "0px";
}

/** Clear the inline max-height and run any deferred heading scroll. */
function onMobileListAfterLeave(el: Element): void {
  (el as HTMLElement).style.maxHeight = "";
  if (pendingScrollId) {
    scrollToHashTarget(pendingScrollId, false, MOBILE_SCROLLSPY_OFFSET);
    pendingScrollId = null;
  }
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <div v-if="hastChildren.length > 0" class="container pb-2 markdown-article">
    <!-- Mobile: sticky collapsible heading nav -->
    <nav v-if="headings.length > 0 && !isDesktop" class="scrollspy-nav-mobile">
      <div
        class="scrollspy-current-bar"
        role="button"
        :aria-expanded="headingExpanded"
        @click="headingExpanded = !headingExpanded"
      >
        <span class="scrollspy-current-text">{{ currentHeadingText }}</span>
        <i
          :class="headingExpanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
        ></i>
      </div>
      <Transition
        name="scrollspy-mobile"
        @enter="onMobileListEnter"
        @after-enter="onMobileListAfterEnter"
        @leave="onMobileListLeave"
        @after-leave="onMobileListAfterLeave"
      >
        <ul v-if="headingExpanded" class="scrollspy-mobile-list px-3">
          <li v-for="item in headings" :key="item.id">
            <a
              :href="`#${item.id}`"
              class="link scrollspy-link"
              :class="{
                active: activeId === item.id,
                'ps-3': item.level >= 3,
                'ps-0': item.level < 3,
              }"
              @click.prevent="onHeadingClick(item.id, true)"
            >
              {{ item.text }}
            </a>
          </li>
        </ul>
      </Transition>
    </nav>

    <BRow>
      <!-- Desktop scrollspy nav -->
      <BCol
        v-if="headings.length > 0 && isDesktop"
        cols="12"
        xl="3"
        class="order-2"
      >
        <nav
          class="scrollspy-nav sticky-top"
          :style="{ top: 'calc(64px + 1rem)' }"
        >
          <ul class="nav flex-column">
            <li v-for="item in headings" :key="item.id" class="nav-item">
              <a
                :href="`#${item.id}`"
                class="link nav-link scrollspy-link py-1"
                :class="{
                  active: activeId === item.id,
                  'ps-3': item.level >= 3,
                  'ps-0': item.level < 3,
                }"
                @click.prevent="onHeadingClick(item.id)"
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </nav>
      </BCol>

      <!-- Article content -->
      <BCol cols="12" :xl="headings.length > 0 ? 9 : 12" class="order-1">
        <div class="article">
          <HastFragment :nodes="hastChildren" />
        </div>
      </BCol>
    </BRow>
  </div>
</template>

<style scoped>
/* ==== Article content ==== */

:deep(blockquote) {
  opacity: 0.8;
  padding-left: 1rem;
  border-left: 2px solid rgba(var(--bs-body-color-rgb), 0.5);
}

.markdown-article :deep(.article *) {
  line-height: 1.7;
}

/* ==== Desktop scrollspy nav ==== */

.scrollspy-nav .nav-link {
  color: var(--bs-body-color);
  border-radius: 0;
  transition: color 0.15s ease;
}

.scrollspy-nav .nav-link:hover {
  color: var(--bs-primary);
}

.scrollspy-nav .nav-link.active {
  color: var(--bs-primary);
  font-weight: calc(var(--bs-body-font-weight) + 100);
}

.markdown-article :deep(.section-heading-wrapper) {
  border-bottom: 1px solid rgba(var(--bs-body-color-rgb), 0.2);
}

/* ==== Mobile scrollspy: sticky collapsible bar ==== */

.scrollspy-nav-mobile {
  position: sticky;
  top: calc(64px + var(--safe-area-inset-top, 0px));
  z-index: 1020;
  background: var(--bs-body-bg);
  margin-left: calc(-1 * var(--bs-gutter-x, 0.75rem) * 0.5);
  margin-right: calc(-1 * var(--bs-gutter-x, 0.75rem) * 0.5);
  margin-bottom: 1rem;
}

.scrollspy-current-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  cursor: pointer;
  user-select: none;
}

.scrollspy-current-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.scrollspy-current-bar i {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.scrollspy-mobile-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  max-height: 60vh;
  overflow-y: auto;
  border-bottom: 1px solid var(--bs-border-color);
  box-shadow: var(--bs-box-shadow-sm);
}

.scrollspy-mobile-list li {
  margin: 0;
}

.scrollspy-mobile-list a {
  display: block;
  padding: 0.5rem 1rem;
  color: var(--bs-body-color);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s ease;
}

.scrollspy-mobile-list a:hover {
  color: var(--bs-primary);
}

.scrollspy-mobile-list a.active {
  color: var(--bs-primary);
  font-weight: calc(var(--bs-body-font-weight) + 100);
}

/* --- Expand/collapse animation (exact measured height via JS hooks) --- */

.scrollspy-mobile-enter-active,
.scrollspy-mobile-leave-active {
  overflow: hidden;
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
}

.scrollspy-mobile-enter-from,
.scrollspy-mobile-leave-to {
  opacity: 0;
}
</style>
