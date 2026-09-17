/**
 * Vite plugin: keep the Material Symbols subset font and the icon-name
 * manifest in sync with the names used across `src/`.
 *
 * Pipeline (runs at `buildStart` — `pnpm dev` and `pnpm build` — plus a
 * debounced watcher during `pnpm dev`):
 *
 *   1. collect icon names — the committed `ICON_NAMES` manifest (keeps
 *      previously included names) union a literal scan of `src/**`
 *      (`name="…"` on `<MaterialSymbol>` tags, `icon: "…"` fields);
 *   2. decompress the fontsource source font (woff2 → sfnt);
 *   3. shape every name with harfbuzzjs — the shaping result IS the
 *      glyph-id lookup (the HB_TINY build carries no glyph-name table);
 *   4. subset with the raw `harfbuzz-subset.wasm` (glyph-id set +
 *      `NO_LAYOUT_CLOSURE`) — layout closure over the retained alphabet
 *      would pull every icon back in;
 *   5. verify the output (per-name shaping, distinct non-notdef gids,
 *      all four fvar axes) and compress back to woff2;
 *   6. write both artifacts — write-if-changed, so a run with no name
 *      changes touches nothing (the manifest doubles as the marker).
 *
 * The woff2 is GENERATED and git-ignored; the manifest stays committed
 * (editors / `vue-tsc` need it before any build).
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type * as Hb from "harfbuzzjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "src");

/** Fontsource source font — the latin full-axes variable woff2. */
const SOURCE_FONT = resolve(
  ROOT,
  "node_modules",
  "@fontsource-variable",
  "material-symbols-outlined",
  "files",
  "material-symbols-outlined-latin-full-normal.woff2",
);

/** The raw hb-subset wasm shipped by harfbuzzjs. */
const SUBSET_WASM = resolve(
  ROOT,
  "node_modules",
  "harfbuzzjs",
  "dist",
  "harfbuzz-subset.wasm",
);

/** Generated (git-ignored) subset font. */
const OUT_FONT = resolve(
  SRC,
  "assets",
  "fonts",
  "material-symbols-outlined-subset.woff2",
);

/** Generated (committed) icon-name manifest. */
const OUT_MANIFEST = resolve(SRC, "types", "icons.ts");

/**
 * Ligature composition set: every icon name is built from letters,
 * digits and underscores, so all of those codepoints must stay in the
 * subset (they arrive through the unicode set, the icons themselves
 * through the glyph-id set).
 */
const LIGATURE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789_";

/** `HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE` (see hb-subset.h). */
const SUBSET_FLAG_NO_LAYOUT_CLOSURE = 0x200;

/** `HB_SUBSET_FLAGS_NOTDEF_OUTLINE` (see hb-subset.h). */
const SUBSET_FLAG_NOTDEF_OUTLINE = 0x40;

/** Icon-name scan patterns (same as the retired Python generator). */
const SCAN_TAG = /<MaterialSymbol\b[^>]*?\bname="([a-z][a-z0-9_]*)"/g;
const SCAN_ICON_FIELD = /\bicon:\s*"([a-z][a-z0-9_]*)"/g;
const MANIFEST_NAME = /"([a-z][a-z0-9_]*)"/g;

/** Log prefix shared by every message of this plugin. */
const LOG_PREFIX = "[icon-subset]";

// =========================================================================
// Name collection
// =========================================================================

/**
 * Read every `src/**` `.vue` / `.ts` file (the manifest itself excluded)
 * as one concatenated scan text.
 *
 * @returns The concatenated source text.
 */
function readScanText(): string {
  const files = readdirSync(SRC, { recursive: true, encoding: "utf-8" }).filter(
    (path) =>
      /\.(vue|ts)$/.test(path) &&
      path.replace(/\\/g, "/") !== "types/icons.ts",
  );
  return files
    .map((path) => readFileSync(resolve(SRC, path), "utf-8"))
    .join("\n");
}

