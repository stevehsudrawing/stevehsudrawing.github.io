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
import type { ActivityStat } from "../../types/app";

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const { stats, isLoading } = useGithubActivity();

// ---- Derived ----

/** Total event count across all types. */
const totalCount = computed(() =>
  stats.value.reduce((sum, s) => sum + s.count, 0),
);

/** Card heading — parameterized with total count when data is available. */
const headingText = computed(() => {
  if (isLoading.value && stats.value.length === 0) {
    return t("text-github-activity-stats", "Recent Activity");
  }
  if (totalCount.value === 0) {
    return t("text-github-activity-empty", "No recent activity");
  }
  return t("text-x-events-total", "%1 events", [String(totalCount.value)]);
});

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
      <!-- ==== Heading ==== -->
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
        <!-- ==== Bar chart ==== -->
        <template v-if="stats.length > 0">
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
        </template>

        <!-- ==== Empty state (not loading, no data) ==== -->
        <p v-else-if="!isLoading" class="text-body-secondary small mb-0">
          {{ t("text-github-activity-empty", "No recent activity") }}
        </p>

        <!-- ==== Loading state (no cached data yet) ==== -->
        <p v-else class="text-body-secondary small mb-0">
          {{ t("text-loading", "Loading…") }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---- Card ---- */

.github-activity-stats-card {
  border: 1px solid var(--bs-border-color);
  min-height: 220px;
}

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
}
</style>
