<!--
  GitHubActivityStatsCard.vue — Chart.js bar / line chart of recent
  GitHub event types.  Fetches events via useGithubActivity() with
  stale-while-revalidate caching.

  Toggle buttons switch between:
  - "bar"  — horizontal bar chart (event type distribution) with
             external HTML icon+label column (plan C).
  - "line" — time-series line chart (daily event frequency).

  Chart.js lifecycle: destroy → recreate on mode / data / theme change.
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useTheme } from "../../composables/useTheme";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import {
  useGithubActivity,
  eventTypeI18nKey,
  eventTypeIcon,
} from "../../composables/useGithubActivity";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";
import { useModalStack } from "../../composables/useModalStack";
import { cssVar } from "../../platform/css-var";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";
import type { ActivityStat, DailyStat, GitHubEvent } from "../../types/app";

// =========================================================================
// Chart.js — tree-shaken registration (module-level guard)
// =========================================================================

let chartJsRegistered = false;

function ensureChartJs(): void {
  if (chartJsRegistered) return;
  Chart.register(
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
  );
  chartJsRegistered = true;
}

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const { effectiveTheme } = useTheme();
const { events, stats, dailyStats, isLoading, error } = useGithubActivity();
const { push } = useModalStack();

// ---- Chart mode ----

type ChartMode = "bar" | "line";

const chartMode = ref<ChartMode>("bar");

// ---- Canvas ref ----

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// ---- Derived ----

const totalCount = computed(() =>
  stats.value.reduce((sum, s) => sum + s.count, 0),
);

const headingText = computed(() =>
  chartMode.value === "bar"
    ? t("text-x-activities-recently", "%1 events", [String(totalCount.value)])
    : t("text-x-activities-recently", "%1 events", [
        String(dailyStats.value.reduce((s, d) => s + d.y, 0)),
      ]),
);

const placeholderLabel = computed(() =>
  t("text-github-activity-stats", "Recent Activity"),
);

/** Whether any chart data is present for the current mode. */
const hasData = computed(() =>
  chartMode.value === "bar"
    ? stats.value.length > 0
    : dailyStats.value.length > 0,
);

// =========================================================================
// Chart creation
// =========================================================================

/** Shared click handling — open the events modal for a filtered subset. */
function openEventsModal(filtered: GitHubEvent[], title: string): void {
  if (filtered.length === 0) return;
  push({ id: "github-events", props: { title, events: filtered } });
}