/**
 * Collect the icon names to carry in the subset — manifest union scan.
 *
 * @param manifestText - The current `src/types/icons.ts` contents.
 * @param scanText - The concatenated `src/**` scan text.
 * @returns Sorted, deduplicated icon names.
 */
function collectNames(manifestText: string, scanText: string): string[] {
  const names = new Set<string>();
  for (const match of manifestText.matchAll(MANIFEST_NAME)) {
    names.add(match[1]);
  }
  for (const match of scanText.matchAll(SCAN_TAG)) names.add(match[1]);
  for (const match of scanText.matchAll(SCAN_ICON_FIELD)) names.add(match[1]);
  return [...names].sort();
}

// =========================================================================
// Shaping (name → glyph id)
// =========================================================================

/**
 * Shape one icon name with a harfbuzzjs font.
 *
 * @param hb - The harfbuzzjs module.
 * @param font - The harfbuzzjs font to shape with.
 * @param name - The icon ligature name to shape.
 * @returns The resulting glyph ids (expected: exactly one).
 */
function shapeName(hb: typeof Hb, font: Hb.Font, name: string): number[] {
  const buffer = new hb.Buffer();
  buffer.addText(name);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  return buffer.getGlyphInfos().map((info) => info.codepoint);
}

// =========================================================================
// Subsetting (raw hb-subset wasm)
// =========================================================================

/** The hb-subset wasm exports used here (raw C API, no JS glue). */
interface SubsetExports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  hb_blob_create(
    data: number,
    length: number,
    mode: number,
    userData: number,
    destroy: number,
  ): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_data(blob: number, lengthPtr: number): number;
  hb_blob_get_length(blob: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_set_add(set: number, codepoint: number): void;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_input_get_flags(input: number): number;
  hb_subset_input_set_flags(input: number, flags: number): void;
  hb_subset_input_glyph_set(input: number): number;
  hb_subset_input_unicode_set(input: number): number;
  hb_subset_or_fail(face: number, input: number): number;
}

/**
 * Subset an sfnt down to the given glyph ids + the ligature alphabet.
 *
 * @param sfnt - The decompressed source font.
 * @param gids - Glyph ids of every retained icon.
 * @returns The subset sfnt bytes.
 */
async function subsetSfnt(sfnt: Uint8Array, gids: number[]): Promise<Uint8Array> {
  const { instance } = await WebAssembly.instantiate(readFileSync(SUBSET_WASM));
  const hbe = instance.exports as unknown as SubsetExports;
  // The heap view must be re-derived after any allocation — wasm memory
  // may grow, detaching earlier views.
  const heap = () => new Uint8Array(hbe.memory.buffer);

  const sfntPtr = hbe.malloc(sfnt.length);
  heap().set(sfnt, sfntPtr);

  const blob = hbe.hb_blob_create(sfntPtr, sfnt.length, 2, 0, 0);
  const face = hbe.hb_face_create(blob, 0);
  hbe.hb_blob_destroy(blob);

  const input = hbe.hb_subset_input_create_or_fail();
  if (!input) {
    hbe.hb_face_destroy(face);
    hbe.free(sfntPtr);
    throw new Error(`${LOG_PREFIX} hb_subset_input_create_or_fail returned null`);
  }

  const glyphSet = hbe.hb_subset_input_glyph_set(input);
  for (const gid of gids) hbe.hb_set_add(glyphSet, gid);
  const unicodeSet = hbe.hb_subset_input_unicode_set(input);
  for (const char of LIGATURE_ALPHABET) {
    hbe.hb_set_add(unicodeSet, char.codePointAt(0)!);
  }

  const flags = hbe.hb_subset_input_get_flags(input);
  hbe.hb_subset_input_set_flags(
    input,
    flags | SUBSET_FLAG_NO_LAYOUT_CLOSURE | SUBSET_FLAG_NOTDEF_OUTLINE,
  );

  const subsetFace = hbe.hb_subset_or_fail(face, input);
  hbe.hb_subset_input_destroy(input);
  if (!subsetFace) {
    hbe.hb_face_destroy(face);
    hbe.free(sfntPtr);
    throw new Error(`${LOG_PREFIX} hb_subset_or_fail returned null`);
  }

  const resultBlob = hbe.hb_face_reference_blob(subsetFace);
  const dataPtr = hbe.hb_blob_get_data(resultBlob, 0);
  const length = hbe.hb_blob_get_length(resultBlob);
  if (length === 0) {
    hbe.hb_blob_destroy(resultBlob);
    hbe.hb_face_destroy(subsetFace);
    hbe.hb_face_destroy(face);
    hbe.free(sfntPtr);
    throw new Error(`${LOG_PREFIX} subset produced an empty blob`);
  }
  const bytes = new Uint8Array(heap().subarray(dataPtr, dataPtr + length));

  hbe.hb_blob_destroy(resultBlob);
  hbe.hb_face_destroy(subsetFace);
  hbe.hb_face_destroy(face);
  hbe.free(sfntPtr);
  return bytes;
}

