<!--
  SettingsModal.vue -- User preferences panel.
  Replaces ui/settings.ts event delegation + manual localStorage sync.
  Uses BModal + v-model for reactive form binding.
-->
<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import { useTheme } from "../../composables/useTheme.js";
import { useLocalStorage } from "../../composables/useLocalStorage.js";
import { StorageKey } from "../../types/app.js";
import ResetWarningModal from "./ResetWarningModal.vue";
import languageList from "../../configs/language-list.json";

// =========================================================================
// State
// =========================================================================

const visible = ref(false);
const resetWarningRef = ref<InstanceType<typeof ResetWarningModal>>();

/** When true, SettingsModal was closed to show ResetWarningModal. */
let pendingResetWarning = false;

const { locale, setLocale } = useI18n();
const { preference: themePreference, setPreference: setTheme } = useTheme();

const openInNewTab = useLocalStorage(StorageKey.OpenInNewTab, true);
const enableAnimations = useLocalStorage(StorageKey.EnableAnimations, true);

// -------------------------------------------------------------------------
// Reduced-motion detection
// -------------------------------------------------------------------------

const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const reducedMotion = ref(reducedMotionQuery.matches);
function onReducedMotionChange(): void {
  reducedMotion.value = reducedMotionQuery.matches;
}
reducedMotionQuery.addEventListener("change", onReducedMotionChange);
onBeforeUnmount(() => {
  reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
});

// -------------------------------------------------------------------------
// Theme / language options
// -------------------------------------------------------------------------

const themes = [
  { value: "auto" as const, i18nKey: "text-auto" },
  { value: "light" as const, i18nKey: "text-light" },
  { value: "dark" as const, i18nKey: "text-dark" },
];

const languages = languageList.map((item) => ({
  code: item.code,
  name: item.localizedName,
}));

// =========================================================================
// Actions
// =========================================================================

function resetAll(): void {
  openInNewTab.value = true;
  enableAnimations.value = true;
  setTheme("auto");
  locale.value = "en";
  setLocale("en");
  visible.value = false;
  window.location.href = "/index.html";
}

// -------------------------------------------------------------------------
// Modal-to-modal switching (Settings ↔ ResetWarning)
// -------------------------------------------------------------------------

/**
 * Open the ResetWarningModal by hiding this modal first.
 * After SettingsModal finishes its hide animation (@hidden), the
 * ResetWarningModal is shown -- avoiding two modals on screen at once.
 */
function openResetWarning(): void {
  pendingResetWarning = true;
  visible.value = false;
}

/** Called after SettingsModal finishes hiding. */
function onSettingsHidden(): void {
  if (pendingResetWarning) {
    pendingResetWarning = false;
    resetWarningRef.value?.show();
  }
}

/** User cancelled reset -- re-show SettingsModal. */
function onResetCancel(): void {
  visible.value = true;
}

// =========================================================================
// Expose
// =========================================================================

/** Expose show/hide for external callers (settings-open button). */
defineExpose({
  show: () => {
    visible.value = true;
  },
  hide: () => {
    visible.value = false;
  },
});
</script>

<template>
  <!-- ==== Settings Modal ==== -->
  <BModal
    v-model="visible"
    :title="$t('text-settings', 'Settings')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    ok-only
    ok-title="Close"
    ok-variant="outline-primary"
    cancel-variant="outline-secondary"
    @hidden="onSettingsHidden"
  >
    <!-- Language -->
    <div class="mb-4">
      <label for="settings-language-select" class="form-label fw-semibold">
        {{ $t("text-language", "Language") }}
      </label>
      <select
        id="settings-language-select"
        v-model="locale"
        class="form-select"
        @change="setLocale(locale)"
      >
        <option v-for="lang in languages" :key="lang.code" :value="lang.code">
          {{ lang.name }}
        </option>
      </select>
    </div>

    <!-- Theme -->
    <div class="mb-4">
      <div class="mb-2 fw-semibold">{{ $t("text-theme", "Theme") }}</div>
      <div class="btn-group d-flex flex-wrap" role="group">
        <button
          v-for="t in themes"
          :key="t.value"
          type="button"
          class="btn btn-outline-secondary flex-fill"
          :class="{ active: themePreference === t.value }"
          @click="setTheme(t.value)"
        >
          {{ $t(t.i18nKey, t.value) }}
        </button>
      </div>
    </div>

    <!-- New-tab toggle -->
    <BFormCheckbox
      id="settings-new-tab-toggle"
      v-model="openInNewTab"
      switch
      class="mb-3"
    >
      {{
        $t(
          "text-always-open-external-links-in-a-new-tab",
          "Always open external links in a new tab",
        )
      }}
    </BFormCheckbox>

    <!-- Animations toggle -->
    <BFormCheckbox
      id="settings-animations-toggle"
      v-model="enableAnimations"
      switch
      :disabled="reducedMotion"
      class="mb-3"
    >
      {{ $t("text-enable-animations", "Enable animations") }}
    </BFormCheckbox>
    <small v-if="reducedMotion" class="text-muted d-block mb-3">
      {{
        $t(
          "text-animations-disabled-by-system-description",
          "Animations are disabled by your system settings.",
        )
      }}
    </small>

    <!-- Reset confirmation (modal-to-modal: opens ResetWarningModal) -->
    <ResetWarningModal
      ref="resetWarningRef"
      @confirm="resetAll"
      @cancel="onResetCancel"
    />

    <template #footer>
      <div class="w-100 d-flex justify-content-between">
        <button
          type="button"
          class="btn btn-outline-danger btn-no-border"
          @click="openResetWarning"
        >
          {{ $t("text-reset", "Reset") }}
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="visible = false"
        >
          {{ $t("text-close", "Close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>
