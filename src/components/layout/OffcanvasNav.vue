<!--
  OffcanvasNav.vue -- mobile sidebar navigation.
  Rendered inside AppNavbar.vue; toggled via
  data-bs-toggle="offcanvas" + data-bs-target="#navbar-offcanvas".

  Props:
  - navItems: shared link data from AppNavbar
-->
<script setup lang="ts">
import { normalizeInternalPath } from "../../core/utils";

// =========================================================================
// Types
// =========================================================================

interface NavItem {
  href: string;
  i18nKey: string;
  label: string;
}

// =========================================================================
// Props
// =========================================================================

defineProps<{
  navItems: NavItem[];
  currentPage: string;
}>();
</script>

<template>
  <div
    class="offcanvas offcanvas-start d-lg-none"
    tabindex="-1"
    id="navbar-offcanvas"
    aria-labelledby="navbar-offcanvas-label"
  >
    <div class="offcanvas-header">
      <span class="h5 offcanvas-title" id="navbar-offcanvas-label">
        <span data-i18n="text-steve-hsu-s-link-hub">Steve Hsu's Link-Hub</span>
      </span>
      <button
        type="button"
        class="btn-close text-reset"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
        data-i18n-aria-label="text-close"
      ></button>
    </div>
    <div class="offcanvas-body">
      <ul class="navbar-nav mb-3">
        <li v-for="item in navItems" :key="item.href" class="nav-item">
          <a
            class="nav-link internal-link"
            :href="item.href"
            :data-i18n="item.i18nKey"
            :aria-current="
              currentPage === normalizeInternalPath(item.href)
                ? 'page'
                : undefined
            "
            >{{ item.label }}</a
          >
        </li>
      </ul>
    </div>
  </div>
</template>
