/**
 * usePictureRegistry — runtime access to the picture registry.
 *
 * Every picture's identity lives in `src/configs/picture-registry.json`
 * (see `core/picture-registry.ts` for the resolution rule).  This
 * composable is the only runtime entry point: pages, cards, the carousel
 * and both lightboxes resolve their props through it.
 *
 * The function is reactive when called during a render / inside a
 * `computed` — `t()` tracks the language, so a language switch rebuilds
 * the returned props.
 *
 * @example
 * const { pictureProps } = usePictureRegistry();
 * const hero = pictureProps("artworks", { showAltButton: true, previewable: true });
 */

import registryData from "../../configs/picture-registry.json";
import {
  PICTURE_LICENSE_TERMS,
  findPictureEntry,
  pictureLicense,
  resolvePictureProps,
  type PictureLicenseInfo,
} from "../../core/picture-registry";
import type {
  FeatureAwarePictureProps,
  PicturePropsOverride,
  RegistryPictureEntry,
} from "../../types/app";
import { useI18n } from "../core/useI18n";

// =========================================================================
// Registry data
// =========================================================================

/**
 * The registry array.  Statically imported: pages resolve their pictures
 * synchronously during the first render (the JSON is small and shared by
 * every picture-bearing chunk — Vite de-duplicates it).
 */
const registry = registryData as RegistryPictureEntry[];

/** Props used when an id is unknown — the build / validator reject it. */
const EMPTY_PROPS: FeatureAwarePictureProps = {
  srcMap: { webp: { light: { en: "" } } },
};

// =========================================================================
// Composable
// =========================================================================

/**
 * Picture-registry accessor.
 *
 * @returns `pictureProps(id, overrides?)` (resolved display props),
 *   `hasPicture(id)` (registry membership test) and `pictureLicense(id)`
 *   (the tier's label and link facts).
 */
export function usePictureRegistry(): {
  /** Resolve a picture id into display props (dev-warns on unknown ids). */
  pictureProps: (
    id: string,
    overrides?: PicturePropsOverride,
  ) => FeatureAwarePictureProps;
  /** Whether the registry knows this picture id. */
  hasPicture: (id: string) => boolean;
  /** The tier a picture is shown under: its label and link facts. */
  pictureLicense: (id: string) => PictureLicenseInfo;
} {
  const { t } = useI18n();

  function pictureProps(
    id: string,
    overrides?: PicturePropsOverride,
  ): FeatureAwarePictureProps {
    const entry = findPictureEntry(registry, id);
    if (!entry) {
      if (import.meta.env.DEV) {
        console.warn(`[picture-registry] unknown picture id: "${id}"`);
      }
      return { ...EMPTY_PROPS, ...overrides } as FeatureAwarePictureProps;
    }
    return resolvePictureProps(entry, t, overrides);
  }

  function hasPicture(id: string): boolean {
    return findPictureEntry(registry, id) !== null;
  }

  function licenseOf(id: string): PictureLicenseInfo {
    const entry = findPictureEntry(registry, id);
    if (!entry) {
      if (import.meta.env.DEV) {
        console.warn(`[picture-registry] unknown picture id: "${id}"`);
      }
      // The conservative answer — an unknown picture is treated as restricted.
      return {
        label: t("text-restricted-artworks-license"),
        ...PICTURE_LICENSE_TERMS.restricted,
      };
    }
    return pictureLicense(entry, t);
  }

  return { pictureProps, hasPicture, pictureLicense: licenseOf };
}
