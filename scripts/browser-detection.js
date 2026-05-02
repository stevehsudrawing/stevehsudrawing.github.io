// Some old browser doesn't support 'String.prototype.includes()'
function isStringIncludes(str, subStr) {
    if (str.indexOf(subStr) != -1) return true;
    else return false;
}

function detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    // Default: Unknown
    let browser = {
        name: 'unknown',
        version: 0
    };
    // New Opera
    if (isStringIncludes(userAgent, 'opr/')) {
        browser.name = 'opera';
        const operaMatch = userAgent.match(/opr\/(\d+(\.\d+)?)/);
        browser.version = operaMatch ? parseFloat(operaMatch[1]) : 0;
        return browser;
    }
    // Old Opera
    if (isStringIncludes(userAgent, 'opera') || isStringIncludes(userAgent, 'op/')) {
        browser.name = 'opera';
        const operaMatch = userAgent.match(/(opera |op\/)(\d+(\.\d+)?)/);
        browser.version = operaMatch ? parseFloat(operaMatch[2]) : 0;
        return browser;
    }
    // Internet Explorer / Legacy Edge
    if (isStringIncludes(userAgent, 'msie') || isStringIncludes(userAgent, 'trident/')) {
        browser.name = 'ie';
        const ieMatch = userAgent.match(/(msie |rv:)(\d+(\.\d+)?)/);
        browser.version = ieMatch ? parseFloat(ieMatch[2]) : 0;
        return browser;
    }
    // Chrome / Chromium
    if (isStringIncludes(userAgent, 'chrome') && !isStringIncludes(userAgent, 'edge') && !isStringIncludes(userAgent, 'opr')) {
        browser.name = 'chrome';
        const chromeMatch = userAgent.match(/chrome\/(\d+(\.\d+)?)/);
        browser.version = chromeMatch ? parseFloat(chromeMatch[1]) : 0;
        return browser;
    }
    // Firefox
    if (isStringIncludes(userAgent, 'firefox')) {
        browser.name = 'firefox';
        const ffMatch = userAgent.match(/firefox\/(\d+(\.\d+)?)/);
        browser.version = ffMatch ? parseFloat(ffMatch[1]) : 0;
        return browser;
    }
    // Chromium Edge
    if (isStringIncludes(userAgent, 'edg')) {
        browser.name = 'edge';
        const edgeMatch = userAgent.match(/edg\/(\d+(\.\d+)?)/);
        browser.version = edgeMatch ? parseFloat(edgeMatch[1]) : 0;
        return browser;
    }
    // Safari
    if (isStringIncludes(userAgent, 'safari') && !isStringIncludes(userAgent, 'chrome')) {
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
        opera: browser.version >= 47,
        unknown: false
    };
    return supportMap[browser.name];
}

(function () {
    if (!isSupported()) {
        window.location.href = 'https://stevehsudrawing.github.io/unsupported.html';
        return false;
    }
})();