// =========================================================================
// Output verification
// =========================================================================

/**
 * Parse the fvar axis tags of an sfnt (table directory only — no
 * font-parsing dependency needed).
 *
 * @param sfnt - The sfnt bytes.
 * @returns The axis tags (e.g. `["FILL", "GRAD", "opsz", "wght"]`).
 */
function readFvarAxes(sfnt: Uint8Array): string[] {
  const view = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength);
  const numTables = view.getUint16(4);
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16;
    const tag = String.fromCharCode(
      sfnt[record],
      sfnt[record + 1],
      sfnt[record + 2],
      sfnt[record + 3],
    );
    if (tag !== "fvar") continue;
    const offset = view.getUint32(record + 8);
    const axisCount = view.getUint16(offset + 8);
    const axisSize = view.getUint16(offset + 10);
    const axes: string[] = [];
    for (let axis = 0; axis < axisCount; axis++) {
      const axisRecord = offset + 16 + axis * axisSize;
      axes.push(
        String.fromCharCode(
          sfnt[axisRecord],
          sfnt[axisRecord + 1],
          sfnt[axisRecord + 2],
          sfnt[axisRecord + 3],
        ),
      );
    }
    return axes;
  }
  return [];
}

/**
 * Verify the subset: every name shapes to exactly one non-notdef glyph,
 * all gids distinct, all four variation axes retained.
 *
 * @param hb - The harfbuzzjs module.
 * @param sfnt - The subset sfnt bytes.
 * @param names - The icon names to verify.
 */
function verifySubset(hb: typeof Hb, sfnt: Uint8Array, names: string[]): void {
  const font = new hb.Font(new hb.Face(new hb.Blob(sfnt)));
  const gids = new Set<number>();
  for (const name of names) {
    const shaped = shapeName(hb, font, name);
    if (shaped.length !== 1 || shaped[0] === 0) {
      throw new Error(
        `${LOG_PREFIX} verification failed: "${name}" shaped to [${shaped}]`,
      );
    }
    gids.add(shaped[0]);
  }
  if (gids.size !== names.length) {
    throw new Error(
      `${LOG_PREFIX} verification failed: ${gids.size} distinct gids for ${names.length} names`,
    );
  }
  const axes = readFvarAxes(sfnt);
  if (axes.length !== 4) {
    throw new Error(
      `${LOG_PREFIX} verification failed: fvar axes = [${axes.join(", ")}]`,
    );
  }
}

// =========================================================================
// Generation
// =========================================================================

/** Render the manifest module for a name set. */
function renderManifest(names: string[]): string {
  const lines = [
    "/**",
    " * Material Symbols icon subset manifest — GENERATED FILE,",
    " * DO NOT EDIT BY HAND.",
    " *",
    " * Regenerated automatically by `build/icon-subset-plugin.ts` (dev-server",
    " * start / save and `pnpm build`).  Source font:",
    " * @fontsource-variable/material-symbols-outlined (latin full-axes woff2,",
    " * subsetted to the names below).",
    " */",
    "",
    "/** Every icon name carried by the committed subset font. */",
    "export const ICON_NAMES = [",
  ];
  lines.push(...names.map((name) => `  "${name}",`));
  lines.push(
    "] as const;",
    "",
    "/** Material Symbols ligature name accepted by `MaterialSymbol`. */",
    "export type IconName = (typeof ICON_NAMES)[number];",
    "",
  );
  return lines.join("\n");
}

