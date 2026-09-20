<!--
  MarkdownArticle.vue — Reusable markdown renderer with built-in scrollspy.

  Accepts a raw markdown string via the `content` prop and renders it through
  a full HAST post-processing pipeline (the shared `markdownToHast()` ->
  process -> HastFragment), then displays the result alongside a desktop sidebar
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useBreakpoint } from "../../composables/useBreakpoint";
import { markdownToHast } from "../../core/markdown";
import { extractPlainText, toDashCase } from "../../core/utils";
import { scrollToHashTarget } from "../../platform/accessibility";
import type { HastNode } from "../../types/hast";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
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
  const root = markdownToHast(props.content);
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

/** The CSS-grid collapse element (transitionend drives the deferred scroll). */
const collapseEl = ref<HTMLElement | null>(null);

/** Pending mobile heading scroll — executed once the list collapsed. */
let pendingScrollId: string | null = null;

/** Run the deferred heading scroll, if any. */
function flushPendingScroll(): void {
  if (!pendingScrollId) return;
  scrollToHashTarget(pendingScrollId, false, MOBILE_SCROLLSPY_OFFSET);
  pendingScrollId = null;
}

/** Scroll smoothly to a heading and update the URL hash. */
function onHeadingClick(id: string, isMobileClick: boolean = false): void {
  history.pushState(null, "", `#${id}`);
  if (isMobileClick) {
    // Collapse first and DEFER the scroll until the collapse transition
    // finishes: the expanded list is in the flow (up to 60vh), pushing
    // the heading down — scrolling now (against the expanded layout)
    // would land too far UP once the list collapses (heading ends up
    // above the viewport).  With transitions disabled (reduced motion /
    // .no-animations) the layout is already stable — scroll immediately.
    headingExpanded.value = false;
    pendingScrollId = id;
    const el = collapseEl.value;
    if (!el || parseFloat(getComputedStyle(el).transitionDuration) === 0) {
      flushPendingScroll();
    }
    return;
  }
  scrollToHashTarget(id, false, props.scrollOffset);
}

// -------------------------------------------------------------------------
// Mobile list expand/collapse (CSS grid-template-rows)
// -------------------------------------------------------------------------

/**
 * Collapse transition finished — the layout is stable, so run the
 * pending heading scroll.  Ignores bubbled child transitions (the link
 * colour transitions end as well).
 * @param e - The transitionend event from the collapse element.
 */
function onCollapseTransitionEnd(e: TransitionEvent): void {
  if (e.target !== e.currentTarget) return;
  if (e.propertyName !== "grid-template-rows") return;
  flushPendingScroll();
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
        <MaterialSymbol
          :name="headingExpanded ? 'expand_less' : 'expand_more'"
        />
      </div>
      <div
        ref="collapseEl"
        class="scrollspy-mobile-collapse"
        :class="{ expanded: headingExpanded }"
        @transitionend="onCollapseTransitionEnd"
      >
        <ul class="scrollspy-mobile-list px-3">
          <li v-for="item in headings" :key="item.id">
            <a
              :href="`#${item.id}`"
              class="link scrollspy-link"
              :class="{
                active: activeId === item.id,
                'ps-4': item.level >= 3,
                'ps-2': item.level < 3,
              }"
              @click.prevent="onHeadingClick(item.id, true)"
            >
              {{ item.text }}
            </a>
          </li>
        </ul>
      </div>
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
                  'ps-4': item.level >= 3,
                  'ps-2': item.level < 3,
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
  transition:
    color 0.15s ease,
    border-left 0.15s ease;
  border-left: 2px solid transparent;
  padding-left: 0.5rem;
}

.scrollspy-nav .nav-link:hover {
  color: var(--bs-primary);
}

.scrollspy-nav .nav-link.active {
  color: var(--bs-primary);
  border-left: 2px solid var(--bs-primary);
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
  border-left: 2px solid transparent;
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

.scrollspy-current-bar .material-symbols-outlined {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.scrollspy-mobile-list {
  list-style: none;
  margin: 0;
  /* Vertical padding lives on the links below — element padding cannot
     shrink below its used value, which would leave a ~17 px strip in
     the collapsed (0fr) state. */
  padding-block: 0;
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
  transition:
    color 0.15s ease,
    border-left 0.15s ease;
}

.scrollspy-mobile-list a:hover {
  color: var(--bs-primary);
}

.scrollspy-mobile-list a.active {
  color: var(--bs-primary);
  border-left: 2px solid var(--bs-primary);
}

/* --- Expand/collapse animation (CSS grid rows, no measured height) --- */

.scrollspy-mobile-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--shlh-duration-base) ease;
}

.scrollspy-mobile-collapse.expanded {
  grid-template-rows: 1fr;
}

/* The grid item must clip + shrink below its content; the collapsed
   state also stays out of the tab order (visibility flips AFTER the
   collapse finishes, so the shrinking list stays visible). */
.scrollspy-mobile-collapse .scrollspy-mobile-list {
  min-height: 0;
  visibility: hidden;
  transition: visibility 0s linear var(--shlh-duration-base);
}

.scrollspy-mobile-collapse.expanded .scrollspy-mobile-list {
  visibility: visible;
  transition: visibility 0s;
}
</style>
