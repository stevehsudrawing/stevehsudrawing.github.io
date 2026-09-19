/**
 * Commit-message resolver — splits a raw GitHub commit message into
 * its title (first line) and body (everything after it).
 *
 * Pure logic (no DOM, no Vue), shared by the site changelog modal;
 * the body is fed to `markdownToHast()` for rendering.
 */

/** A commit message split into its title and body. */
export interface CommitMessageParts {
  /** First line of the message (e.g. "feat(gallery): ..."). */
  title: string;
  /** The remainder of the message, trimmed ("" when absent). */
  body: string;
}

/**
 * Split a raw commit message into title and body.
 *
 * @param message - Raw `commit.message` from the GitHub API.
 * @returns {@link CommitMessageParts} — the title is always the first
 *          line; a one-line message (e.g. a merge commit) yields an
 *          empty body.
 */
export function splitCommitMessage(message: string): CommitMessageParts {
  const newline = message.indexOf("\n");
  if (newline === -1) return { title: message.trim(), body: "" };
  return {
    title: message.slice(0, newline).trim(),
    body: message.slice(newline + 1).trim(),
  };
}