/**
 * Run the full pipeline for one name set: decompress → shape → subset →
 * verify → compress.
 *
 * @param names - The icon names to retain.
 * @returns The woff2 bytes.
 */
async function buildFont(names: string[]): Promise<Uint8Array> {
  const hb = await import("harfbuzzjs");
  const { compress, decompress } = await import("woff2-encoder");

  const source = readFileSync(SOURCE_FONT);
  const sfnt = await decompress(source);

  // Shape — the shaping result IS the glyph-id lookup.
  const font = new hb.Font(new hb.Face(new hb.Blob(sfnt)));
  const gids = names.map((name) => shapeName(hb, font, name));
  const failed = names.filter((_, index) => gids[index].length !== 1);
  if (failed.length > 0) {
    throw new Error(
      `${LOG_PREFIX} names missing from the source font: ${failed.join(", ")}`,
    );
  }

  const subset = await subsetSfnt(
    sfnt,
    gids.map((shaped) => shaped[0]),
  );
  verifySubset(hb, subset, names);
  return compress(subset);
}

/**
 * Ensure both artifacts are up to date.  The committed manifest doubles
 * as the name-set marker: when the collected names match it (and the
 * font file exists) nothing is regenerated.
 */
async function ensureArtifacts(): Promise<void> {
  const manifestText = readFileSync(OUT_MANIFEST, "utf-8");
  const names = collectNames(manifestText, readScanText());
  const manifestNames = [...manifestText.matchAll(MANIFEST_NAME)].map(
    (match) => match[1],
  );
  const upToDate =
    existsSync(OUT_FONT) &&
    names.length === manifestNames.length &&
    names.every((name, index) => name === manifestNames[index]);
  if (upToDate) return;

  const woff2 = await buildFont(names);

  // The fonts directory is generated and git-ignored; git tracks no
  // empty directories, so on a fresh checkout it does not exist yet.
  mkdirSync(dirname(OUT_FONT), { recursive: true });

  // Write-if-changed for both artifacts (byte-stable pipeline).
  const currentFont = existsSync(OUT_FONT) ? readFileSync(OUT_FONT) : null;
  if (!currentFont || !currentFont.equals(Buffer.from(woff2))) {
    writeFileSync(OUT_FONT, woff2);
  }
  const nextManifest = renderManifest(names);
  if (nextManifest !== manifestText) {
    writeFileSync(OUT_MANIFEST, nextManifest);
  }
  console.log(
    `${LOG_PREFIX} ${names.length} names · ${woff2.length.toLocaleString("en-US")} bytes (regenerated)`,
  );
}

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin that regenerates the Material Symbols subset font and the
 * icon-name manifest from the names used in `src/`.
 *
 * @returns A Vite plugin object (buildStart + configureServer hooks).
 */
export function iconSubsetPlugin(): Plugin {
  /** Debounce timer for the dev watcher. */
  let timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Run the generation, reporting failures the way the context allows:
   * `buildStart` rejects (fails the build), the watcher logs (keeps the
   * dev server alive).
   *
   * @param failFast - Whether to rethrow the error.
   */
  async function run(failFast: boolean): Promise<void> {
    try {
      await ensureArtifacts();
    } catch (error) {
      if (failFast) throw error;
      console.error(String(error));
    }
  }

  return {
    name: "icon-subset-plugin",
    async buildStart(): Promise<void> {
      await run(true);
    },
    configureServer(server): void {
      const onChange = (file: string): void => {
        if (!/[\\/]src[\\/].*\.(vue|ts)$/.test(file)) return;
        clearTimeout(timer);
        timer = setTimeout(() => void run(false), 400);
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
}
