<!--
  AppNavbar.vue — fixed-top navigation bar with brand, links, dropdowns.

  Replaces build/page-components/header.html <nav> + ui/navbar.ts + navbar.css.
  One-shot Vue render — no bridge controller.

  Features:
  - Active nav-item highlighting via computed current page
  - <BDropdown> for language + theme (replaces Bootstrap dropdown JS)
  - Mobile brand scroll swap (logo ↔ page name) via @scroll
  - Scroll border via @scroll + :class
-->
<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useTheme } from "../../composables/useTheme";
import { useBreakpoint } from "../../composables/useBreakpoint";
import { useGesture } from "../../composables/useGesture";
import { normalizeInternalPath, extractPageName } from "../../core/utils";
import OffcanvasNav from "./OffcanvasNav.vue";
import InlineSvg from "../ui/InlineSvg.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import { OPEN_SETTINGS_KEY } from "../../types/app";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  currentPage: string;
}>();

// =========================================================================
// Types
// =========================================================================

interface NavItem {
  href: string;
  i18nKey: string;
}

// =========================================================================
// State
// =========================================================================

/** Offcanvas visibility (shared with OffcanvasNav via v-model). */
const showOffcanvas = ref(false);

// Edge-swipe gestures: left-edge right-swipe to open, right-edge left-swipe to close
useGesture(showOffcanvas);

import { LANGUAGE_LIST } from "../../configs/language-list";
import { THEME_OPTIONS } from "../../configs/theme-options";

const navItems: NavItem[] = [
  { href: "/index.html", i18nKey: "text-home" },
  {
    href: "/artworks-and-videos.html",
    i18nKey: "text-artworks-and-videos",
  },
  { href: "/softwares.html", i18nKey: "text-softwares" },
  {
    href: "/blogs-and-sponsor.html",
    i18nKey: "text-blogs-and-sponsor",
  },
  { href: "/chatting.html", i18nKey: "text-chatting" },
  { href: "/about.html", i18nKey: "text-about" },
];

const { t, locale, setLocale } = useI18n();
const { preference, setPreference } = useTheme();

// -------------------------------------------------------------------------
// Active nav item
// -------------------------------------------------------------------------

function isActive(href: string): boolean {
  return props.currentPage === normalizeInternalPath(href);
}

// -------------------------------------------------------------------------
// Scroll state (border + brand slide)
// -------------------------------------------------------------------------

const scrollY = ref(0);

/** Reactive breakpoint (mobile / tablet / desktop) — shared singleton. */
const breakpoint = useBreakpoint();

function onScroll(): void {
  scrollY.value = window.scrollY;
}

let scrollTicking = false;
function throttledScroll(): void {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      onScroll();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}

// -------------------------------------------------------------------------
// Scroll state (border + brand slide)
// -------------------------------------------------------------------------

const scrolled = computed(() => scrollY.value > 0);

// Brand slide progress (0–1 over first 256 px)
const brandProgress = computed(() =>
  Math.min(Math.max(scrollY.value / 256, 0), 1),
);

/** Page name for mobile brand slide. */
const pageI18nKey = computed(
  () => "text-" + extractPageName(props.currentPage),
);
const pageName = computed(() => t(pageI18nKey.value));

// -------------------------------------------------------------------------
// Theme dropdown labels
// -------------------------------------------------------------------------

/** Current language display name (e.g. "English", "中文 (简体)"). */
const currentLanguageName = computed(
  () =>
    LANGUAGE_LIST.find((l) => l.code === locale.value)?.localizedName ??
    locale.value,
);

/** Current theme icon class (reacts to preference change). */
const currentThemeIcon = computed(
  () =>
    THEME_OPTIONS.find((o) => o.value === preference.value)?.icon ??
    "bi-circle-half",
);

/** Current theme display name (reacts to preference change). */
const currentThemeLabel = computed(() => {
  const opt =
    THEME_OPTIONS.find((o) => o.value === preference.value) ?? THEME_OPTIONS[0];
  return t(opt.i18nKey);
});

// =========================================================================
// Inject
// =========================================================================

const openSettings = inject<() => void>(OPEN_SETTINGS_KEY, () => {});

// =========================================================================
// Actions
// =========================================================================

function switchLanguage(lang: string): void {
  setLocale(lang);
}

