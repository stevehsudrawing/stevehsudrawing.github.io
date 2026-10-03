<!--
  RefreshWarningModal.vue — Confirmation dialog before re-fetching one
  cached API endpoint.  Visibility + props come from the shared modal
  stack (id `refresh-warning`).  Shows the exact request URL, the API's
  name, its rate-limit documentation link and the cached data's age;
  Continue re-fetches, pops one level and reports the result via toast.
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "../../composables/core/useI18n";
import { useToast } from "../../composables/core/useToast";
import { useModalFocus } from "../../composables/modals/useModalFocus";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { CACHED_APIS } from "../../configs/cached-apis";
import { formatAbsoluteTime, formatRelativeTime } from "../../core/time";
import { resolveLanguageAwareString } from "../../core/utils";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import TruncatedTitle from "../ui/TruncatedTitle.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("refresh-warning");
const { pop } = useModalStack();
const { t, locale } = useI18n();
const { showToast } = useToast();

/** Cancel-button element for keyboard auto-focus. */
const cancelBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Cancel button when opened via Tab. */
const { onShown } = useModalFocus(cancelBtnRef);

/** True while the re-fetch is in flight (both buttons disabled). */
const refreshing = ref(false);

// ---- Derived (narrowed from the stack entry) ----

/** Metadata for the cached API being refreshed. */
const apiMeta = computed(() => {
  const id = stackProps.value?.apiId;
  return id ? CACHED_APIS[id] : null;
});

/** Exact request URL about to be sent (transparency). */
const requestUrl = computed(() => stackProps.value?.url ?? "");

/** Localized documentation link (empty when the API has none). */
const docsUrl = computed(() =>
  apiMeta.value?.docs
    ? resolveLanguageAwareString(apiMeta.value.docs, locale.value)
    : "",
);

/** Cache timestamp of the displayed data, or null when never fetched. */
const fetchedAt = computed(() => stackProps.value?.fetchedAt ?? null);

/** Relative "last fetched" (surface text), resolved per language. */
const relativeTime = computed(() =>
  fetchedAt.value === null
    ? ""
    : formatRelativeTime(new Date(fetchedAt.value).toISOString(), locale.value),
);

/** Absolute "last fetched" (tooltip), resolved per language. */
const absoluteTime = computed(() =>
  fetchedAt.value === null
    ? ""
    : formatAbsoluteTime(new Date(fetchedAt.value).toISOString(), locale.value),
);

// =========================================================================
// Actions
// =========================================================================

/**
 * Confirm — re-fetch, pop one level (back to the modal below, if any)
 * and report the result through a toast.  Both buttons stay disabled
 * while the fetch settles.
 */
async function confirmRefresh(): Promise<void> {
  const props = stackProps.value;
  if (!props || refreshing.value) return;
  refreshing.value = true;
  const ok = await props.refresh();
  refreshing.value = false;
  pop();
  showToast(
    ok ? "success" : "error",
    t(ok ? "text-refresh-done" : "text-refresh-failed"),
  );
}
</script>

<template>
  <BModal
    v-model="visible"
    :title="$t('text-refresh-title')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    hide-footer
    @shown="onShown"
  >
    <template #title>
      <TruncatedTitle :text="$t('text-refresh-title')" />
    </template>

    <p class="mb-2">
      {{ $t("text-refresh-description", [apiMeta?.name ?? ""]) }}
    </p>
    <code class="d-block p-2 mb-2 user-select-all text-break-all">{{
      requestUrl
    }}</code>
    <p v-if="fetchedAt !== null" class="small text-body-secondary mb-0">
      <TooltipTrigger :title="absoluteTime" teleport>
        <span>{{ $t("text-refresh-last-fetched", [relativeTime]) }}</span>
      </TooltipTrigger>
    </p>

    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="$t('text-refresh-learn-more')">
          <TypeAwareLink
            v-if="docsUrl"
            type="external"
            :href="docsUrl"
            class="btn btn-outline-primary btn-same-padding btn-no-border"
            no-underline
            hide-indicator
          >
            <MaterialSymbol name="link" />
          </TypeAwareLink>
        </TooltipTrigger>
        <div class="ms-auto">
          <button
            ref="cancelBtnRef"
            type="button"
            class="btn btn-outline-secondary btn-no-border"
            :disabled="refreshing"
            @click="pop()"
          >
            {{ $t("text-cancel") }}
          </button>
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :disabled="refreshing"
            @click="confirmRefresh"
          >
            {{ $t("text-continue") }}
          </button>
        </div>
      </div>
    </template>
  </BModal>
</template>
