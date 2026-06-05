function addSettingEventListeners() {
    document.addEventListener('click', function (e) {
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
    const settingsToggle = document.getElementById('externalLinksNewTabToggle');
    if (settingsToggle) {
        settingsToggle.checked = getExternalLinkNewTabPreference();
        settingsToggle.addEventListener('change', event => {
            const checked = event.target.checked;
            setExternalLinkNewTabPreference(checked);
            applyExternalLinkTargetBehavior();
        });
    }

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLang;
        languageSelect.addEventListener('change', event => {
            const selectedLang = event.target.value;
            loadLang(selectedLang);
        });
    }

    const settingsOpenButtons = document.querySelectorAll('[data-settings-open]');
    settingsOpenButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            const modalElement = document.getElementById('settingsModal');
            if (modalElement) {
                const bootstrapModal = new bootstrap.Modal(modalElement);
                bootstrapModal.show();
            }
        });
    });

    // Clear preferences flow
    const clearBtn = document.getElementById('clearPreferencesBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', event => {
            event.preventDefault();
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
        });
    }

    const confirmClearBtn = document.getElementById('confirmClearPreferencesBtn');
    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', event => {
            // Remove known preference keys
            try {
                localStorage.removeItem('preferredLang');
                localStorage.removeItem('bsTheme');
                localStorage.removeItem('openExternalLinksInNewTab');
            } catch (e) {
                console.warn('Failed to clear some preferences:', e);
            }

            // Close any modal and redirect to homepage
            const warningModalEl = document.getElementById('warningClearingPreferencesModal');
            if (warningModalEl) {
                const m = bootstrap.Modal.getInstance(warningModalEl) || new bootstrap.Modal(warningModalEl);
                m.hide();
            }

            // Redirect to homepage
            window.location.href = '/index.html';
        });
    }

    applyExternalLinkTargetBehavior();
}
