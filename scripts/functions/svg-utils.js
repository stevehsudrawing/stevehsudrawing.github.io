/**
 * SVG injection module.
 * Replaces elements with data-role="svg" with inline SVG fetched
 * from files, applying dynamic dimensions and color via CSS
 * custom properties.
 */

/**
 * Initialize SVG injection for elements with data-role="svg".
 * Fetches the SVG file specified by data-src, replaces
 * fill="currentColor" with the CSS variable specified by
 * data-color-var, sets width/height from data-width/data-height,
 * and injects the result as innerHTML.
 */
async function initSvgInjection() {
    const placeholders = document.querySelectorAll('[data-role="svg"]');

    for (const placeholder of placeholders) {
        // Skip if already injected (contains an <svg> child)
        if (placeholder.querySelector('svg')) continue;

        const svgSrc = placeholder.getAttribute('data-src');
        if (!svgSrc) continue;

        try {
            const response = await fetch(svgSrc);
            if (!response.ok) {
                console.error(`Failed to load SVG: ${svgSrc} (${response.status})`);
                continue;
            }

            let svgText = await response.text();

            // Replace fill="currentColor" with the specified CSS variable
            const colorVar = placeholder.getAttribute('data-color-var');
            if (colorVar) {
                svgText = svgText.replace(
                    /fill="currentColor"/g,
                    `fill="var(--${colorVar})"`
                );
            }

            // Set width and height from data attributes (default to px)
            const width = placeholder.getAttribute('data-width');
            const height = placeholder.getAttribute('data-height');
            if (width || height) {
                svgText = svgText.replace(
                    /<svg /,
                    `<svg width="${width || ''}" height="${height || ''}" `
                );
            }

            placeholder.innerHTML = svgText;
        } catch (error) {
            console.error(`Failed to inject SVG: ${svgSrc}`, error);
        }
    }
}
