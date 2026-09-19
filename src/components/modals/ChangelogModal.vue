<!--
  ChangelogModal.vue — site changelog popup (footer entry).

  Lists the latest 10 repository commits from the GitHub REST API as a
  timeline: a rail with hollow/solid dots, the commit title, a relative
  time (absolute in a tooltip), an expand/collapse toggle with the
  markdown body, and the short hash linking to the commit page.

  The fetch is LAZY: the modal is always mounted (App.vue), so setup
  must NOT call the composable — the first open creates it and the
  shared stale-while-revalidate cache serves reopens.
-->
<script setup lang="ts">
import { computed, defineAsyncComponent, ref, shallowRef, watch } from "vue";
import { useGithubCommits } from "../../composables/useGithubCommits";
import { useI18n } from "../../composables/useI18n";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { GITHUB_REPO } from "../../configs/site-meta";
import { splitCommitMessage } from "../../core/commit-message";
import { formatAbsoluteTime, formatRelativeTime } from "../../core/time";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import InlineSvg from "../ui/InlineSvg.vue";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";

// =========================================================================
// Constants
// =========================================================================

/**
 * Commit bodies render through the async `MarkdownBody` component so
 * the markdown parser stack (marked / hast-util-from-html) stays out
 * of the entry chunk — it loads on the first expanded body.
 */
const MarkdownBody = defineAsyncComponent(
  () => import("../render-functions/MarkdownBody.vue"),
);

// =========================================================================
// Types
// =========================================================================

/** One rendered timeline row, derived from a `GitHubCommit`. */
interface CommitRow {
  /** Full SHA — the row key + expansion identity. */
  sha: string;
  /** 7-char short hash shown in the expanded meta line. */
  shortSha: string;
  /** Commit title (first message line). */
  title: string;
  /** Raw markdown body (empty string when the commit has no body). */
  body: string;
  /** Relative time — the surface text while collapsed. */
  relative: string;
  /** Absolute localized time — tooltip + expanded meta line. */
  absolute: string;
  /** GitHub commit page URL. */
  htmlUrl: string;
  /** Whether this row is expanded. */
  expanded: boolean;
}

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("changelog");
const { pop } = useModalStack();
const { t, locale } = useI18n();

/** Close-button element for keyboard auto-focus. */
const closeBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Close when opened via Tab. */
const { onShown } = useModalFocus(closeBtnRef);

// ---- Lazy data (created on the first open) ------------------------------

/**
 * Commit state — created on the FIRST open.  `useGithubApi` fetches at
 * first call and this modal is always mounted, so calling it in setup
 * would request on every page load; the watch defers it.
 */
const commitState = shallowRef<ReturnType<typeof useGithubCommits> | null>(
  null,
);

watch(visible, (open) => {
  if (open && !commitState.value) commitState.value = useGithubCommits();
});

const commits = computed(() => commitState.value?.commits.value ?? null);
const isLoading = computed(() => commitState.value?.isLoading.value ?? false);
const fetchError = computed(() => commitState.value?.error.value ?? null);
const isEmpty = computed(
  () => commits.value !== null && commits.value.length === 0,
);

// ---- Expansion state ----------------------------------------------------

/** Expanded commit SHAs — the latest commit starts expanded. */
const expandedShas = ref<Set<string>>(new Set());

watch(
  commits,
  (list) => {
    if (list && list.length > 0 && expandedShas.value.size === 0) {
      expandedShas.value = new Set([list[0].sha]);
    }
  },
  { immediate: true },
);

/**
 * Toggle one commit's expansion.
 *
 * @param sha - Commit SHA to toggle.
 */
function toggleRow(sha: string): void {
  const next = new Set(expandedShas.value);
  if (next.has(sha)) {
    next.delete(sha);
  } else {
    next.add(sha);
  }
  expandedShas.value = next;
}

// ---- Row model ----------------------------------------------------------

