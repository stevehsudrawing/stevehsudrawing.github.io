import plugin from "./commitlint-plugin.js";

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [plugin],
  rules: {
    // One policy for both repositories — the blog carries the same list, so a
    // change here is a change there. `content` marks rendered text or the
    // configs that carry it, not a behavior change; a `.ts` or `.vue` change
    // keeps `feat`, `fix` or `refactor`.
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "content",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
    // The subject is the whole `type(scope): summary` line, which is what this
    // rule counts; the commit-message table names the same 72 columns.
    "header-max-length": [2, "always", 72],
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
