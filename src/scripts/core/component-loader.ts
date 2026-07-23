/**
 * HTML component loader.
 * Fetches and injects sub-page HTML fragments (header, footer, etc.)
 * into placeholder elements marked with data-role="page-component".
 * Component name is read from the data-component-name attribute.
 */

/**
 * Load a single component by injecting fetched HTML into its placeholder.
 * The HTML file path is derived as: /page-components/{name}.html
 * @param placeholder - The placeholder element to inject into.
 * @param name - The component name (matches the HTML file name).
 */
export function loadHTML(placeholder: HTMLElement, name: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const response = await fetch('/page-components/' + name + '.html');
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            const htmlContent = await response.text();
            placeholder.innerHTML = htmlContent;
            resolve();
        } catch (error) {
            console.error('Failed to load:', error);
            placeholder.innerHTML = '<div class="alert alert-warning">Failed to load "' + name + '"</div>';
            reject(error);
        }
    });
}

/**
 * Load all components marked with data-role="page-component".
 * The HTML file path for each component is derived from its
 * data-component-name attribute: /page-components/{name}.html
 */
export async function loadAllComponents(): Promise<void> {
    const components = document.querySelectorAll<HTMLElement>('[data-role="page-component"]');
    const tasks: Promise<void>[] = [];
    components.forEach(el => {
        const name = el.getAttribute('data-component-name');
        if (name) {
            tasks.push(loadHTML(el, name));
        }
    });
    await Promise.all(tasks);
}

/**
 * Reload a single component by its name. Only works for elements
 * that have the data-role="page-component" attribute.
 * @param name - The component name (matches the HTML file name).
 */
export async function reloadComponent(name: string): Promise<void> {
    const el = document.querySelector<HTMLElement>('[data-component-name="' + name + '"]');
    if (el) {
        el.innerHTML = '';
        await loadHTML(el, name);
    }
}
