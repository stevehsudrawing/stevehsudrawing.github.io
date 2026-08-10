<!--
  GitHubActivityStatsCard.vue — Horizontal bar chart of recent GitHub event types.
  Fetches events via useGithubActivity() with stale-while-revalidate caching.

  Displays a card with a heading (parameterized total count) and a
  horizontal bar for each event type, sorted by frequency.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import {
  useGithubActivity,
  eventTypeI18nKey,
  eventTypeIcon,
} from "../../composables/useGithubActivity";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";
import type { ActivityStat } from "../../types/app";

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const { stats, isLoading, error } = useGithubActivity();

// ---- Derived ----

/** Total event count across all types. */
const totalCount = computed(() =>
  stats.value.reduce((sum, s) => sum + s.count, 0),
);

/** Card heading — parameterized with total count.  Only rendered when data is present. */
const headingText = computed(() =>
  t("text-x-events-total", "%1 events", [String(totalCount.value)]),
);

/** Label for the loading/error placeholder. */
const placeholderLabel = computed(() =>
  t("text-github-activity-stats", "Recent Activity"),
);

// =========================================================================
// Helpers
// =========================================================================

/**
 * Translate a raw GitHub event type to its human-readable label.
 *
 * @param eventType - Raw event type string (e.g. "PushEvent").
 * @returns Localized label (e.g. "Commits").
 */
function labelFor(eventType: string): string {
  const key = eventTypeI18nKey(eventType);
  // Use the raw type as fallback for unknown event types
  return t(key, eventType);
}

/**
 * Get a CSS width percentage string for a stat bar.
 *
 * @param stat - The aggregated activity stat.
 * @returns Percentage string (e.g. "67%").
 */
function barWidth(stat: ActivityStat): string {
  return `${stat.percentage}%`;
}
</script>

<template>
  <div class="card github-activity-stats-card h-100">
    <div class="card-body d-flex flex-column">
      <!-- ==== Content: heading + chart (only when data is present) ==== -->
      <template v-if="stats.length > 0">
        <div class="d-flex flex-wrap justify-content-between pb-2">
          <h3 class="h5 card-title">{{ headingText }}</h3>
          <span class="text-body-secondary small">{{
            $t(
              "text-displaying-data-from-the-past-month",
              "displaying data from the past month",
            )
          }}</span>
        </div>

        <div class="flex-grow-1">
          <div class="activity-chart">
            <template v-for="stat in stats" :key="stat.eventType">
              <!-- Label -->
              <span class="activity-label text-body-secondary small text-nowrap"
                ><i :class="`bi ${eventTypeIcon(stat.eventType)} me-1`"></i
                >{{ labelFor(stat.eventType) }}</span
              >

              <!-- Bar track + fill -->
              <div class="activity-bar-track">
                <div
                  class="activity-bar-fill"
                  :style="{ width: barWidth(stat) }"
                ></div>
              </div>

              <!-- Count -->
              <span class="activity-count text-body-secondary small text-end">{{
                stat.count
              }}</span>
            </template>
          </div>
        </div>
      </template>

      <!-- ==== Placeholder states (at card-body level, replacing all content) ==== -->
      <LoadingPlaceholder
        v-else-if="isLoading"
        :label="placeholderLabel"
        state="loading"
      />
      <LoadingPlaceholder
        v-else-if="error"
        :label="placeholderLabel"
        state="error"
        :error-message="error"
      />
      <LoadingPlaceholder
        v-else
        :label="placeholderLabel"
        state="empty"
        :empty-message="t('text-github-activity-empty', 'No recent activity')"
      />
    </div>
  </div>
</template>

<style scoped>
/* ---- Card ---- */

/* .github-activity-stats-card {
  border: 1px solid var(--bs-border-color);
  min-height: 220px;
} */

/* ---- Bar chart ---- */

.activity-chart {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 0.75rem;
  row-gap: 0.75rem;
}

.activity-label {
  grid-column: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-bar-track {
  grid-column: 2;
  height: 1rem;
  background: var(--bs-secondary-bg);
  overflow: hidden;
}

.activity-bar-fill {
  height: 100%;
  background: var(--shlh-primary);
  transition: width 0.6s ease;
  min-width: 4px;
}

.activity-count {
  grid-column: 3;
  font-feature-settings: "tnum";
}
</style>