onMounted(() => {
  window.addEventListener("scroll", throttledScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", throttledScroll);
});

// =========================================================================
// Expose
// =========================================================================

// Expose for legacy consumers via window.__navbar
defineExpose({
  setActiveNavItem() {
    // Handled reactively by isActive() — no-op for bridge compatibility
  },
  updateNavbarBrandText() {
    // Handled reactively by pageName computed — no-op for bridge compatibility
  },
});
</script>

<template>
  <nav
    class="navbar navbar-expand-md fixed-top"
    :class="{ 'navbar-scrolled': scrolled }"
  >
    <div class="container container-fluid navbar-container">
      <!-- ==== Brand ==== -->
      <div id="navbar-brand-container">
        <div
          class="navbar-brand-slide"
          id="navbar-brand-logo-slide"
          :style="
            breakpoint === 'mobile'
              ? { transform: `translateY(-${brandProgress * 100}%)` }
              : {}
          "
        >
          <TypeAwareLink
            type="internal"
            href="/index.html"
            :aria-label="$t('text-homepage-of-steve-hsu-s-link-hub')"
          >
            <InlineSvg
              src="/images/svg/icons/steve-hsu.svg"
              :width="32"
              :height="28"
              color-var="bs-primary"
              class="no-copy"
            />
          </TypeAwareLink>
        </div>
        <div
          class="navbar-brand-slide"
          id="navbar-brand-page-slide"
          :style="
            breakpoint === 'mobile'
              ? {
                  display: 'flex',
                  transform: `translateY(${(1 - brandProgress) * 100}%)`,
                }
              : {}
          "
        >
          <TypeAwareLink href="#page-content" type="anchor" hide-indicator>
            <span class="navbar-brand-text">{{ pageName }}</span>
          </TypeAwareLink>
        </div>
      </div>

      <!-- ==== Toggler ==== -->
      <button
        class="navbar-toggler"
        type="button"
        @click="showOffcanvas = !showOffcanvas"
        :aria-expanded="showOffcanvas"
        :aria-label="$t('text-toggle-navigation')"
      >
        <i class="bi bi-list navbar-toggler-icon-font"></i>
      </button>

      <!-- ==== Desktop nav ==== -->
      <div
        v-if="breakpoint === 'tablet' || breakpoint === 'desktop'"
        class="collapse navbar-collapse d-flex"
        id="navbar-content"
      >
        <ul class="navbar-nav flex-grow-1">
          <li v-for="item in navItems" :key="item.href" class="nav-item">
            <TypeAwareLink
              type="internal"
              :href="item.href"
              class="nav-link"
              :class="{ active: isActive(item.href) }"
              :aria-current="
                props.currentPage === normalizeInternalPath(item.href)
                  ? 'page'
                  : undefined
              "
              >{{ $t(item.i18nKey) }}</TypeAwareLink
            >
          </li>
        </ul>

        <ul class="navbar-nav">
          <!-- Language dropdown -->
          <BDropdown
            id="lang-dropdown"
            :text="locale"
            toggle-class="nav-link"
            menu-class="shadow"
            drop="end"
            boundary="viewport"
          >
            <template #button-content>
              <i class="bi bi-globe2"></i>
              <span class="ms-1 d-none d-sm-inline">{{
                currentLanguageName
              }}</span>
            </template>
            <BDropdownItem
              v-for="lang in LANGUAGE_LIST"
              :key="lang.code"
              :active="locale === lang.code"
              @click="switchLanguage(lang.code)"
            >
              {{ lang.localizedName }}
            </BDropdownItem>
          </BDropdown>

          <!-- Theme dropdown -->
          <BDropdown
            id="theme-dropdown"
            toggle-class="nav-link"
            menu-class="shadow"
            drop="end"
            boundary="viewport"
          >
            <template #button-content>
              <i :class="['bi', currentThemeIcon]"></i>
              <span class="ms-1 d-none d-sm-inline">{{
                currentThemeLabel
              }}</span>
            </template>
            <BDropdownItem
              v-for="opt in THEME_OPTIONS"
              :key="opt.value"
              :active="preference === opt.value"
              @click="setPreference(opt.value)"
            >
              <i :class="['bi', opt.icon, 'me-2']"></i>
              {{ $t(opt.i18nKey) }}
            </BDropdownItem>
          </BDropdown>
        </ul>
      </div>

      <!-- ==== Settings gear (always visible) ==== -->
      <ul class="navbar-nav">
        <li class="nav-item dropdown">
          <a
            class="nav-link"
            href="#"
            :aria-label="$t('text-settings')"
            @click.prevent="openSettings()"
          >
            <i class="bi bi-gear"></i>
          </a>
        </li>
      </ul>
    </div>

    <!-- ==== Mobile offcanvas ==== -->
    <OffcanvasNav
      v-model="showOffcanvas"
      :nav-items="navItems"
      :current-page="props.currentPage"
    />
  </nav>
</template>

<style scoped>
/* ========================================================================
   Navbar - layout, glass effect, brand, offcanvas
   ======================================================================== */

/* --- Base --- */

.navbar {
  height: calc(64px + var(--safe-area-inset-top, 0px));
  background-color: rgba(var(--bs-body-bg-rgb), 0.8);
  backdrop-filter: blur(15px) saturate(1.5);
  box-shadow: 0 0 0 rgba(var(--bs-body-color-rgb), 0);
  padding: 0;
  padding-top: var(--safe-area-inset-top, 0px);
  transition: box-shadow 0.2s ease-in-out;
}

@supports not (backdrop-filter: blur(15px)) {
  .navbar {
    background-color: rgba(var(--bs-body-bg-rgb), 1);
  }
}

.navbar-container {
  height: inherit;
}

.navbar-nav .nav-link.active,
.navbar-nav .nav-link.show {
  font-weight: calc(var(--bs-body-font-weight) + 100);
}

/* --- BDropdown Tweaks --- */

:deep(.dropdown-menu.fade) {
  transition:
    opacity 0.1s linear,
    background-color 0.1s linear,
    backdrop-filter 0.1s linear;
}

/* --- BDropdown toggle buttons look like nav-links, not Bootstrap buttons */
:deep(.dropdown-toggle.btn) {
  --bs-btn-padding-x: var(--bs-nav-link-padding-x, 0);
  --bs-btn-padding-y: var(--bs-nav-link-padding-y, 0);
  --bs-btn-font-size: inherit;
  --bs-btn-font-weight: inherit;
  --bs-btn-line-height: inherit;
  --bs-btn-color: var(--bs-nav-link-color, inherit);
  --bs-btn-bg: transparent;
  --bs-btn-border-width: 0;
  --bs-btn-border-radius: 0;
  --bs-btn-hover-color: var(--bs-nav-link-hover-color, inherit);
  --bs-btn-hover-bg: transparent;
  --bs-btn-hover-border-color: transparent;
  --bs-btn-active-color: var(--bs-nav-link-hover-color, inherit);
  --bs-btn-active-bg: transparent;
  --bs-btn-active-border-color: transparent;
}

.navbar-scrolled {
  box-shadow: 0 1px 0 rgba(var(--bs-body-color-rgb), 0.25);
}

/* --- Brand container --- */

#navbar-brand-container {
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  height: 100%;
}

