/**
 * Major-color sequence state machine (About page).
 *
 * Module-level singleton: AboutPage feeds clicks via `record()` and the
 * status-bar component reads the reactive `status` / `progress` — both
 * observe the same state.
 *
 * States: "idle" (bar hidden) -> "detecting" (bar shows the progress
 * line) -> "error" ("Authentication failed" for ERROR_MESSAGE_MS) /
 * "success" ("Authentication successful" for SUCCESS_MESSAGE_MS), then
 * back to "idle".  A CLICK_WINDOW_MS inactivity timer hides the bar and
 * resets the sequence; a successful pattern shows the success line and
 * `record()` returns `true` exactly once (AboutPage opens the modal).
 */
import { computed, onScopeDispose, ref, type Ref } from "vue";
import { MAJOR_COLORS } from "../configs/easter-egg";

// =========================================================================
// Constants
// =========================================================================

/** The unlock pattern — matches the two profile major-color buttons. */
const PATTERN = [...MAJOR_COLORS, ...MAJOR_COLORS.slice().reverse()];

/** Maximum gap between two clicks before the sequence resets, in ms. */
const CLICK_WINDOW_MS = 5000;

/** Cooldown after a successful unlock before it can trigger again, in ms. */
const UNLOCK_COOLDOWN_MS = 10000;

/** How long the "authentication failed" message stays visible, in ms. */
const ERROR_MESSAGE_MS = 3000;

/** How long the "authentication successful" message stays visible, in ms. */
const SUCCESS_MESSAGE_MS = 3000;

/** Length of the unlock sequence (also the progress-bracket width). */
export const SEQUENCE_LENGTH = PATTERN.length;

// =========================================================================
// Types
// =========================================================================

/** Bottom-bar visibility states for the sequence state machine. */
export type SequenceStatus = "idle" | "detecting" | "error" | "success";

// =========================================================================
// Module-level shared state (singleton — AboutPage + status bar share it)
// =========================================================================

/** Current position in the unlock pattern (0 = not started). */
const position = ref(0);

/** Timestamp of the last click (ms epoch). */
const lastClickAt = ref(0);

/** Timestamp of the last successful unlock (ms epoch) — cooldown source. */
const lastUnlockAt = ref(0);

/** Reactive bar status consumed by SequenceStatusBar. */
const status = ref<SequenceStatus>("idle");

/** Inactivity timer — hides the bar and resets the sequence. */
let inactivityTimer: ReturnType<typeof setTimeout> | undefined;

/** Error-message timer — hides the bar after ERROR_MESSAGE_MS. */
let errorTimer: ReturnType<typeof setTimeout> | undefined;

/** Success-message timer — hides the bar after SUCCESS_MESSAGE_MS. */
let successTimer: ReturnType<typeof setTimeout> | undefined;

// =========================================================================
// Helpers
// =========================================================================

/** Clear all pending timers. */
function clearTimers(): void {
  if (inactivityTimer !== undefined) {
    clearTimeout(inactivityTimer);
    inactivityTimer = undefined;
  }
  if (errorTimer !== undefined) {
    clearTimeout(errorTimer);
    errorTimer = undefined;
  }
  if (successTimer !== undefined) {
    clearTimeout(successTimer);
    successTimer = undefined;
  }
}

/**
 * Progress cells shown in the status bar's bracket: `position` while
 * detecting, full on success, empty otherwise.
 */
const progress = computed<number>(() => {
  switch (status.value) {
    case "detecting":
      return position.value;
    case "success":
      return SEQUENCE_LENGTH;
    default:
      return 0;
  }
});

/**
 * Reset the sequence to its initial state and hide the bar.  Used by the
 * inactivity timer and when leaving the About page.
 */
function reset(): void {
  clearTimers();
  position.value = 0;
  status.value = "idle";
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Record a click on a major-color button.
 * @param color - The clicked color (from `data-major-color`).
 * @returns `true` exactly once when the full pattern completes, else `false`.
 */
function record(color: string): boolean {
  const now = Date.now();

  // Cooldown after a successful unlock (prevents repeat spam).
  if (now - lastUnlockAt.value < UNLOCK_COOLDOWN_MS) return false;

  // While a failure/success message is showing, ignore further clicks.
  if (status.value === "error" || status.value === "success") return false;

  clearTimeout(inactivityTimer);
  inactivityTimer = undefined;

  // Lazy safety net — normally the inactivity timer resets the sequence,
  // but if one was somehow missed, reset on the next click.
  if (now - lastClickAt.value > CLICK_WINDOW_MS) reset();

  if (color === PATTERN[position.value]) {
    position.value += 1;
    lastClickAt.value = now;
    status.value = "detecting";
    if (position.value === PATTERN.length) {
      position.value = 0;
      lastUnlockAt.value = now;
      status.value = "success";
      successTimer = setTimeout(() => {
        status.value = "idle";
        successTimer = undefined;
      }, SUCCESS_MESSAGE_MS);
      return true;
    }
    // Arm the inactivity timer — when it fires, the bar hides and the
    // sequence resets.
    inactivityTimer = setTimeout(reset, CLICK_WINDOW_MS);
    return false;
  }

  // Mismatch.  With no sequence in progress a stray click is ignored
  // silently; otherwise show the failure message for a moment, then reset.
  if (position.value === 0) {
    lastClickAt.value = now;
    return false;
  }
  position.value = 0;
  lastClickAt.value = now;
  status.value = "error";
  errorTimer = setTimeout(() => {
    status.value = "idle";
    errorTimer = undefined;
  }, ERROR_MESSAGE_MS);
  return false;
}

/**
 * Shared major-color sequence controller.
 *
 * @returns `record` (feed clicks), reactive `status`, `progress` (filled
 *   cells 0–SEQUENCE_LENGTH), and `reset`.
 */
export function useMajorColorSequence(): {
  record: (color: string) => boolean;
  status: Ref<SequenceStatus>;
  progress: Ref<number>;
  reset: () => void;
} {
  // Clear timers + reset when the consumer (About page) unmounts.
  onScopeDispose(() => reset());

  return { record, status, progress, reset };
}
