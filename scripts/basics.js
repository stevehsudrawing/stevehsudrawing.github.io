/**
 * Load a single component by its container element id.
 * The HTML file path is derived as: /sub-pages/{id}.html
 */
function loadHTML(elementId, filePath) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            const htmlContent = await response.text();
            const placeholder = document.getElementById(elementId);
            if (!placeholder) {
                throw new Error(`Cannot find ${elementId} element.`);
            }
            placeholder.innerHTML = htmlContent;
            resolve();
        } catch (error) {
            console.error('Failed to load:', error);
            const placeholder = document.getElementById(elementId);
            if (placeholder) {
                placeholder.innerHTML = '<div class="alert alert-warning">Failed to load "' + elementId + '"</div>';
            }
            reject(error);
        }
    })
}

/**
 * Load all components marked with data-component attribute.
 * The HTML file path for each component is derived as: /sub-pages/{id}.html
 * where {id} is the element's id attribute.
 */
async function loadAllComponents() {
    const components = document.querySelectorAll('[data-component]');
    const tasks = [];
    components.forEach(el => {
        const id = el.id;
        if (id) {
            tasks.push(loadHTML(id, '/sub-pages/' + id + '.html'));
        }
    });
    await Promise.all(tasks);
}

/**
 * Reload a single component by its id. Only works for elements
 * that have the data-component attribute.
 */
async function reloadComponent(id) {
    const el = document.getElementById(id);
    if (el && el.hasAttribute('data-component')) {
        await loadHTML(id, '/sub-pages/' + id + '.html');
    }
}
