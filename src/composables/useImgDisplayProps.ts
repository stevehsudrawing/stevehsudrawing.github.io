/**
 * HAST imgProperties extraction composable.
 *
 * Shared by ExternalLinkConfirmModal and QRCodeModal to reduce
 * the boilerplate of extracting display properties from a HAST
 * imgProperties object (src, alt, dataImgFeature, etc.).
 *
 * After the image component refactoring, the `feature` field is
 * typed as `ImgFeature[]` (space-separated string in HAST → array).
 * A separate `isColored` discriminator indicates whether the image
 * should be rendered with ColoredImg.
 */
import { computed, type Ref } from "vue";
import type { ImgFeature } from "../types/app";

/** Extracted image display properties from a HAST imgProperties object. */
export interface ImgDisplayProps {
  src: Ref<string | undefined>;
  alt: Ref<string | undefined>;
  /** Parsed feature flags (space-separated string in HAST → ImgFeature[]). */
  feature: Ref<ImgFeature[]>;
  /** CSS variable for colored tint. */
  colorVar: Ref<string | undefined>;
  /** Mask image source for colored rendering. */
  colorMaskSrc: Ref<string | undefined>;
  /** Whether the image uses colored (CSS mask) rendering. */
  isColored: Ref<boolean>;
}

/**
 * Parse a space-separated feature string into ImgFeature[].
 * Filters out "colored" — it is not an ImgFeature.
 */
function parseFeatures(raw: string | undefined): ImgFeature[] {
  if (!raw) return [];
  const validFeatures: ImgFeature[] = ["follow-theme", "follow-language"];
  return raw
    .split(" ")
    .filter((f): f is ImgFeature => (validFeatures as string[]).includes(f));
}

/**
 * Extract display properties from a reactive HAST imgProperties object.
 * Each property is returned as a computed ref so it re-evaluates when
 * the source imgProperties changes.
 *
 * @param source - A ref (or reactive object) containing HAST properties,
 *   or null/undefined.
 */
export function useImgDisplayProps(
  source: Ref<Record<string, unknown> | null | undefined>,
): ImgDisplayProps {
  const src = computed(() => (source.value?.src as string) ?? undefined);
  const alt = computed(() => (source.value?.alt as string) ?? undefined);
  const featureRaw = computed(
    () => (source.value?.dataImgFeature as string) ?? undefined,
  );
  const feature = computed(() => parseFeatures(featureRaw.value));
  const isColored = computed(
    () => featureRaw.value?.split(" ").includes("colored") ?? false,
  );
  const colorVar = computed(
    () => (source.value?.dataColorVar as string) ?? undefined,
  );
  const colorMaskSrc = computed(
    () => (source.value?.dataSrcMask as string) ?? undefined,
  );

  return { src, alt, feature, colorVar, colorMaskSrc, isColored };
}
