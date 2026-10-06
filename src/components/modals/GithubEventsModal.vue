<!--
  GithubEventsModal.vue — Event list popup for chart clicks.
  Props + visibility come from the shared modal stack (useStackModal).
  The list derives from the LIVE events feed via the stack filter
  (`{ title, filter }` — mirroring the changelog modal's lazy pattern),
  so a refresh updates it in place.  Each row: event-type icon + i18n
  description (with %L link marker) + relative time.  The link pushes
  external-link on top of the stack, auto-hiding this modal; Cancel
  pops back.
-->
<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { useI18n } from "../../composables/core/useI18n";
import {
  eventTypeI18nKey,
  eventTypeIcon,
  filterEventsByDay,
  filterEventsByOther,
  filterEventsByType,
  useGithubActivity,
} from "../../composables/github/useGithubActivity";
import { useModalFocus } from "../../composables/modals/useModalFocus";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { useRefreshWarningModal } from "../../composables/modals/useRefreshWarningModal";
import { formatAbsoluteTime, formatRelativeTime } from "../../core/time";
import type { GithubEvent } from "../../types/app";
import type { IconName } from "../../types/icons";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import TruncatedTitle from "../ui/TruncatedTitle.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("github-events");
const { pop } = useModalStack();
const { t, locale } = useI18n();
const { openRefreshWarningModal } = useRefreshWarningModal();

/** Close-button element for keyboard auto-focus. */
const closeBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Close when opened via Tab. */
const { onShown } = useModalFocus(closeBtnRef);

// ---- Lazy data (created on the first open; mirrors the changelog) --------

/**
 * Activity state — created on the FIRST open.  `useGithubActivity`
 * fetches at first call and this modal is always mounted, so calling it
 * in setup would request on every page load; the watch defers it.
 */
const activityState = shallowRef<ReturnType<typeof useGithubActivity> | null>(
  null,
);

watch(visible, (open) => {
  if (open && !activityState.value) activityState.value = useGithubActivity();
});

// ---- Derived (narrowed from the stack entry) ----

const title = computed(() => stackProps.value?.title ?? "");

/** Filtered events — derived from the live feed via the stack filter. */
const events = computed(() => {
  const filter = stackProps.value?.filter;
  if (!filter) return [];
  const feed = activityState.value?.events.value ?? [];
  if (filter.kind === "type") return filterEventsByType(feed, filter.eventType);
  if (filter.kind === "other") return filterEventsByOther(feed);
  return filterEventsByDay(feed, filter.day);
});

/** True while the underlying feed is re-fetching (refresh disabled). */
const isLoading = computed(() => activityState.value?.isLoading.value ?? false);

// ---- Actions ----

/** Open the refresh confirmation with this endpoint's cache state. */
function openRefresh(): void {
  const state = activityState.value;
  if (!state) return;
  openRefreshWarningModal({
    api: state.api,
    url: state.url,
    fetchedAt: state.fetchedAt,
    refresh: state.refresh,
    error: state.error,
  });
}

// =========================================================================
// Helpers
// =========================================================================

/**
 * Translate an event-description template and split it at the `%L`
 * link marker into prefix / suffix around the link.
 *
 * @param key - i18n key (template contains `%L` where the link goes).
 * @param params - Positional params for `%1`, `%2`, ...
 * @returns Text before and after the link marker.
 */
function splitTemplate(
  key: string,
  params?: string[],
): { prefix: string; suffix: string } {
  const s = t(key, params);
  const i = s.indexOf("%L");
  if (i === -1) return { prefix: s, suffix: "" };
  return { prefix: s.slice(0, i), suffix: s.slice(i + 2) };
}

/**
 * Build the i18n description for one event (prefix / suffix around %L).
 *
 * @param ev - The raw GitHub event.
 * @returns Text before and after the link marker.
 */
function describe(ev: GithubEvent): { prefix: string; suffix: string } {
  switch (ev.type) {
    case "PushEvent": {
      const size =
        typeof ev.payload.size === "number" ? String(ev.payload.size) : null;
      return size !== null
        ? splitTemplate("text-event-desc-push", [size])
        : splitTemplate("text-event-desc-push-plain");
    }
    case "WatchEvent":
      return splitTemplate("text-event-desc-watch");
    case "ForkEvent":
      return splitTemplate("text-event-desc-fork");
    case "IssuesEvent":
      if (ev.payload.action === "closed") {
        return splitTemplate("text-event-desc-issue-closed");
      }
      if (ev.payload.action === "reopened") {
        return splitTemplate("text-event-desc-issue-reopened");
      }
      return splitTemplate("text-event-desc-issue-opened");
    case "IssueCommentEvent":
      return splitTemplate("text-event-desc-issue-comment");
    case "CreateEvent":
      return splitTemplate("text-event-desc-create", [
        String(ev.payload.ref_type ?? "branch"),
      ]);
    case "DeleteEvent":
      return splitTemplate("text-event-desc-delete", [
        String(ev.payload.ref_type ?? "branch"),
      ]);
    case "PullRequestEvent":
      return splitTemplate("text-event-desc-pr", [
        String(ev.payload.action ?? "opened"),
      ]);
    case "ReleaseEvent":
      return splitTemplate("text-event-desc-release");
    case "GollumEvent":
      return splitTemplate("text-event-desc-gollum");
    case "PublicEvent":
      return splitTemplate("text-event-desc-public");
    case "MemberEvent":
      return splitTemplate("text-event-desc-member");
    case "CommitCommentEvent":
      return splitTemplate("text-event-desc-commit-comment");
    case "DiscussionEvent":
      return splitTemplate("text-event-desc-discussion");
    case "PullRequestReviewEvent":
      return splitTemplate("text-event-desc-pull-request-review");
    case "PullRequestReviewCommentEvent":
      return splitTemplate("text-event-desc-pull-request-review-comment");
    default:
      // Unknown event types: show the localized type label, link the repo
      return {
        prefix: t(eventTypeI18nKey(ev.type)),
        suffix: "",
      };
  }
}

/**
 * Link target for an event: the referenced issue (issue events) or
 * the repository (everything else).
 *
 * @param ev - The raw GitHub event.
 * @returns Link href and visible link text.
 */
function linkTarget(ev: GithubEvent): { href: string; text: string } {
  const issue = ev.payload.issue;
  if ((ev.type === "IssuesEvent" || ev.type === "IssueCommentEvent") && issue) {
    return {
      href:
        typeof issue.html_url === "string"
          ? issue.html_url
          : `https://github.com/${ev.repo.name}/issues/${issue.number ?? ""}`,
      text:
        typeof issue.title === "string" && issue.title.length > 0
          ? issue.title
          : `#${issue.number ?? ""}`,
    };
  }
  return {
    href: `https://github.com/${ev.repo.name}`,
    text: ev.repo.name,
  };
}

// ---- Row model (computed for the template) ----

interface EventRow {
  key: string;
  icon: IconName;
  prefix: string;
  suffix: string;
  linkHref: string;
  linkText: string;
  /** Relative time (surface text). */
  timeText: string;
  /** Absolute localized time (tooltip). */
  absoluteTime: string;
}

const rows = computed<EventRow[]>(() =>
  events.value.map((ev) => {
    const { prefix, suffix } = describe(ev);
    const { href, text } = linkTarget(ev);
    return {
      key: ev.id ?? ev.created_at,
      icon: eventTypeIcon(ev.type),
      prefix,
      suffix,
      linkHref: href,
      linkText: text,
      timeText: formatRelativeTime(ev.created_at, locale.value),
      absoluteTime: formatAbsoluteTime(ev.created_at, locale.value),
    };
  }),
);
</script>

<template>
  <BModal
    v-model="visible"
    :title="title"
    header-class="h5 modal-title"
    title-tag="span"
    size="lg"
    no-header-close
    centered
    hide-footer
    scrollable
    @shown="onShown"
  >
    <template #title>
      <TruncatedTitle :text="title" />
    </template>
    <ul class="list-unstyled mb-0 github-events-list">
      <li
        v-for="row in rows"
        :key="row.key"
        class="d-flex align-items-center gap-2 py-1"
      >
        <MaterialSymbol
          :name="row.icon"
          class="text-body-secondary flex-shrink-0"
        />
        <div class="event-row-text flex-grow-1 small d-flex gap-1">
          <span class="flex-shrink-0">{{ row.prefix }}</span>
          <TooltipTrigger :title="row.linkText">
            <TypeAwareLink
              type="external"
              :href="row.linkHref"
              no-q-r-code
              class="event-row-link fw-semibold"
            >
              {{ row.linkText }}
            </TypeAwareLink>
          </TooltipTrigger>
          <span v-if="row.suffix" class="flex-shrink-0">{{ row.suffix }}</span>
        </div>
        <TooltipTrigger :title="row.absoluteTime" teleport>
          <span
            class="text-body-secondary small text-nowrap flex-shrink-0 time-text"
          >
            {{ row.timeText }}
          </span>
        </TooltipTrigger>
      </li>
    </ul>

    <template #footer>
      <span class="text-body-secondary small">
        {{ $t("text-x-activities", [String(events.length)]) }}
      </span>
      <TooltipTrigger :title="$t('text-refresh')">
        <button
          type="button"
          class="btn btn-same-padding btn-outline-primary btn-no-border"
          :aria-label="$t('text-refresh')"
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
          class="btn btn-outline-primary btn-no-border ms-auto"
          @click="pop()"
        >
          {{ $t("text-close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* --- Row text truncation: prefix/suffix stay fixed, the link shrinks --- */

.event-row-text {
  min-width: 0;
}

/* TypeAwareLink root: flex item + blockified, so text-overflow applies. */
.event-row-link {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Time text: enable "tnum" for better number display */
.time-text {
  font-feature-settings: "tnum";
}
</style>
