/**
 * useGithubEventsModal — opener for the GitHub events modal.
 *
 * Pushes `GithubEventsModal` (stack id `github-events`) with a filtered,
 * reverse-chronological event list — the activity card's chart-click
 * entry point.
 *
 * @example
 * const { openGithubEventsModal } = useGithubEventsModal();
 * openGithubEventsModal({ title, events: filtered });
 */

import type { GithubEventsModalProps } from "../types/app";
import { useModalStack } from "./useModalStack";

/**
 * Events-modal opener.
 *
 * @returns `openGithubEventsModal(props)` — pushes the events modal.
 */
export function useGithubEventsModal(): {
  /** Push the events modal with the filtered list + its title. */
  openGithubEventsModal: (props: GithubEventsModalProps) => void;
} {
  const { push } = useModalStack();

  function openGithubEventsModal(props: GithubEventsModalProps): void {
    push({ id: "github-events", props });
  }

  return { openGithubEventsModal };
}
