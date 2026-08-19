<!--
  GitHubUserCard.vue — Displays the site owner's GitHub profile info.
  Fetches data via useGithubProfile() with stale-while-revalidate caching.

  Variants:
  - "full"  : portrait card with avatar, bio, stats, and link (for About / Index hero).
  - "compact": inline bar with avatar, stats, and link (for Softwares section).
-->
<script setup lang="ts">
import { computed } from "vue";
import { useGithubProfile } from "../../composables/useGithubProfile";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";
import { useI18n } from "../../composables/useI18n";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// Props
// =========================================================================

const props = withDefaults(
  defineProps<{
    /**
     * Display variant:
     * - "full"    — portrait card with avatar, bio, stats, and link.
     * - "compact" — inline bar with avatar, stats, and link.
     */
    variant?: "full" | "compact";
  }>(),
  { variant: "full" },
);

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const { data: profile, isLoading, error } = useGithubProfile();

// ---- Derived ----

/** Whether profile data is available (from cache or fresh fetch). */
const hasData = computed(() => profile.value !== null);

/** Whether to show a loading placeholder (loading with no cached data). */
const showLoading = computed(
  () => isLoading.value && profile.value === null && error.value === null,
);

/** Whether to show an error placeholder (fetch failed, no cached data). */
const showError = computed(
  () => error.value !== null && profile.value === null,
);

/** Label shown below the loading spinner / error icon. */
const placeholderLabel = computed(() => t("text-my-github-profile"));

/** GitHub @handle string. */
const handle = computed(() => (profile.value ? `@${profile.value.login}` : ""));

/** Stats string (e.g. "x repos · x followers · x following"). */
const statsText = computed(() => {
  if (!profile.value) return "";
  const p = profile.value;
  const reposText = t("text-repos");
  const followersText = t("text-followers");
  const followingText = t("text-following");
  return `${p.public_repos} ${reposText} · ${p.followers} ${followersText} · ${p.following} ${followingText}`;
});
</script>

<template>
  <!-- ==== Full variant: always render card shell for layout stability ==== -->
  <div v-if="variant === 'full'" class="card github-user-card h-100">
    <div class="card-body d-flex flex-column">
      <!-- Data loaded -->
      <template v-if="hasData">
        <div class="d-flex flex-row flex-wrap gap-3">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-3">
              <FeatureAwarePicture
                class="github-avatar rounded-circle me-3 no-copy"
                :src="profile!.avatar_url"
                :alt="profile!.name ?? profile!.login"
                :width="64"
                :height="64"
                loading="lazy"
              />
              <div>
                <h3 v-if="profile!.name" class="h5 mb-0">
                  {{ profile!.name }}
                </h3>
                <span class="text-body-secondary">{{ handle }}</span>
              </div>
            </div>
            <p v-if="profile!.bio" class="card-text">{{ profile!.bio }}</p>
            <p class="card-text text-body-secondary small">
              {{ statsText }}
            </p>
          </div>
          <div>
            <TypeAwareLink
              class="btn btn-outline-secondary btn-sm"
              type="external"
              :href="profile!.html_url"
              :icon="{
                type: 'picture',
                imgProps: {
                  src: '/images/webp/icons/github.webp',
                  alt: $t('text-github'),
                },
              }"
            >
              <i class="bi bi-github me-1"></i>
              <span>{{ $t("text-view-profile") }}</span>
            </TypeAwareLink>
          </div>
        </div>
      </template>

      <!-- Loading / Error / Empty placeholders at card-body level -->
      <LoadingPlaceholder
        v-else-if="showLoading"
        :label="placeholderLabel"
        state="loading"
      />
      <LoadingPlaceholder
        v-else-if="showError"
        :label="placeholderLabel"
        state="error"
        :error-message="error ?? undefined"
      />
      <LoadingPlaceholder
        v-else
        :label="placeholderLabel"
        state="empty"
        :empty-message="$t('text-no-data-available')"
      />
    </div>
  </div>

  <!-- ==== Compact variant ==== -->
  <template v-else>
    <template v-if="hasData">
      <div class="github-user-bar d-flex align-items-center gap-3 py-3">
        <FeatureAwarePicture
          class="github-avatar rounded-circle no-copy"
          :src="profile!.avatar_url"
          :alt="profile!.name ?? profile!.login"
          :width="40"
          :height="40"
          loading="lazy"
        />
        <div class="flex-grow-1 d-flex flex-wrap gap-2">
          <div class="flex-grow-1">
            <strong v-if="profile!.name">{{ profile!.name }}</strong>
            <span class="text-body-secondary ms-1">{{ handle }}</span>
            <br />
            <span class="text-body-secondary small">{{ statsText }}</span>
          </div>
          <div class="my-auto">
            <div class="btn-group">
              <TypeAwareLink
                class="btn btn-outline-secondary btn-sm flex-shrink-0"
                type="external"
                :href="profile!.html_url"
                :icon="{
                  type: 'colored-img',
                  imgProps: {
                    src: '/images/webp/icons/github.webp',
                    colorVar: 'bs-body-color',
                    alt: $t('text-github'),
                  },
                }"
              >
                <i class="bi bi-github me-1"></i>
                <span>{{ $t("text-view-profile") }}</span>
              </TypeAwareLink>
              <TooltipTrigger :title="$t('text-more-information')" teleport>
                <TypeAwareLink
                  class="btn btn-outline-secondary btn-sm"
                  type="internal"
                  href="/softwares.html#my-github-profile"
                >
                  <i class="bi bi-three-dots"></i>
                </TypeAwareLink>
              </TooltipTrigger>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Loading / Error / Empty placeholder for compact variant -->
    <LoadingPlaceholder
      v-else-if="showLoading"
      :label="placeholderLabel"
      state="loading"
    />
    <LoadingPlaceholder
      v-else-if="showError"
      :label="placeholderLabel"
      state="error"
      :error-message="error ?? undefined"
    />
    <LoadingPlaceholder
      v-else
      :label="placeholderLabel"
      state="empty"
      :empty-message="$t('text-no-data-available')"
    />
  </template>
</template>

<style scoped>
/* ---- Avatar ---- */

.github-avatar {
  object-fit: cover;
  flex-shrink: 0;
}

/* ---- Bar (compact variant) ---- */

.github-user-bar {
  border-top: 1px solid var(--bs-border-color);
  border-bottom: 1px solid var(--bs-border-color);
}
</style>
