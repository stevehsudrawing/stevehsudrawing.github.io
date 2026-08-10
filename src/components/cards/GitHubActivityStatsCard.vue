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
import { useDelayedTooltip } from "../../composables/useDelayedTooltip";
import {
  useGithubActivity,
  eventTypeI18nKey,
  eventTypeIcon,
} from "../../composables/useGithubActivity";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";
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
import type { ActivityStat, DailyStat } from "../../types/app";

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
const { stats, dailyStats, isLoading, error } = useGithubActivity();

// ---- Chart mode ----

type ChartMode = "bar" | "line";

const chartMode = ref<ChartMode>("bar");

// ---- Tooltips (§4.2.6.1) ----

const barBtnTip = useDelayedTooltip(500);
const lineBtnTip = useDelayedTooltip(500);

// ---- Canvas ref ----

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// ---- Derived ----

const totalCount = computed(() =>
  stats.value.reduce((sum, s) => sum + s.count, 0),
);

const headingText = computed(() =>
  chartMode.value === "bar"
    ? t("text-x-events-total", "%1 events", [String(totalCount.value)])
    : t("text-x-events-total", "%1 events", [
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

/** Build a Chart.js bar chart (horizontal, event-type distribution). */
function createBarChart(
  canvas: HTMLCanvasElement,
  data: ActivityStat[],
): Chart {
  const primary = cssVar("shlh-primary", "#6f42c1");

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
  const primary = cssVar("shlh-primary", "#6f42c1");
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
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: chartMode === 'bar' }"
            v-b-tooltip.top.manual="{
              modelValue: barBtnTip.visible,
              title: $t('text-bar-chart', 'Bar chart'),
            }"
            @mouseenter="barBtnTip.scheduleShow()"
            @mouseleave="barBtnTip.cancelAndHide()"
            @click="
              barBtnTip.cancelAndHide();
              chartMode = 'bar';
            "
          >
            <i class="bi bi-bar-chart"></i>
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: chartMode === 'line' }"
            v-b-tooltip.top.manual="{
              modelValue: lineBtnTip.visible,
              title: $t('text-line-chart', 'Line chart'),
            }"
            @mouseenter="lineBtnTip.scheduleShow()"
            @mouseleave="lineBtnTip.cancelAndHide()"
            @click="
              lineBtnTip.cancelAndHide();
              chartMode = 'line';
            "
          >
            <i class="bi bi-graph-up"></i>
          </button>
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
            <span class="chart-label-item-placeholder"></span>
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
  height: 2.2rem;
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
