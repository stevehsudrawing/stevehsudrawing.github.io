<!--
  ChangelogModal.vue — site changelog popup (footer entry).

  Lists the latest 20 repository commits from the GitHub REST API as a
  timeline: a rail with dots, then one wrapping line per commit — the
  title, a relative time (absolute in a tooltip) and the short hash
  linking to the commit page — with the plain-text body always shown
  below it.

  The fetch is LAZY: the modal is always mounted (App.vue), so setup
  must NOT call the composable — the first open creates it and the
  shared stale-while-revalidate cache serves reopens.
-->
<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { useI18n } from "../../composables/core/useI18n";
import { useGithubCommits } from "../../composables/github/useGithubCommits";
import { useModalFocus } from "../../composables/modals/useModalFocus";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { useRefreshWarningModal } from "../../composables/modals/useRefreshWarningModal";
import { GITHUB_REPO } from "../../configs/site-meta";
import { splitCommitMessage } from "../../core/commit-message";
import { formatAbsoluteTime, formatRelativeTime } from "../../core/time";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import InlineSvg from "../ui/InlineSvg.vue";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";
import TruncatedTitle from "../ui/TruncatedTitle.vue";

// =========================================================================
// Types
// =========================================================================

/** One rendered timeline row, derived from a `GithubCommit`. */
interface CommitRow {
  /** Full SHA — the row key. */
  sha: string;
  /** 7-char short hash, at the end of the title line. */
  shortSha: string;
  /** Commit title (first message line). */
  title: string;
  /** Plain-text body paragraphs — empty when the commit has no body. */
  paragraphs: string[];
  /** Relative time — the visible text. */
  relative: string;
  /** Absolute localized time — the tooltip text. */
  absolute: string;
  /** GitHub commit page URL. */
  htmlUrl: string;
}

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("changelog");
const { pop } = useModalStack();
const { t, locale } = useI18n();
const { openRefreshWarningModal } = useRefreshWarningModal();

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

// ---- Row model ----------------------------------------------------------

/**
 * Split a commit body into plain-text paragraphs.
 *
 * The body is hard-wrapped at 80 columns, so its line breaks are
 * typographic rather than semantic: a blank line separates paragraphs,
 * and a single line break joins a paragraph's lines with one space.
 *
 * @param body - Raw commit body (empty when the commit has none).
 * @returns One trimmed string per paragraph.
 */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0);
}

const rows = computed<CommitRow[]>(() =>
  (commits.value ?? []).map((commit) => {
    const { title, body } = splitCommitMessage(commit.commit.message);
    return {
      sha: commit.sha,
      shortSha: commit.sha.slice(0, 7),
      title,
      paragraphs: toParagraphs(body),
      relative: formatRelativeTime(commit.commit.author.date, locale.value),
      absolute: formatAbsoluteTime(commit.commit.author.date, locale.value),
      htmlUrl: commit.html_url,
    };
  }),
);

/** GitHub commit-history URL for the footer link. */
const historyUrl = `https://github.com/${GITHUB_REPO}/commits`;

/** Open the refresh confirmation with this endpoint's cache state. */
function openRefresh(): void {
  const state = commitState.value;
  if (!state) return;
  openRefreshWarningModal({
    api: state.api,
    url: state.url,
    fetchedAt: state.fetchedAt,
    refresh: state.refresh,
    error: state.error,
  });
}
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
    <template #title>
      <TruncatedTitle :text="t('text-site-changelog')" />
    </template>
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
      <li v-for="row in rows" :key="row.sha" class="changelog-item">
        <!-- Rail: continuous line + this commit's dot -->
        <span class="changelog-rail" aria-hidden="true">
          <span class="changelog-dot"></span>
        </span>

        <div class="changelog-content">
          <!-- Title line: the title, then the fixed-width date/hash group -->
          <div class="changelog-head">
            <span class="changelog-title">{{ row.title }}</span>
            <span class="changelog-meta">
              <TooltipTrigger :title="row.absolute" teleport>
                <span class="changelog-time text-body-secondary">
                  {{ row.relative }}
                </span>
              </TooltipTrigger>
              <TypeAwareLink
                type="external"
                :href="row.htmlUrl"
                class="changelog-sha font-monospace link-secondary"
              >
                {{ row.shortSha }}
              </TypeAwareLink>
            </span>
          </div>

          <div v-if="row.paragraphs.length > 0" class="changelog-body">
            <p v-for="(paragraph, index) in row.paragraphs" :key="index">
              {{ paragraph }}
            </p>
          </div>
        </div>
      </li>
    </ul>

    <!-- ==== Footer: GitHub history (left) + Close (right) ==== -->
    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="t('text-view-full-history-on-github')">
          <TypeAwareLink
            type="external"
            :href="historyUrl"
            class="btn btn-same-padding btn-outline-primary btn-no-border"
            :aria-label="t('text-view-full-history-on-github')"
            hide-indicator
            no-underline
          >
            <InlineSvg
              src="/images/svg/icons/github.svg"
              class="changelog-github-mark"
            />
          </TypeAwareLink>
        </TooltipTrigger>
        <TooltipTrigger :title="t('text-refresh')">
          <button
            type="button"
            class="btn btn-same-padding btn-outline-primary btn-no-border"
            :aria-label="t('text-refresh')"
            :disabled="isLoading"
            @click="openRefresh"
          >
            <MaterialSymbol name="refresh" />
          </button>
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
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* ==== Timeline ==== */

/*
  Row grid — [rail][content]; the rail column keeps the timeline
  aligned, and the content column holds the title line and the body.
*/
.changelog-list {
  --changelog-side-w: 2rem;
  --changelog-title-line: 1.75rem;
}

.changelog-item {
  display: grid;
  grid-template-columns: var(--changelog-side-w) minmax(0, 1fr);
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
  width: 2px;
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

/* …and the final dot ends the rail with a gradient-fading tail, so the
   timeline visibly "runs out". */
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

/* --- Content: title line + body --- */

.changelog-content {
  min-width: 0;
}

/* The title takes the free space; when it wraps, the date/hash group
   moves to its own line and keeps hugging the right edge. */
.changelog-head {
  font-size: 0.875rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.5rem;
  row-gap: 0.125rem;
  min-height: var(--changelog-title-line);
}

.changelog-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: break-word;
}

/* The date and the hash share one line; the hash is last, so its
   right edge lines up under every title. */
.changelog-meta {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  white-space: nowrap;
}

/* Narrow layout: the title rarely leaves room for the group on the same
   line, so it takes a line of its own — the relative time then starts at
   the title's left edge, while the hash keeps the right edge. */
@media (max-width: 767.98px) {
  .changelog-meta {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
}

.changelog-body {
  color: var(--bs-secondary-color);
  font-size: 0.875rem;
  padding-top: 0.25rem;
  padding-bottom: 0.5rem;
}

.changelog-body p {
  margin-bottom: 0.25rem;
}

.changelog-body p:last-child {
  margin-bottom: 0;
}

/* ==== Footer GitHub link ==== */

.changelog-github-mark :deep(svg) {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  margin: 0 0.1rem;
}
</style>
