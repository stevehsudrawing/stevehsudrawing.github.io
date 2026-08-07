/**
 * usePageNavigation — Vue Router guard orchestration.
 *
 * Centralises all router-level side effects so App.vue stays lean:
 * LoadingBar integration, content dimming during navigation,
 * external-link indicator injection, page-title updates, and
 * `?lang=` query-parameter preservation.
 */

import { nextTick, type Ref } from "vue";
import type { Router } from "vue-router";
import { addAllExternalLinkIndicators } from "../ui/accessibility";
import { updatePageTitle } from "../ui/page-title";

/**
 * Install router guards for page-navigation side effects.
 *
 * @param router - The Vue Router instance.
 * @param loadingBarRef - Template ref for the LoadingBar component.
 */
export function usePageNavigation(
  router: Router,
  loadingBarRef: Ref<{ show: () => void; complete: () => void } | undefined>,
): void {
  // ---- LoadingBar ----
  router.beforeEach(() => loadingBarRef.value?.show());
  router.afterEach(() => loadingBarRef.value?.complete());

  // ---- Content dimming ----
  let initialNavigationDone = false;
  router.beforeEach(() => {
    if (initialNavigationDone) {
      document.getElementById("page-content")?.classList.add("content-dimming");
    }
  });
  router.afterEach(() => {
    if (initialNavigationDone) {
      document
        .getElementById("page-content")
        ?.classList.remove("content-dimming");
    }
    initialNavigationDone = true;
  });

  // ---- External link indicators ----
  router.afterEach(async () => {
    await nextTick();
    addAllExternalLinkIndicators();
  });

  // ---- Page title ----
  router.afterEach(() => updatePageTitle());

  // ---- Preserve ?lang= across navigations ----
  router.beforeEach((to, from) => {
    const langParam = from.query.lang;
    if (langParam && !to.query.lang) {
      return { ...to, query: { ...to.query, lang: langParam } };
    }
    return true;
  });
}
