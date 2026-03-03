document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', 'https://stevehsudrawing.github.io/resources/subpages/header.html');
        await loadHTML('footer', 'https://stevehsudrawing.github.io/resources/subpages/footer.html');

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        loadLang(savedLang);

        // document.getElementById('langToggle').addEventListener('click', toggleLang);
        document.addEventListener('click', function (e) {
            const langItem = e.target.closest('[data-lang]');
            if (langItem) {
                e.preventDefault();
                const selectedLang = langItem.getAttribute('data-lang');
                loadLang(selectedLang);
            }
        })

        document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    } catch {
        console.error('Failed to initialize: ' + error);
    }
})