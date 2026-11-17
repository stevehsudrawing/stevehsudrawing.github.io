/**
 * @typedef {object} ParsedCommit
 * @property {string | null} body - The commit body, `null` when absent.
 */

/**
 * The commitlint rule signature this plugin's rules implement.
 *
 * @typedef {(
 *   commit: ParsedCommit,
 *   when?: 'always' | 'never',
 *   value?: number,
 * ) => [boolean, string]} Rule
 */

/**
 * Custom commitlint rules, loaded by `commitlint.config.js`.
 *
 * @type {{ rules: Record<string, Rule> }}
 */
const plugin = {
  rules: {
    /**
     * Reports whether the body fits within `value` non-empty lines.
     *
     * @param {ParsedCommit} commit - The parsed commit.
     * @param {'always' | 'never'} when - The rule's polarity.
     * @param {number} value - The maximum number of non-empty body lines.
     * @returns {[boolean, string]} The result and its message.
     */
    "body-max-lines": ({ body }, when = "always", value = 3) => {
      // A commit with no body parses as `null`, not as "".
      const lines = (body ?? "")
        .split("\n")
        .filter((line) => line.trim() !== "").length;
      const valid = when === "never" ? lines > value : lines <= value;
      return [valid, `body must not exceed ${value} lines`];
    },
  },
};

export default plugin;
