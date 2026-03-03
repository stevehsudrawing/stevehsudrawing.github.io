function detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();

    // Default: Unknown
    let browser = {
        name: 'unknown',
        version: 0
    };

    // Internet Explorer / Legacy Edge
    if (userAgent.includes('msie') || userAgent.includes('trident/')) {
        browser.name = 'ie';
        const ieMatch = userAgent.match(/(msie |rv:)(\d+(\.\d+)?)/);
        browser.version = ieMatch ? parseFloat(ieMatch[2]) : 0;
        return browser;
    }

    // Chrome / Chromium
    if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
        browser.name = 'chrome';
        const chromeMatch = userAgent.match(/chrome\/(\d+(\.\d+)?)/);
        browser.version = chromeMatch ? parseFloat(chromeMatch[1]) : 0;
        return browser;
    }

    // Firefox
    if (userAgent.includes('firefox')) {
        browser.name = 'firefox';
        const ffMatch = userAgent.match(/firefox\/(\d+(\.\d+)?)/);
        browser.version = ffMatch ? parseFloat(ffMatch[1]) : 0;
        return browser;
    }

    // Chromium Edge
    if (userAgent.includes('edg')) {
        browser.name = 'edge';
        const edgeMatch = userAgent.match(/edg\/(\d+(\.\d+)?)/);
        browser.version = edgeMatch ? parseFloat(edgeMatch[1]) : 0;
        return browser;
    }

    // Safari
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        browser.name = 'safari';
        const safariMatch = userAgent.match(/version\/(\d+(\.\d+)?)/);
        browser.version = safariMatch ? parseFloat(safariMatch[1]) : 0;
        return browser;
    }

    return browser;
}

function isSupported() {
    const browser = detectBrowser();
    const supportMap = {
        ie: false,
        chrome: browser.version >= 60,
        firefox: browser.version >= 60,
        edge: browser.version >= 79,
        safari: browser.version >= 12,
        unknown: false
    };
    return supportMap[browser.name];
}

(function () {
    if (!isSupported()) {
        window.location.href = '/unsupported.html';
        return false;
    }
})();