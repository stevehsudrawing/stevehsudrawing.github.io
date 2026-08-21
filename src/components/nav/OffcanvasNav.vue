<!--
  OffcanvasNav.vue — mobile sidebar navigation.
  Rendered inside AppNavbar.vue; toggled via v-model from the
  parent navbar-toggler button.

  Props:
  - navItems: shared link data from AppNavbar
  - currentPage: for aria-current active highlighting
-->
<script setup lang="ts">
import { watch } from "vue";
import { normalizeInternalPath } from "../../core/utils";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import type { NavItem } from "../../types/app";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  navItems: NavItem[];
  currentPage: string;
}>();

// =========================================================================
// State
// =========================================================================

const model = defineModel<boolean>({ default: false });

// =========================================================================
// Actions
// =========================================================================

/** Close the offcanvas when the user navigates to a different page. */
watch(
  () => props.currentPage,
  () => {
    model.value = false;
  },
);
</script>

<template>
  <BOffcanvas
    v-model="model"
    id="navbar-offcanvas"
    placement="start"
    class="d-lg-none"
    :title="$t('text-steve-hsu-s-link-hub')"
    :header-close-label="$t('text-close')"
  >
    <ul class="navbar-nav mb-3">
      <li
        v-for="item in navItems"
        :key="item.type === 'link' ? item.href : item.i18nKey"
        class="nav-item"
      >
        <TypeAwareLink
          v-if="item.type === 'link'"
          type="internal"
          :href="item.href"
          class="nav-link"
          :class="{
            active: currentPage === normalizeInternalPath(item.href),
          }"
          :aria-current="
            currentPage === normalizeInternalPath(item.href)
              ? 'page'
              : undefined
          "
          >{{ $t(item.i18nKey) }}</TypeAwareLink
        >
        <template v-else>
          <div class="offcanvas-nav-group-label">
            {{ $t(item.i18nKey) }}
          </div>
          <ul class="list-unstyled offcanvas-nav-group">
            <li v-for="child in item.children" :key="child.href">
              <TypeAwareLink
                type="internal"
                :href="child.href"
                class="nav-link"
                :class="{
                  active: currentPage === normalizeInternalPath(child.href),
                }"
                :aria-current="
                  currentPage === normalizeInternalPath(child.href)
                    ? 'page'
                    : undefined
                "
                >{{ $t(child.i18nKey) }}</TypeAwareLink
              >
            </li>
          </ul>
        </template>
      </li>
    </ul>
  </BOffcanvas>
</template>

<style>
.navbar-nav .nav-link.active,
.navbar-nav .nav-link.show {
  font-weight: calc(var(--bs-body-font-weight) + 100);
}

.offcanvas-start {
  width: min(320px, 80vw);
  top: 0;
  bottom: 0;
  height: 100vh;
  max-height: 100vh;
}

@supports not (width: min(320px, 80vw)) {
  .offcanvas-start {
    width: 320px;
  }
}

.offcanvas.show {
  height: 100vh;
  max-height: 100vh;
}

.offcanvas-body {
  padding-top: 0;
}

.offcanvas-body .navbar-nav .nav-item {
  width: 100%;
}

.offcanvas-body .nav-link {
  padding-left: 0;
  text-align: left;
  justify-content: flex-start;
}

/* --- Dropdown group (mobile) --- */

.offcanvas-nav-group-label {
  padding: 1rem 0 0.25rem;
  font-size: 0.8rem;
  font-weight: calc(var(--bs-body-font-weight) + 100);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.6;
}

.offcanvas-nav-group {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
