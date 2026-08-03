/**
 * HAST imgProperties extraction composable.
 *
 * Shared by ExternalLinkConfirmModal and QRCodeModal to reduce
 * the boilerplate of extracting display properties from a HAST
 * imgProperties object (src, alt, dataImgFeature, etc.).
 */
import { computed, toRef, type Ref } from "vue";

/** Extracted image display properties from a HAST imgProperties object. */
export interface ImgDisplayProps {
  src: Ref<string | undefined>;
  alt: Ref<string | undefined>;
  feature: Ref<string | undefined>;
  colorVar: Ref<string | undefined>;
  colorMaskSrc: Ref<string | undefined>;
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
  const feature = computed(
    () => (source.value?.dataImgFeature as string) ?? undefined,
  );
  const colorVar = computed(
    () => (source.value?.dataColorVar as string) ?? undefined,
  );
  const colorMaskSrc = computed(
    () => (source.value?.dataSrcMask as string) ?? undefined,
  );

  return { src, alt, feature, colorVar, colorMaskSrc };
}
