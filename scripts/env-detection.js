var isEnvSupported = isBrowserSupported();

if (!isEnvSupported) {
    window.location.href = '/error-unsupported-browser.html';
}