<!--
  MarkdownArticle.vue — Reusable markdown renderer with built-in scrollspy.

  Accepts a raw markdown string via the `content` prop and renders it through
  a full HAST post-processing pipeline (marked -> fromHtml -> process -> toHtml),
  then displays the result alongside a desktop sidebar scrollspy and a mobile
  sticky collapsible heading nav.

  Props:
    content      - Raw markdown string (required)
    scrollOffset - Scroll offset for heading clicks, desktop (default 64)
-->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { marked } from "marked";
import { fromHtml } from "hast-util-from-html";
import { BRow, BCol } from "bootstrap-vue-next";
import { extractPlainText, toDashCase } from "../../core/utils";
import { scrollToHashTarget } from "../../platform/accessibility";
import { useBreakpoint } from "../../composables/useBreakpoint";
import HastFragment from "../render-functions/HastFragment.vue";
import type { HastNode } from "../../types/hast";
import TypeAwareLink from "../links/TypeAwareLink.vue";

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

/** Template ref for the mobile heading list (for height-based scroll offset). */
const mobileListRef = ref<HTMLElement | null>(null);

/** Text of the currently active heading (for the mobile collapsed bar). */
const currentHeadingText = computed(() => {
  const h = headings.value.find((h) => h.id === activeId.value);
  return h?.text ?? headings.value[0]?.text ?? "";
});

/**
 * When using the mobile view, the mobile Scrollspy will be enabled instead of
 * the desktop version. Derived from the shared breakpoint singleton.
 */
const breakpoint = useBreakpoint();

// =========================================================================
// Actions
// =========================================================================

// -------------------------------------------------------------------------
// HAST post-processing
// -------------------------------------------------------------------------

/** Heading level -> Bootstrap heading class mapping: h2->.h4, h3->.h5, etc. */
function headingClass(tagName: string): string {
  const match = /^h(\d)$/.exec(tagName);
  if (!match) return "";
  const level = parseInt(match[1], 10);
  return `h${Math.min(level + 2, 6)}`;
}

/**
 * Walk the HAST tree recursively and apply transformations:
 * - Remove h1 elements (title provided by page hero section)
 * - Add dash-case id + Bootstrap heading class to h2–h6
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

    // Add id + heading class to h2–h6; collect for scrollspy
    if (el.type === "element" && el.tagName && /^h[2-6]$/.test(el.tagName)) {
      const text = extractPlainText(el as unknown as HastNode);
      if (text) {
        const id = toDashCase(text);
        const level = parseInt(el.tagName.slice(1), 10);
        headings.value.push({ id, text, level });

        el.properties = el.properties || {};
        el.properties.id = id;
        const cls = headingClass(el.tagName);
        if (cls) {
          el.properties.className = el.properties.className
            ? [...(el.properties.className as string[]), cls]
            : [cls];
        }
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

/** Navbar offset for active-heading detection. */
const SCROLLSPY_OFFSET = 80;

/** Throttle flag for scroll handler. */
let scrollTicking = false;

/** Update activeId based on current scroll position. */
function onScroll(): void {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const scrollY = window.scrollY + SCROLLSPY_OFFSET;
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

/** Navbar + mobile bar height for scroll-offset calculation. */
const NAVBAR_HEIGHT = 64;
const MOBILE_BAR_HEIGHT = 48;

/** Scroll smoothly to a heading and update the URL hash. */
function onHeadingClick(id: string, isMobileClick: boolean = false): void {
  const baseOffset = isMobileClick
    ? NAVBAR_HEIGHT +
      MOBILE_BAR_HEIGHT +
      (mobileListRef.value?.offsetHeight ?? 0)
    : props.scrollOffset;
  history.pushState(null, "", `#${id}`);
  scrollToHashTarget(id, false, baseOffset);
  if (isMobileClick) headingExpanded.value = false;
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
    <nav
      v-if="headings.length > 0 && breakpoint === 'mobile'"
      class="scrollspy-nav-mobile"
    >
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
      <ul
        v-if="headingExpanded"
        ref="mobileListRef"
        class="scrollspy-mobile-list px-3"
      >
        <li v-for="item in headings" :key="item.id">
          <TypeAwareLink
            type="anchor"
            :href="`#${item.id}`"
            hide-indicator
            class="scrollspy-link"
            :class="{
              active: activeId === item.id,
              'ps-3': item.level >= 3,
              'ps-0': item.level < 3,
            }"
            @click.prevent="onHeadingClick(item.id, true)"
          >
            {{ item.text }}
          </TypeAwareLink>
        </li>
      </ul>
    </nav>

    <BRow>
      <!-- Desktop scrollspy nav -->
      <BCol
        v-if="headings.length > 0 && breakpoint !== 'mobile'"
        cols="12"
        lg="3"
        class="order-2"
      >
        <nav
          class="scrollspy-nav sticky-top"
          :style="{ top: 'calc(64px + 1rem)' }"
        >
          <ul class="nav flex-column">
            <li v-for="item in headings" :key="item.id" class="nav-item">
              <TypeAwareLink
                type="anchor"
                :href="`#${item.id}`"
                hide-indicator
                class="nav-link scrollspy-link py-1"
                :class="{
                  active: activeId === item.id,
                  'ps-3': item.level >= 3,
                  'ps-0': item.level < 3,
                }"
                @click.prevent="onHeadingClick(item.id)"
              >
                {{ item.text }}
              </TypeAwareLink>
            </li>
          </ul>
        </nav>
      </BCol>

      <!-- Article content -->
      <BCol cols="12" :lg="headings.length > 0 ? 9 : 12" class="order-1">
        <div class="article">
          <HastFragment :nodes="hastChildren" />
        </div>
      </BCol>
    </BRow>
  </div>
</template>

<style scoped>
/* ==== Article content ==== */

.markdown-article :deep(.article *) {
  line-height: 1.7;
}

.markdown-article :deep(.article h1),
.markdown-article :deep(.article h2),
.markdown-article :deep(.article h3),
.markdown-article :deep(.article h4),
.markdown-article :deep(.article h5),
.markdown-article :deep(.article h6),
.markdown-article :deep(.article .h1),
.markdown-article :deep(.article .h2),
.markdown-article :deep(.article .h3),
.markdown-article :deep(.article .h4),
.markdown-article :deep(.article .h5),
.markdown-article :deep(.article .h6) {
  margin-top: 0.5rem;
  border-bottom: 1px solid rgba(var(--bs-body-color-rgb), 0.25);
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
</style>
