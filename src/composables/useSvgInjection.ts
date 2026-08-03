/**
 * SVG injection composable — fetches external SVGs and injects them inline.
 *
 * Extracted from InlineSvg.vue (§4.7).  Provides the global document
 * scan that processes all [data-role="svg"] placeholders for build-time
 * injected static HTML outside Vue's render tree.
 */

/**
 * Fetch, process, and inject a single SVG into a placeholder element.
 * @param placeholder — The DOM element to receive the inline SVG.
 * @param svgSrc — URL of the SVG file to fetch.
 * @param width — Optional width override (in px).
 * @param height — Optional height override (in px).
 * @param colorVar — Optional CSS variable name for fill replacement.
 */
export async function injectSVG(
  placeholder: HTMLElement,
  svgSrc: string,
  width?: number,
  height?: number,
  colorVar?: string,
): Promise<void> {
  if (placeholder.querySelector("svg")) return; // already injected

  try {
    const response = await fetch(svgSrc);
    if (!response.ok) {
      console.error(`Failed to load SVG: ${svgSrc} (${response.status})`);
      return;
    }

    let svgText = await response.text();

    if (colorVar) {
      svgText = svgText.replace(
        /fill="currentColor"/g,
        `fill="var(--${colorVar})"`,
      );
    }

    if (width || height) {
      svgText = svgText.replace(
        /<svg /,
        `<svg width="${width ?? ""}" height="${height ?? ""}" `,
      );
    } else {
      svgText = svgText.replace(/<svg /, `<svg `);
    }

    placeholder.innerHTML = svgText;
  } catch (error) {
    console.error(`Failed to inject SVG: ${svgSrc}`, error);
  }
}

/**
 * Scan the document for all [data-role="svg"] placeholders and
 * replace them with inline SVG fetched from data-src.
 */
export async function initSvgInjection(): Promise<void> {
  const placeholders =
    document.querySelectorAll<HTMLElement>('[data-role="svg"]');

  for (const placeholder of placeholders) {
    const src = placeholder.getAttribute("data-src");
    if (!src) continue;

    const w = placeholder.getAttribute("data-width");
    const h = placeholder.getAttribute("data-height");
    const c = placeholder.getAttribute("data-color-var");

    await injectSVG(
      placeholder,
      src,
      w ? Number(w) : undefined,
      h ? Number(h) : undefined,
      c ?? undefined,
    );
  }
}
