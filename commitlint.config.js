import plugin from "./commitlint-plugin.js";

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [plugin],
  rules: {
    // The project's commit-message shape: a conventional subject, then a body
    // of at most three non-empty lines of at most 80 columns. Footers are
    // exempt — GitHub renders them apart from the description. The body line
    // count is this repository's own rule (commitlint-plugin.js), because no
    // shareable config counts lines.
    "body-max-lines": [2, "always", 3],
    "body-max-line-length": [2, "always", 80],
    "footer-max-line-length": [0],
  },
};
