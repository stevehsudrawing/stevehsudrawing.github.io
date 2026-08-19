/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Multi-line commit descriptions render as the "Description" section on
    // GitHub. Lift the conventional default 100-char limits so longer
    // subject lines and body lines pass the commit-msg hook.
    "header-max-length": [2, "always", 200],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