/** Bar-mode click: show all events of the clicked event type. */
function openEventsForBar(index: number): void {
  const eventType = stats.value[index]?.eventType;
  if (!eventType) return;
  const filtered = (events.value ?? [])
    .filter(
      (e) =>
        e.type === eventType &&
        !(e.type === "IssuesEvent" && e.payload?.action === "labeled"),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  openEventsModal(filtered, labelFor(eventType));
}

/** Line-mode click: show all events of the clicked day. */
function openEventsForLine(index: number): void {
  const ts = dailyStats.value[index]?.x;
  if (ts === undefined) return;
  const day = new Date(ts).toISOString().slice(0, 10);
  const filtered = (events.value ?? [])
    .filter(
      (e) =>
        e.created_at.slice(0, 10) === day &&
        !(e.type === "IssuesEvent" && e.payload?.action === "labeled"),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  openEventsModal(filtered, day);
}

/** Shared Chart.js options.onClick handler (pointer cursor + open modal). */
function chartOnClick(elements: { index: number }[]): void {
  if (elements.length === 0) return;
  const index = elements[0].index;
  if (chartMode.value === "bar") {
    openEventsForBar(index);
  } else {
    openEventsForLine(index);
  }
}

/** Shared Chart.js options.onHover handler (pointer cursor feedback). */
function chartOnHover(
  event: { native?: Event | null },
  elements: unknown[],
): void {
  const target = event.native?.target as HTMLCanvasElement | null;
  if (target) {
    target.style.cursor = elements.length > 0 ? "pointer" : "default";
  }
}

/** Build a Chart.js bar chart (horizontal, event-type distribution). */
function createBarChart(
  canvas: HTMLCanvasElement,
  data: ActivityStat[],
): Chart {
  const primary = cssVar("shlh-primary", "#3078cc");

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map((s) => s.eventType),
      datasets: [
        {
          data: data.map((s) => s.count),
          backgroundColor: primary,
          borderRadius: 0,
          borderWidth: 0,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      onClick: (_e, elements) => chartOnClick(elements),
      onHover: (e, elements) => chartOnHover(e, elements),
      scales: {
        x: {
          type: "linear",
          ticks: { stepSize: 1, precision: 0 },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          type: "category",
          ticks: { display: false },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
}

/** Build a Chart.js line chart (time-series, daily frequency). */
function createLineChart(canvas: HTMLCanvasElement, data: DailyStat[]): Chart {
  const primary = cssVar("shlh-primary", "#3078cc");
  const primaryRgb = cssVar("shlh-primary-500-rgb", "111,66,193");
  const gridColor = cssVar("bs-border-color", "#dee2e6");
  const textColor = cssVar("bs-body-color", "#212529");

  return new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          data,
          borderColor: primary,
          backgroundColor: `rgba(${primaryRgb}, 0.15)`,
          fill: true,
          pointRadius: 2,
          borderWidth: 2,
          pointBackgroundColor: primary,
          pointBorderColor: primary,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      onClick: (_e, elements) => chartOnClick(elements),
      onHover: (e, elements) => chartOnHover(e, elements),
      scales: {
        x: {
          type: "time",
          time: { unit: "day", displayFormats: { day: "MMM d" } },
          ticks: { color: textColor, maxTicksLimit: 8 },
          grid: { display: false },
          border: { color: gridColor },
        },
        y: {
          type: "linear",
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0, color: textColor },
          grid: { color: gridColor },
          border: { display: false },
        },
      },
    },
  });
}

/**
 * Destroy the current chart and create a new one for the given mode.
 * Called on mode change, data change, or theme change.
 */
function rebuildChart(): void {
  if (!canvasRef.value) return;
  chartInstance?.destroy();

  ensureChartJs();

  if (chartMode.value === "bar" && stats.value.length > 0) {
    chartInstance = createBarChart(canvasRef.value, stats.value);
  } else if (chartMode.value === "line" && dailyStats.value.length > 0) {
    chartInstance = createLineChart(canvasRef.value, dailyStats.value);
  }
}

// ---- Initial render + watchers ----

onMounted(() => {
  rebuildChart();
});

watch(
  [() => stats.value, () => dailyStats.value, chartMode, effectiveTheme],
  () => {
    rebuildChart();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  chartInstance?.destroy();
  chartInstance = null;
});

// =========================================================================
// Helpers
// =========================================================================

function labelFor(eventType: string): string {
  return t(eventTypeI18nKey(eventType), eventType);
}
</script>

<template>
  <div class="card github-activity-stats-card h-100">
    <div class="card-body d-flex flex-column">
      <!-- ==== Heading + toggle buttons ==== -->
      <div
        class="d-flex flex-wrap justify-content-between align-items-center pb-2"
      >
        <div>
          <h3 class="h5 card-title mb-0">{{ headingText }}</h3>
          <span class="text-body-secondary small">{{
            $t(
              "text-displaying-data-from-the-past-month",
              "displaying data from the past month",
            )
          }}</span>
        </div>

        <!-- Toggle buttons -->
        <div class="btn-group btn-group-sm" role="group">
          <TooltipTrigger :title="$t('text-bar-chart', 'Bar chart')">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :class="{ active: chartMode === 'bar' }"
              @click="chartMode = 'bar'"
            >
              <i class="bi bi-bar-chart"></i>
            </button>
          </TooltipTrigger>
          <TooltipTrigger :title="$t('text-line-chart', 'Line chart')">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :class="{ active: chartMode === 'line' }"
              @click="chartMode = 'line'"
            >
              <i class="bi bi-graph-up"></i>
            </button>
          </TooltipTrigger>
        </div>
      </div>

      <!-- ==== Content: chart (only when data is present) ==== -->
      <template v-if="hasData">
        <!-- Bar mode: external labels + canvas -->
        <div v-if="chartMode === 'bar'" class="chart-with-labels flex-grow-1">
          <!-- External icon+label column (plan C) -->
          <div class="chart-labels-col">
            <span
              v-for="stat in stats"
              :key="stat.eventType"
              class="chart-label-item text-body-secondary small text-nowrap"
            >
              <i :class="`bi ${eventTypeIcon(stat.eventType)} me-1`"></i>
              {{ labelFor(stat.eventType) }}
            </span>
            <span class="chart-label-item-placeholder">&nbsp;</span>
          </div>
          <!-- Canvas column -->
          <div class="chart-canvas-col">
            <canvas ref="canvasRef"></canvas>
          </div>
        </div>

        <!-- Line mode: canvas only -->
        <div v-else class="chart-canvas-wrapper flex-grow-1">
          <canvas ref="canvasRef"></canvas>
        </div>
      </template>

      <!-- ==== Placeholder states ==== -->
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
/* ---- Chart with external labels ---- */

.chart-with-labels {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}

.chart-labels-col {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex-shrink: 0;
  overflow: hidden;
}

.chart-label-item {
  line-height: 1.6;
}

.chart-label-item-placeholder {
  line-height: 2.1;
}

.chart-canvas-col {
  flex: 1;
  min-width: 0;
  position: relative;
}

.chart-canvas-col canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.chart-canvas-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  min-height: 120px;
}

.chart-canvas-wrapper canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}
</style>