const rows = computed<CommitRow[]>(() =>
  (commits.value ?? []).map((commit) => {
    const { title, body } = splitCommitMessage(commit.commit.message);
    return {
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      title,
      body,
      relative: formatRelativeTime(commit.commit.author.date, locale.value),
      absolute: formatAbsoluteTime(commit.commit.author.date, locale.value),
      htmlUrl: commit.html_url,
      expanded: expandedShas.value.has(commit.sha),
    };
  }),
);

/** GitHub commit-history URL for the footer link. */
const historyUrl = `https://github.com/${GITHUB_REPO}/commits`;
</script>

<template>
  <BModal
    v-model="visible"
    :title="t('text-site-changelog')"
    header-class="h5 modal-title"
    title-tag="span"
    size="lg"
    no-header-close
    centered
    scrollable
    @shown="onShown"
  >
    <!-- ==== Loading / error / empty ==== -->
    <LoadingPlaceholder
      v-if="isLoading && !commits"
      :label="t('text-site-changelog')"
      state="loading"
    />
    <LoadingPlaceholder
      v-else-if="fetchError && !commits"
      :label="t('text-site-changelog')"
      state="error"
      :error-message="fetchError"
    />
    <LoadingPlaceholder
      v-else-if="isEmpty"
      :label="t('text-site-changelog')"
      state="empty"
      :empty-message="t('text-no-data-available')"
    />

    <!-- ==== Commit timeline ==== -->
    <ul v-else class="changelog-list list-unstyled mb-0">
      <li
        v-for="row in rows"
        :key="row.sha"
        class="changelog-item"
        :class="{ 'changelog-item-expanded': row.expanded }"
      >
        <!-- Rail: continuous line + this commit's dot -->
        <span class="changelog-rail" aria-hidden="true">
          <span class="changelog-dot"></span>
        </span>

        <!-- Title row + collapsible detail -->
        <div class="changelog-content">
          <div class="changelog-head">
            <span class="changelog-title" :title="row.title">
              {{ row.title }}
            </span>
            <!--
              The trigger stays MOUNTED (`v-show`, not `v-if`): the
              tooltip directive leaves its container `<span>` behind
              when the target unmounts, so a v-if toggle leaked one
              empty span per expand/collapse cycle (v3.19.0
              extreme-click test).
            -->
            <TooltipTrigger
              v-show="!row.expanded"
              :title="row.absolute"
              teleport
            >
              <span
                class="changelog-time small text-body-secondary flex-shrink-0"
              >
                {{ row.relative }}
              </span>
            </TooltipTrigger>
          </div>

          <div class="changelog-collapse">
            <div class="changelog-collapse-inner">
              <div class="changelog-meta small d-flex align-items-center gap-2">
                <TypeAwareLink
                  type="external"
                  :href="row.htmlUrl"
                  class="changelog-sha font-monospace link-secondary"
                >
                  {{ row.shortSha }}
                </TypeAwareLink>
                <span class="ms-auto text-body-secondary flex-shrink-0">
                  {{ row.absolute }}
                </span>
              </div>
              <div v-if="row.body" class="changelog-body">
                <MarkdownBody :markdown="row.body" />
              </div>
            </div>
          </div>
        </div>

        <!-- Expand / collapse toggle (mirrors the rail column) -->
        <div class="changelog-toggle">
          <button
            type="button"
            class="btn btn-same-padding btn-sm btn-outline-secondary btn-no-border"
            :aria-label="
              row.expanded
                ? t('text-collapse-details')
                : t('text-expand-details')
            "
            @click="toggleRow(row.sha)"
          >
            <MaterialSymbol
              :name="row.expanded ? 'expand_less' : 'expand_more'"
            />
          </button>
        </div>
      </li>
    </ul>

    <!-- ==== Footer: GitHub history (left) + Close (right) ==== -->
    <template #footer>
      <TooltipTrigger :title="t('text-view-full-history-on-github')">
        <TypeAwareLink
          type="external"
          :href="historyUrl"
          class="btn btn-same-padding btn-outline-primary btn-no-border"
          :aria-label="t('text-view-full-history-on-github')"
          hide-indicator
        >
          <InlineSvg
            src="/images/svg/icons/github.svg"
            class="changelog-github-mark"
          />
        </TypeAwareLink>
      </TooltipTrigger>
      <div class="ms-auto">
        <button
          ref="closeBtnRef"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="pop()"
        >
          {{ $t("text-close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* ==== Timeline ==== */

/*
  Row grid — [rail][content][toggle]; the rail column and the toggle
  column share ONE width token so the row reads symmetric.
*/
.changelog-list {
  --changelog-side-w: 2rem;
  --changelog-title-line: 1.75rem;
}

.changelog-item {
  display: grid;
  grid-template-columns:
    var(--changelog-side-w) minmax(0, 1fr)
    var(--changelog-side-w);
}

/* --- Rail: continuous line + dot --- */

.changelog-rail {
  position: relative;
}

/* The dot's own background masks the line, so one full-height line
   per row reads as a single continuous rail. */
.changelog-rail::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-50%);
  background: rgba(
    var(--bs-secondary-rgb),
    var(--shlh-changelog-timeline-opacity)
  );
}

/* No dangling stub above the first dot… */
.changelog-item:first-child .changelog-rail::before {
  top: calc(var(--changelog-title-line) / 2);
}

/* …and the final dot ends the rail with a gradient-fading tail
   (expanded or not) — the timeline visibly "runs out". */
.changelog-item:last-child .changelog-rail::before {
  bottom: auto;
  height: calc(var(--changelog-title-line) / 2 + 0.75rem);
  background: linear-gradient(
    to bottom,
    rgba(var(--bs-secondary-rgb), var(--shlh-changelog-timeline-opacity)) 55%,
    transparent 100%
  );
}

.changelog-dot {
  position: absolute;
  left: 50%;
  top: calc(var(--changelog-title-line) / 2);
  width: 0.5rem;
  height: 0.5rem;
  transform: translate(-50%, -50%);
  border: 2px solid
    rgba(var(--bs-secondary-rgb), var(--shlh-changelog-timeline-opacity));
  border-radius: 50%;
  background: var(--bs-body-bg);
}

.changelog-item-expanded .changelog-dot {
  border-color: var(--bs-primary);
  background: var(--bs-primary);
}

/* --- Content: title row + collapsible detail --- */

.changelog-content {
  min-width: 0;
}

.changelog-head {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  min-height: var(--changelog-title-line);
}

/* The title absorbs the free space, pushing the relative time (and
   the zero-width tooltip host after it) to the right edge.  The
   minimum title/time gap is the padding — a flex `gap` would also
   apply around the host span and offset the time by 0.5rem. */
.changelog-title {
  flex: 1;
  min-width: 0;
  padding-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.changelog-item-expanded .changelog-title {
  white-space: normal;
}

/* CSS-only expand/collapse: 0fr <-> 1fr animates the auto height;
   browsers without the transition degrade to an instant toggle.
   `.no-animations` / reduced-motion kill it globally
   (accessibility.css). */
.changelog-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--shlh-duration-base) ease;
}

.changelog-item-expanded .changelog-collapse {
  grid-template-rows: 1fr;
}

.changelog-collapse-inner {
  overflow: hidden;
  min-height: 0;
}

.changelog-meta {
  padding-top: 0.125rem;
}

.changelog-body {
  color: var(--bs-secondary-color);
  font-size: 0.875rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.changelog-body :deep(ul) {
  padding-left: 1.25rem;
}

.changelog-body :deep(> :last-child) {
  margin-bottom: 0;
}

/* --- Toggle (square icon button, mirrors the rail column) --- */

.changelog-toggle {
  display: flex;
  justify-content: center;
}

.changelog-toggle .btn {
  aspect-ratio: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: start;
}

/* ==== Footer GitHub link ==== */

.changelog-github-mark :deep(svg) {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  margin: 0 0.1rem;
}
</style>
