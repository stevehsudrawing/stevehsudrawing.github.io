/**
 * Browser support detection via feature testing.
 * Uses feature detection (ES modules) rather than UA string
 * parsing, which is inherently fragile. Crawlers are whitelisted by UA
 * to prevent SEO-impacting false negatives.
 * Written in ES5 for compatibility with older browsers.
 * This file belongs to scripts/env-detections/ which uses ES5.
 */

/**
 * ES5-compatible string inclusion check (no String.prototype.includes).
 * @param {string} str - The string to search within.
 * @param {string} subStr - The substring to look for.
 * @returns {boolean} True if subStr is found in str.
 */
function isStringIncludes(str, subStr) {
  return str.indexOf(subStr) != -1;
}

/**
 * Check whether the user agent belongs to a known search engine bot, crawler, or SEO tool.
 * These are always treated as supported so that SEO crawlers are never redirected.
 * @returns {boolean} True if the UA appears to be a bot or crawler.
 */
function isBotOrCrawler() {
  var userAgent = navigator.userAgent.toLowerCase();

  // Known search engine and SEO tool bots
  var knownBots = [
    "googlebot",
    "adsbot-google",
    "google-other",
    "google-extended",
    "bingbot",
    "msnbot",
    "bingpreview",
    "baiduspider",
    "yandexbot",
    "yandex",
    "duckduckbot",
    "slurp", // Yahoo
    "facebookexternalhit",
    "facebookcatalog",
    "twitterbot",
    "linkedinbot",
    "discordbot",
    "applebot",
    "petalbot", // Huawei
    "sogou",
    "360spider",
    "bytespider", // ByteDance
    "ahrefsbot",
    "semrushbot",
    "dotbot",
    "rogerbot", // Moz
    "mj12bot", // Majestic
    "sitebulb",
    "seobility",
    "screaming frog",
    "gptbot", // OpenAI
    "claudebot", // Anthropic
    "perplexitybot",
    "deepseekbot",
  ];
  for (var i = 0; i < knownBots.length; i++) {
    if (isStringIncludes(userAgent, knownBots[i])) return true;
  }

  // Generic crawler pattern fallback
  if (
    isStringIncludes(userAgent, "bot") ||
    isStringIncludes(userAgent, "crawler") ||
    isStringIncludes(userAgent, "spider") ||
    isStringIncludes(userAgent, "scraper")
  ) {
    return true;
  }

  return false;
}

/**
 * Test whether the browser's JavaScript engine supports ES modules.
 * Creates a script element and checks for the noModule property -
 * browsers that support ES modules expose `noModule` on HTMLScriptElement.
 * @returns {boolean} True if ES modules are supported.
 */
function isFeatureSupported() {
  try {
    var script = document.createElement('script');
    return 'noModule' in script;
  } catch (e) {
    return false;
  }
}

/**
 * Check whether the browser is supported.
 * Crawlers always pass. For real users, the JS engine must support
 * ES modules - the feature that currently constrains our baseline.
 * @returns {boolean} True if the browser is supported.
 */
function isBrowserSupported() {
  // Search engine bots and crawlers are always treated as supported
  if (isBotOrCrawler()) return true;

  return isFeatureSupported();
}

var isEnvSupported = isBrowserSupported();

if (!isEnvSupported) {
  window.location.href = "/error-unsupported-browser.html";
}
