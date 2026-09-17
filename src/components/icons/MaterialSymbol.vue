<!--
  MaterialSymbol.vue — Material Symbols icon rendered from a ligature name.

  Renders <span class="material-symbols-outlined"> whose text content is
  the ligature itself; `name` is typed by the generated `IconName` union
  (src/types/icons.ts), so unknown names fail `pnpm typecheck`.

  Axis control:
    - fill        → 'FILL' 1 via font-variation-settings
    - opticalSize → 'opsz' N via font-variation-settings (overrides the
                    automatic optical sizing)
    - weight      → inline `font-weight` (maps to the wght axis; NOT
                    font-variation-settings, which would outrank
                    `font-weight` and break inheritance and utilities)

  Accessibility: decorative by default (`aria-hidden="true"`); pass
  `label` to render `role="img"` + `aria-label` instead.

  Classes and other attributes fall through to the root <span>.
-->
<script setup lang="ts">
import { computed } from "vue";
import type { IconName } from "../../types/icons";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Material Symbols ligature name (from the committed subset). */
  name: IconName;
  /** Render the filled variant (FILL axis 1).  Default `false`. */
  fill?: boolean;
  /** Icon weight 100–700 (wght axis via `font-weight`). */
  weight?: number;
  /** Optical size 20–48 (opsz axis); overrides automatic sizing. */
  opticalSize?: number;
  /** Accessible label; omitted → the icon is decorative. */
  label?: string;
}>();

// =========================================================================
// State
// =========================================================================

/**
 * `font-variation-settings` built from the provided axes only —
 * untouched axes stay under CSS / default-instance control.
 */
const variationSettings = computed<string | undefined>(() => {
  const settings: string[] = [];
  if (props.fill) settings.push("'FILL' 1");
  if (props.opticalSize !== undefined) {
    settings.push(`'opsz' ${props.opticalSize}`);
  }
  return settings.length > 0 ? settings.join(", ") : undefined;
});
</script>

<template>
  <span
    class="material-symbols-outlined"
    :style="{ fontVariationSettings: variationSettings, fontWeight: weight }"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    >{{ name }}</span
  >
</template>
