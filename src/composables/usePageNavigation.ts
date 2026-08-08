/**
 * usePageNavigation — Vue Router guard orchestration.
 *
 * Centralises all router-level side effects so App.vue stays lean:
 * LoadingBar integration, content dimming during navigation,
 * page-title updates, and `?lang=` query-parameter preservation.
 */

import type { Ref } from "vue";
import type { Router } from "vue-router";
import { updatePageTitle } from "../platform/page-title";

/**
 * Install router guards for page-navigation side effects.
 *
 * @param router - The Vue Router instance.
 * @param loadingBarRef - Template ref for the LoadingBar component.
 * @param t - Translation function (from useI18n) for page-title updates.
 */
export function usePageNavigation(
  router: Router,
  loadingBarRef: Ref<{ show: () => void; complete: () => void } | undefined>,
  t: (key: string, fallback?: string) => string,
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
  // ---- Page title ----
  router.afterEach(() => updatePageTitle(t));

  // ---- Preserve ?lang= across navigations ----
  router.beforeEach((to, from) => {
    const langParam = from.query.lang;
    if (langParam && !to.query.lang) {
      return { ...to, query: { ...to.query, lang: langParam } };
    }
    return true;
  });
}
