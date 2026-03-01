document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', 'https://stevehsudrawing.github.io/resources/subpages/header.html');
        await loadHTML('footer', 'https://stevehsudrawing.github.io/resources/subpages/footer.html');

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        loadLang(savedLang);

        document.getElementById('langToggle').addEventListener('click', toggleLang);
        document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    } catch {
        console.error('Failed to initialize: ' + error);
    }
})