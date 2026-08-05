<!--
  OffcanvasNav.vue -- mobile sidebar navigation.
  Rendered inside AppNavbar.vue; toggled via v-model from the
  parent navbar-toggler button.

  Props:
  - navItems: shared link data from AppNavbar
  - currentPage: for aria-current active highlighting
-->
<script setup lang="ts">
import { watch } from "vue";
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
    :title="$t('text-steve-hsu-s-link-hub', `Steve Hsu's Link-Hub`)"
    :header-close-label="$t('text-close', 'Close')"
  >
    <ul class="navbar-nav mb-3">
      <li v-for="item in navItems" :key="item.href" class="nav-item">
        <a
          class="nav-link internal-link"
          :href="item.href"
          :aria-current="
            currentPage === normalizeInternalPath(item.href)
              ? 'page'
              : undefined
          "
          >{{ $t(item.i18nKey, item.label) }}</a
        >
      </li>
    </ul>
  </BOffcanvas>
</template>
