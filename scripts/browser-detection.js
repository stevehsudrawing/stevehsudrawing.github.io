// Some old browser doesn't support 'String.prototype.includes()'
function isStringIncludes(str, subStr) {
    if (str.indexOf(subStr) != -1) return true;
    else return false;
}

// Some old browser even doesn't support `const` and `let`
function detectBrowser() {
    var userAgent = navigator.userAgent.toLowerCase();
    // Default: Unknown
    var browser = {
        name: 'unknown',
        version: 0
    };
    // New Opera
    if (isStringIncludes(userAgent, 'opr/')) {
        browser.name = 'opera';
        var operaMatch = userAgent.match(/opr\/(\d+(\.\d+)?)/);
        browser.version = operaMatch ? parseFloat(operaMatch[1]) : 0;
        return browser;
    }
    // Old Opera
    if (isStringIncludes(userAgent, 'opera') || isStringIncludes(userAgent, 'op/')) {
        browser.name = 'opera';
        var operaMatch = userAgent.match(/(opera |op\/)(\d+(\.\d+)?)/);
        browser.version = operaMatch ? parseFloat(operaMatch[2]) : 0;
        return browser;
    }
    // Internet Explorer / Legacy Edge
    if (isStringIncludes(userAgent, 'msie') || isStringIncludes(userAgent, 'trident/')) {
        browser.name = 'ie';
        var ieMatch = userAgent.match(/(msie |rv:)(\d+(\.\d+)?)/);
        browser.version = ieMatch ? parseFloat(ieMatch[2]) : 0;
        return browser;
    }
    // Chrome / Chromium
    if (isStringIncludes(userAgent, 'chrome') && !isStringIncludes(userAgent, 'edge') && !isStringIncludes(userAgent, 'opr')) {
        browser.name = 'chrome';
        var chromeMatch = userAgent.match(/chrome\/(\d+(\.\d+)?)/);
        browser.version = chromeMatch ? parseFloat(chromeMatch[1]) : 0;
        return browser;
    }
    // Firefox
    if (isStringIncludes(userAgent, 'firefox')) {
        browser.name = 'firefox';
        var ffMatch = userAgent.match(/firefox\/(\d+(\.\d+)?)/);
        browser.version = ffMatch ? parseFloat(ffMatch[1]) : 0;
        return browser;
    }
    // Chromium Edge
    if (isStringIncludes(userAgent, 'edg')) {
        browser.name = 'edge';
        var edgeMatch = userAgent.match(/edg\/(\d+(\.\d+)?)/);
        browser.version = edgeMatch ? parseFloat(edgeMatch[1]) : 0;
        return browser;
    }
    // Safari
    if (isStringIncludes(userAgent, 'safari') && !isStringIncludes(userAgent, 'chrome')) {
        browser.name = 'safari';
        var safariMatch = userAgent.match(/version\/(\d+(\.\d+)?)/);
        browser.version = safariMatch ? parseFloat(safariMatch[1]) : 0;
        return browser;
    }
    return browser;
}

function isSupported() {
    var browser = detectBrowser();
    var supportMap = {
        ie: false,
        chrome: browser.version >= 80,
        firefox: browser.version >= 78,
        edge: browser.version >= 80,
        opera: browser.version >= 67,
        safari: browser.version >= 13,
        unknown: false
    };
    return supportMap[browser.name];
}

function checkBrowserSupport() {
    if (!isSupported()) {
        window.location.href = '/unsupported.html';
        return false;
    }
    return true;
}

checkBrowserSupport();
