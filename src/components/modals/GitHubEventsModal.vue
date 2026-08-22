<!--
  GitHubEventsModal.vue — Event list popup for chart clicks.
  Props + visibility come from the shared modal stack (useStackModal).
  Each row: event-type icon + i18n description (with %L link marker) +
  relative time.  The link pushes external-link on top of the stack,
  auto-hiding this modal; Cancel pops back.
-->
<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";
import { computed, ref } from "vue";
import {
  eventTypeI18nKey,
  eventTypeIcon,
} from "../../composables/useGithubActivity";
import { useI18n } from "../../composables/useI18n";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { DATE_LOCALES } from "../../configs/language-list";
import type { GitHubEvent } from "../../types/app";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("github-events");
const { pop } = useModalStack();
const { t, locale } = useI18n();

/** Close-button element for keyboard auto-focus. */
const closeBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Close when opened via Tab. */
const { onShown } = useModalFocus(closeBtnRef);

// ---- Derived (narrowed from the stack entry) ----

const title = computed(() => stackProps.value?.title ?? "");
const events = computed(() => stackProps.value?.events ?? []);

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
function describe(ev: GitHubEvent): { prefix: string; suffix: string } {
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
function linkTarget(ev: GitHubEvent): { href: string; text: string } {
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

/** Relative time text in the current language (e.g. "2 hours ago"). */
function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), {
    addSuffix: true,
    locale: DATE_LOCALES[locale.value],
  });
}

// ---- Row model (computed for the template) ----

interface EventRow {
  key: string;
  icon: string;
  prefix: string;
  suffix: string;
  linkHref: string;
  linkText: string;
  timeText: string;
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
      timeText: relativeTime(ev.created_at),
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
    no-header-close
    centered
    hide-footer
    scrollable
    @shown="onShown"
  >
    <ul class="list-unstyled mb-0 github-events-list">
      <li
        v-for="row in rows"
        :key="row.key"
        class="d-flex align-items-center gap-2 py-1"
      >
        <i
          :class="`bi ${row.icon} text-body-secondary flex-shrink-0`"
          aria-hidden="true"
        ></i>
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
        <span
          class="text-body-secondary small text-nowrap flex-shrink-0 time-text"
        >
          {{ row.timeText }}
        </span>
      </li>
    </ul>

    <template #footer>
      <button
        ref="closeBtnRef"
        type="button"
        class="btn btn-outline-primary btn-no-border ms-auto"
        @click="pop()"
      >
        {{ $t("text-close") }}
      </button>
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
