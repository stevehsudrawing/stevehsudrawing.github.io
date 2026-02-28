async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load: ${response.status}`);
        }
        const htmlContent = await response.text();
        document.getElementById(elementId).innerHTML = htmlContent;
    } catch (error) {
        console.error('Failed to load:', error);
        document.getElementById(elementId).innerHTML = '<div class="alert alert-warning">Failed to load sub-page to "' + elementId + '"</div>';
    }
}