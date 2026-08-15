/**
 * Browser support detection via feature testing.
 * Uses feature detection (ES modules, WebP) rather than UA string
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
    "360spider",
    "adsbot-google",
    "ahrefsbot",
    "applebot",
    "baiduspider",
    "bingbot",
    "bingpreview",
    "bytespider", // ByteDance
    "claudebot", // Anthropic
    "deepseekbot",
    "discordbot",
    "dotbot",
    "duckduckbot",
    "facebookcatalog",
    "facebookexternalhit",
    "google-extended",
    "google-other",
    "googlebot",
    "gptbot", // OpenAI
    "linkedinbot",
    "mj12bot", // Majestic
    "msnbot",
    "perplexitybot",
    "petalbot", // Huawei
    "rogerbot", // Moz
    "screaming frog",
    "semrushbot",
    "seobility",
    "sitebulb",
    "slurp", // Yahoo
    "sogou",
    "twitterbot",
    "yandex",
    "yandexbot",
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
function isESModuleSupported() {
  try {
    var script = document.createElement("script");
    return "noModule" in script;
  } catch (e) {
    return false;
  }
}

/**
 * Test whether the browser supports the WebP image format.
 * Uses canvas.toDataURL('image/webp') - browsers without WebP
 * encoding support fall back to PNG, so the result will start
 * with "data:image/png" instead of "data:image/webp".
 * @returns {boolean} True if WebP is supported.
 */
function isWebPSupported() {
  try {
    var canvas = document.createElement("canvas");
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch (e) {
    return false;
  }
}

/**
 * Check whether the environment is supported.
 * Crawlers always pass. For real users, the JS engine must support
 * both ES modules and WebP - the features that currently constrain
 * our baseline.
 * @returns {boolean} True if the environment is supported.
 */
function isEnvSupported() {
  // Search engine bots and crawlers are always treated as supported
  if (isBotOrCrawler()) return true;

  return isESModuleSupported() && isWebPSupported();
}

if (!isEnvSupported()) {
  window.location.href = "/error-unsupported-browser.html";
}
