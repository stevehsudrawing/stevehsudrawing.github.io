/**
 * HTML component loader.
 * Fetches and injects sub-page HTML fragments (header, footer, etc.)
 * into placeholder elements marked with data-role="page-component".
 * Component name is read from the data-component-name attribute.
 */

/**
 * Load a single component by injecting fetched HTML into its placeholder.
 * The HTML file path is derived as: /page-components/{name}.html
 * @param {HTMLElement} placeholder - The placeholder element to inject into.
 * @param {string} name - The component name (matches the HTML file name).
 * @returns {Promise<void>}
 */
export function loadHTML(placeholder, name) {
    return new Promise(async (resolve, reject) => {
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
    })
}

/**
 * Load all components marked with data-role="page-component".
 * The HTML file path for each component is derived from its
 * data-component-name attribute: /page-components/{name}.html
 * @returns {Promise<void>}
 */
export async function loadAllComponents() {
    const components = document.querySelectorAll('[data-role="page-component"]');
    const tasks = [];
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
 * @param {string} name - The component name (matches the HTML file name).
 * @returns {Promise<void>}
 */
export async function reloadComponent(name) {
    const el = document.querySelector('[data-component-name="' + name + '"]');
    if (el) {
        el.innerHTML = '';
        await loadHTML(el, name);
    }
}
