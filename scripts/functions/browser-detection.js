/**
 * Browser detection and support check script.
 * Written in ES5 for compatibility with older browsers.
 */

/**
 * ES5-compatible string inclusion check (no String.prototype.includes).
 * @param {string} str - The string to search within.
 * @param {string} subStr - The substring to look for.
 * @returns {boolean} True if subStr is found in str.
 */
function isStringIncludes(str, subStr) {
    return (str.indexOf(subStr) != -1);
}

/**
 * Detect the user's browser name and version from the user agent string.
 * @returns {{name: string, version: number}} An object with browser name and version.
 */
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
    // Chromium Edge (must precede Chrome — Edg/ UA also contains "Chrome/")
    if (isStringIncludes(userAgent, 'edg')) {
        browser.name = 'edge';
        var edgeMatch = userAgent.match(/edg[a-z]*\/(\d+(\.\d+)?)/);
        browser.version = edgeMatch ? parseFloat(edgeMatch[1]) : 0;
        return browser;
    }
    // Chrome / Chromium
    if (isStringIncludes(userAgent, 'chrome') && !isStringIncludes(userAgent, 'opr')) {
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
    // Safari
    if (isStringIncludes(userAgent, 'safari') && !isStringIncludes(userAgent, 'chrome')) {
        browser.name = 'safari';
        var safariMatch = userAgent.match(/version\/(\d+(\.\d+)?)/);
        browser.version = safariMatch ? parseFloat(safariMatch[1]) : 0;
        return browser;
    }
    return browser;
}

/**
 * Check whether the user agent belongs to a known search engine bot, crawler, or SEO tool.
 * These should always be treated as supported regardless of browser detection result.
 * @returns {boolean} True if the UA appears to be a bot or crawler.
 */
function isBotOrCrawler() {
    var userAgent = navigator.userAgent.toLowerCase();

    // Known search engine and SEO tool bots
    var knownBots = [
        'googlebot', 'adsbot-google', 'google-other', 'google-extended',
        'bingbot', 'msnbot', 'bingpreview',
        'baiduspider',
        'yandexbot', 'yandex',
        'duckduckbot',
        'slurp', // Yahoo
        'facebookexternalhit', 'facebookcatalog',
        'twitterbot',
        'linkedinbot',
        'discordbot',
        'applebot',
        'petalbot', // Huawei
        'sogou',
        '360spider',
        'bytespider', // ByteDance
        'ahrefsbot',
        'semrushbot',
        'dotbot', 'rogerbot', // Moz
        'mj12bot', // Majestic
        'sitebulb',
        'seobility',
        'screaming frog',
        'gptbot', // OpenAI
        'claudebot', // Anthropic
        'perplexitybot',
        'deepseekbot'
    ];
    for (var i = 0; i < knownBots.length; i++) {
        if (isStringIncludes(userAgent, knownBots[i])) return true;
    }

    // Generic crawler pattern fallback
    if (isStringIncludes(userAgent, 'bot')
        || isStringIncludes(userAgent, 'crawler')
        || isStringIncludes(userAgent, 'spider')
        || isStringIncludes(userAgent, 'scraper')
    ) {
        return true;
    }

    return false;
}

/**
 * Check whether the detected browser meets minimum version requirements.
 * @returns {boolean} True if the browser is supported.
 */
function isBrowserSupported() {
    // Search engine bots and crawlers are always treated as supported
    if (isBotOrCrawler()) return true;

    var browser = detectBrowser();
    var supportMap = {
        ie: false,
        chrome: browser.version >= 66,
        edge: browser.version >= 79,
        firefox: browser.version >= 65,
        opera: browser.version >= 53,
        safari: browser.version >= 14,
        unknown: false
    };
    return supportMap[browser.name];
}