.navbar-brand-slide {
  height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

#navbar-brand-logo-slide a {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

#navbar-brand-page-slide {
  display: none;
}

#navbar-brand-page-slide a {
  text-decoration: none;
  color: var(--bs-body-color);
}

#navbar-content {
  height: inherit;
}

.navbar-brand-text {
  font-size: 1rem;
  font-weight: calc(var(--bs-body-font-weight) + 100);
  white-space: nowrap;
}

/* --- Mobile (< 768px) --- */

@media (max-width: 767.98px) {
  .navbar .container {
    position: relative;
  }

  #navbar-brand-container {
    display: grid;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    overflow: hidden;
  }

  .navbar-brand-slide {
    grid-area: 1 / 1;
    will-change: transform;
  }

  .navbar-toggler {
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 0;
    padding-right: 0;
    border: none;
    z-index: 2;
  }

  .navbar-toggler-icon-font {
    font-size: 1.25rem;
  }
}

/* --- Tablet & Desktop (>= 768px) --- */

@media (min-width: 768px) {
  .navbar .navbar-collapse {
    flex-wrap: nowrap;
    min-width: 0;
  }

  .navbar .navbar-nav.flex-grow-1 {
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: rgba(128, 128, 128, 0.4) transparent;
    scrollbar-gutter: stable;
  }

  .navbar .navbar-nav.flex-grow-1 .nav-item {
    flex: 0 0 auto;
  }

  .navbar .navbar-nav.flex-grow-1 .nav-link {
    white-space: nowrap;
  }

  .navbar .navbar-nav:not(.flex-grow-1) {
    flex: 0 0 auto;
  }

  @supports not (scrollbar-width: thin) {
    .navbar .navbar-nav.flex-grow-1::-webkit-scrollbar {
      height: 6px;
    }

    .navbar .navbar-nav.flex-grow-1::-webkit-scrollbar-track {
      background: transparent;
    }

    .navbar .navbar-nav.flex-grow-1::-webkit-scrollbar-thumb {
      background: rgba(128, 128, 128, 0.35);
      border-radius: 999px;
    }

    .navbar .navbar-nav.flex-grow-1:hover::-webkit-scrollbar-thumb {
      background: rgba(112, 112, 112, 0.55);
    }
  }
}
</style>
