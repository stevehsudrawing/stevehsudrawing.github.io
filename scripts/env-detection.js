var isEnvSupported = isBrowserSupported();

if (!isEnvSupported) {
    window.location.href = '/unsupported.html';
}