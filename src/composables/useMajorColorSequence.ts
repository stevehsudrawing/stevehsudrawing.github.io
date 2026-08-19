/**
 * Major-color sequence state machine (About page).
 *
 * Records clicks on the two profile "major color" buttons and reports when
 * the expected pattern is completed.  Pure logic — no DOM access.
 */
import { ref } from "vue";

// =========================================================================
// Constants
// =========================================================================

/** The unlock pattern — matches the two profile major-color buttons. */
const PATTERN = ["#47c4ee", "#3c96ff", "#3c96ff", "#47c4ee"];

/** Maximum gap between two clicks before the sequence resets, in ms. */
const CLICK_WINDOW_MS = 5000;

/** Cooldown after a successful unlock before it can trigger again, in ms. */
const UNLOCK_COOLDOWN_MS = 10000;

// =========================================================================
// Composable
// =========================================================================

/**
 * Sequence state machine for the major-color easter egg.
 *
 * @returns `record(color)` — feed the clicked color; returns `true` exactly
 *   once when the full pattern completes, otherwise `false`.
 */
export function useMajorColorSequence(): {
  record: (color: string) => boolean;
} {
  const position = ref(0);
  const lastClickAt = ref(0);
  const lastUnlockAt = ref(0);

  function record(color: string): boolean {
    const now = Date.now();

    // Cooldown after a successful unlock (prevents repeat spam).
    if (now - lastUnlockAt.value < UNLOCK_COOLDOWN_MS) return false;

    // Reset when the gap between clicks exceeds the window.
    if (now - lastClickAt.value > CLICK_WINDOW_MS) position.value = 0;

    if (color === PATTERN[position.value]) {
      position.value += 1;
      lastClickAt.value = now;
      if (position.value === PATTERN.length) {
        position.value = 0;
        lastUnlockAt.value = now;
        return true;
      }
    } else {
      // Mismatch — restart (a first-position click re-arms from step one).
      position.value = color === PATTERN[0] ? 1 : 0;
      lastClickAt.value = now;
    }
    return false;
  }

  return { record };
}
