function addSettingEventListeners() {
    document.addEventListener('change', function (e) {
        // External links new tab toggle
        if (e.target && e.target.id === 'externalLinksNewTabToggle') {
            const checked = e.target.checked;
            setExternalLinkNewTabPreference(checked);
            applyExternalLinkTargetBehavior();
            return;
        }

        // Language select
        if (e.target && e.target.id === 'languageSelect') {
            const selectedLang = e.target.value;
            loadLang(selectedLang);
            return;
        }
    });

    document.addEventListener('click', function (e) {
        // Clear preferences button
        if (e.target && e.target.id === 'clearPreferencesBtn') {
            e.preventDefault();
            const warningModalEl = document.getElementById('warningClearingPreferencesModal');
            if (warningModalEl) {
                warningModalEl.style.zIndex = '1070';
                const warningModal = new bootstrap.Modal(warningModalEl);
                warningModalEl.addEventListener('shown.bs.modal', () => {
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    if (backdrops.length > 0) {
                        backdrops[backdrops.length - 1].style.zIndex = '1060';
                    }
                }, { once: true });
                warningModal.show();
            }
            return;
        }

        // Confirm clear preferences button
        if (e.target && e.target.id === 'confirmClearPreferencesBtn') {
            try {
                localStorage.removeItem('preferredLang');
                localStorage.removeItem('bsTheme');
                localStorage.removeItem('openExternalLinksInNewTab');
            } catch (e) {
                console.warn('Failed to clear some preferences:', e);
            }

            const warningModalEl = document.getElementById('warningClearingPreferencesModal');
            if (warningModalEl) {
                const m = bootstrap.Modal.getInstance(warningModalEl) || new bootstrap.Modal(warningModalEl);
                m.hide();
            }

            window.location.href = '/index.html';
            return;
        }

        const settingsOpenButton = e.target.closest('[data-settings-open]');
        if (settingsOpenButton) {
            e.preventDefault();
            const modalElement = document.getElementById('settingsModal');
            if (modalElement) {
                const bootstrapModal = new bootstrap.Modal(modalElement);
                bootstrapModal.show();
            }
            return;
        }

        const langItem = e.target.closest('[data-lang]');
        if (langItem) {
            e.preventDefault();
            const selectedLang = langItem.getAttribute('data-lang');
            loadLang(selectedLang);
            return;
        }

        const themeItem = e.target.closest('.theme-item');
        if (themeItem) {
            e.preventDefault();
            const selectedTheme = themeItem.getAttribute('data-theme');
            setThemePreference(selectedTheme);
        }
    });
}

function getExternalLinkNewTabPreference() {
    return localStorage.getItem('openExternalLinksInNewTab') === 'true';
}

function setExternalLinkNewTabPreference(enabled) {
    localStorage.setItem('openExternalLinksInNewTab', enabled ? 'true' : 'false');
}

function applyExternalLinkTargetBehavior() {
    const enabled = getExternalLinkNewTabPreference();
    document.querySelectorAll('a.external-link').forEach(link => {
        if (enabled) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        } else {
            if (link.getAttribute('target') === '_blank') {
                link.removeAttribute('target');
            }
            if (link.getAttribute('rel') === 'noopener noreferrer') {
                link.removeAttribute('rel');
            }
        }
    });
}

function initializeSettingsModal() {
    // Prevent duplicate initialization, which can happen after page transitions
    if (document.body.hasAttribute('data-settings-modal-initialized')) {
        // Sync toggle state and apply external link target behavior
        // in case the DOM was recreated after navigation
        const settingsToggle = document.getElementById('externalLinksNewTabToggle');
        if (settingsToggle) {
            settingsToggle.checked = getExternalLinkNewTabPreference();
        }
        applyExternalLinkTargetBehavior();
        return;
    }
    document.body.setAttribute('data-settings-modal-initialized', '');

    // Sync initial values for UI elements (events handled via delegation)
    const settingsToggle = document.getElementById('externalLinksNewTabToggle');
    if (settingsToggle) {
        settingsToggle.checked = getExternalLinkNewTabPreference();
    }

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLang;
    }

    applyExternalLinkTargetBehavior();
}
