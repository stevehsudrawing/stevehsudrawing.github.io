document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', 'https://stevehsudrawing.github.io/resources/subpages/header.html');
        loadHTML('footer', 'https://stevehsudrawing.github.io/resources/subpages/footer.html');

        const savedLang = localStorage.getItem('preferredLang') || 'en';
        loadLang(savedLang);

        const langToggleBtn = document.getElementById('langToggle');
        langToggleBtn.addEventListener('click', toggleLang);
    } catch {
        console.error('Failed to initialize: ' + error);
    }
})