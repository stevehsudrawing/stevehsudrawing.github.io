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
import FeatureAwareImg from "../ui/FeatureAwareImg.vue";
import { useI18n } from "../../composables/useI18n";
import { useDelayedTooltip } from "../../composables/useDelayedTooltip";

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

const moreInformationTip = useDelayedTooltip(500);
const { t } = useI18n();
const { data: profile, isLoading } = useGithubProfile();

// ---- Derived ----

/** Whether to show the card at all (hide if no data and no cache). */
const showCard = computed(() => profile.value !== null);

/** Whether to show a skeleton placeholder while loading without cached data. */
const showPlaceholder = computed(
  () => isLoading.value && profile.value === null,
);

/** GitHub @handle string. */
const handle = computed(() => (profile.value ? `@${profile.value.login}` : ""));

/** Stats string (e.g. "x repos · x followers · x following"). */
const statsText = computed(() => {
  if (!profile.value) return "";
  const p = profile.value;
  const reposText = t("text-repos", "repos");
  const followersText = t("text-followers", "followers");
  const followingText = t("text-following", "following");
  return `${p.public_repos} ${reposText} · ${p.followers} ${followersText} · ${p.following} ${followingText}`;
});
</script>

<template>
  <!-- Only render when we have data (from cache or fresh fetch) -->
  <template v-if="showCard">
    <!-- ==== Full variant ==== -->
    <div v-if="variant === 'full'" class="card github-user-card h-100">
      <div class="card-body d-flex flex-row flex-wrap gap-3">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center mb-3">
            <FeatureAwareImg
              class="github-avatar rounded-circle me-3"
              :lightSrc="profile!.avatar_url"
              :alt="profile!.name ?? profile!.login"
              :width="64"
              :height="64"
              loading="lazy"
            />
            <div>
              <h3 v-if="profile!.name" class="h5 mb-0">{{ profile!.name }}</h3>
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
            :img-props="{
              lightSrc: '/images/webp/null.webp',
              feature: 'colored',
              colorMaskSrc: '/images/webp/icons/github.webp',
              colorVar: 'bs-body-color',
              alt: $t('text-github', 'GitHub'),
            }"
          >
            <i class="bi bi-github me-1"></i>
            <span>{{ $t("text-view-profile", "View Profile") }}</span>
          </TypeAwareLink>
        </div>
      </div>
    </div>

    <!-- ==== Compact variant ==== -->
    <div v-else class="github-user-bar d-flex align-items-center gap-3 py-3">
      <FeatureAwareImg
        class="github-avatar rounded-circle"
        :lightSrc="profile!.avatar_url"
        :alt="profile!.name ?? profile!.login"
        :width="40"
        :height="40"
        loading="lazy"
      />
      <div class="flex-grow-1">
        <strong v-if="profile!.name">{{ profile!.name }}</strong>
        <span class="text-body-secondary ms-1">{{ handle }}</span>
        <br />
        <span class="text-body-secondary small">{{ statsText }}</span>
      </div>
      <div>
        <TypeAwareLink
          class="btn btn-outline-secondary btn-sm flex-shrink-0"
          type="external"
          :href="profile!.html_url"
          :img-props="{
            lightSrc: '/images/webp/null.webp',
            feature: 'colored',
            colorMaskSrc: '/images/webp/icons/github.webp',
            colorVar: 'bs-body-color',
            alt: $t('text-github', 'GitHub'),
          }"
        >
          <i class="bi bi-github me-1"></i>
          <span class="d-none d-sm-inline">{{
            $t("text-view-profile", "View Profile")
          }}</span>
        </TypeAwareLink>
        <TypeAwareLink
          class="btn btn-outline-secondary btn-sm ms-2"
          type="internal"
          href="/softwares.html#my-github-profile"
          v-b-tooltip.top.manual="{
            modelValue: moreInformationTip.visible,
            title: $t('text-more-information', 'More Information'),
            teleportTo: 'body',
          }"
          @mouseenter="moreInformationTip.scheduleShow()"
          @mouseleave="moreInformationTip.cancelAndHide()"
        >
          <i class="bi bi-three-dots"></i>
        </TypeAwareLink>
      </div>
    </div>
  </template>

  <!-- ==== Placeholder (loading with no cache) ==== -->
  <div
    v-else-if="showPlaceholder"
    class="github-user-placeholder text-body-secondary small py-2"
  >
    Loading GitHub profile…
  </div>
</template>

<style scoped>
/* ---- Avatar ---- */

.github-avatar {
  object-fit: cover;
  flex-shrink: 0;
}

/* ---- Card (full variant) ---- */

.github-user-card {
  border: 1px solid var(--bs-border-color);
}

/* ---- Bar (compact variant) ---- */

.github-user-bar {
  border-top: 1px solid var(--bs-border-color);
  border-bottom: 1px solid var(--bs-border-color);
}
</style>
