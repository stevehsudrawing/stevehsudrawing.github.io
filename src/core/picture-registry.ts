/**
 * Picture registry — pure resolution helpers.
 *
 * `src/configs/picture-registry.json` owns every picture's identity
 * (sources, feature flags, own metadata).  The single resolution rule
 * lives here so the runtime composable and the build-time content
 * extraction can never drift:
 *
 *   explicit registry value  ->  `text-<id>-<key>` i18n  ->  empty
 *
 * Display keys (`width`, `height`, `class`, `loading`, `fetchpriority`,
 * `showAltButton`, `previewable`) are NOT part of the registry — the
 * consumer that renders the picture supplies them as overrides.
 */

import { ARTICLES_RESTRICTED_ARTWORKS } from "../configs/sub-sites";
import type {
  FeatureAwarePictureProps,
  PictureLicense,
  PicturePropsOverride,
  RegistryPictureEntry,
  TypeAwareLinkProps,
} from "../types/app";

/** Resolver for i18n keys (runtime `t` / build-time `textFor`). */
export type TextResolver = (key: string) => string;

/**
 * Find a registry entry by picture id.
 *
 * @param entries - The registry array.
 * @param id - Picture id.
 * @returns The entry, or `null` when the id is unknown.
 */
export function findPictureEntry(
  entries: RegistryPictureEntry[],
  id: string,
): RegistryPictureEntry | null {
  return entries.find((entry) => entry.id === id) ?? null;
}

// =========================================================================
// License tiers
// =========================================================================

/** One tier's fixed facts: where its terms live and whether it blocks copying. */
export interface PictureLicenseTerms {
  /** Where the terms live. */
  href: string;
  /** Link type — `static` for the sub-site license page, `external` for the deed. */
  type: TypeAwareLinkProps["type"];
  /** Whether the tier blocks copying on the rendered picture. */
  noCopy: boolean;
}

/** A tier plus the label to print for the current language. */
export interface PictureLicenseInfo extends PictureLicenseTerms {
  /** The link's text. */
  label: string;
}

/**
 * The fixed facts of each tier.
 *
 * `public/images/README.md` remains the authority: the restricted works'
 * terms are the license on the articles sub-site, and the works listed in
 * its CC BY-NC 4.0 table are offered under that deed.
 */
export const PICTURE_LICENSE_TERMS: Record<
  PictureLicense,
  PictureLicenseTerms
> = {
  restricted: {
    href: ARTICLES_RESTRICTED_ARTWORKS,
    type: "static",
    noCopy: true,
  },
  "cc-by-nc-4.0": {
    href: "https://creativecommons.org/licenses/by-nc/4.0/",
    type: "external",
    noCopy: false,
  },
};

/**
 * The tier a picture is shown under.
 *
 * An absent field means `restricted`: the notice's own rule is that a
 * work not listed under CC BY-NC 4.0 is a restricted work, so a missing
 * field reproduces the notice instead of granting anything.
 *
 * @param entry - The registry entry.
 * @returns The declared tier, or `restricted` when undeclared.
 */
export function pictureLicenseOf(entry: RegistryPictureEntry): PictureLicense {
  return entry.pictureProps.license ?? "restricted";
}

/**
 * Resolve a picture's tier into the label and link facts for a language.
 *
 * The restricted label is the message the skin viewer's credit already
 * prints; the CC label is the license's own short name, which reads the
 * same in every language and therefore needs no message key.
 *
 * @param entry - The registry entry.
 * @param t - i18n resolver.
 * @returns The label, href, link type and copy rule of the picture's tier.
 */
export function pictureLicense(
  entry: RegistryPictureEntry,
  t: TextResolver,
): PictureLicenseInfo {
  const tier = pictureLicenseOf(entry);
  const label =
    tier === "restricted"
      ? t("text-restricted-artworks-license")
      : "CC BY-NC 4.0";
  return { label, ...PICTURE_LICENSE_TERMS[tier] };
}

/**
 * Resolve one registry entry into render-ready display props.
 *
 * `alt` / `title` / `message` fall back to the id-derived i18n keys.
 * Overrides are applied on top; `relatedLink` is shallow-merged so a
 * caller can add a flag (e.g. `noQRCode`) without repeating the href.
 * A registry `license` tier appends the `no-copy` class after the
 * override merge (so a caller's own `class` cannot drop it) when the tier
 * blocks copying.
 *
 * @param entry - The registry entry.
 * @param t - i18n resolver.
 * @param overrides - Consumer overrides (display keys / refinements).
 * @returns Props ready for `FeatureAwarePicture`.
 */
export function resolvePictureProps(
  entry: RegistryPictureEntry,
  t: TextResolver,
  overrides?: PicturePropsOverride,
): FeatureAwarePictureProps {
  const { license: _license, ...identity } = entry.pictureProps;
  const base: FeatureAwarePictureProps = {
    ...identity,
    pictureId: entry.id,
    alt: identity.alt ?? t(`text-${entry.id}-alt`),
    title: identity.title || t(`text-${entry.id}-title`),
    message: identity.message || t(`text-${entry.id}-message`),
  };

  let resolved = base;
  if (overrides) {
    const { relatedLink: linkOverride, ...rest } = overrides;
    resolved = { ...base, ...rest };
    if (linkOverride) {
      // Shallow merge — the registry link keeps href / type / icon, the
      // caller adds or replaces single flags (e.g. `noQRCode`).
      resolved.relatedLink = {
        ...(base.relatedLink ?? {}),
        ...linkOverride,
      } as TypeAwareLinkProps;
    }
  }

  // Applied last — a consumer's `class` override cannot drop it.
  if (PICTURE_LICENSE_TERMS[pictureLicenseOf(entry)].noCopy) {
    resolved.class = ensureNoCopy(resolved.class);
  }
  return resolved;
}

/**
 * Append `no-copy` to a class string unless it is already present.
 *
 * @param value - Consumer class string (bare or with other classes).
 * @returns The class string with `no-copy` appearing exactly once.
 */
function ensureNoCopy(value?: string): string {
  const classes = value?.split(/\s+/).filter(Boolean) ?? [];
  if (!classes.includes("no-copy")) classes.push("no-copy");
  return classes.join(" ");
}
