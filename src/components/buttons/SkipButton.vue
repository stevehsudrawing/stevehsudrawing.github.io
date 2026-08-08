<!--
  SkipButton.vue — "Skip to Content" button for keyboard accessibility.
  Rendered as the first focusable element on every page so keyboard users
  can bypass the navbar and jump directly to <main id="page-content">.
-->
<script setup lang="ts"></script>

<template>
  <a
    id="skip-button"
    href="#page-content"
    class="btn btn-primary"
    role="button"
  >
    {{ $t("text-skip-to-content", "Skip to Content") }}
  </a>
</template>

<style scoped>
#skip-button {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 1100;
}

#skip-button:focus-visible,
html.user-input-keyboard #skip-button:focus {
  position: fixed;
  left: 0.5rem;
  top: 0.5rem;
  width: auto;
  height: auto;
  padding: 0.25rem 0.5rem;
  overflow: visible;
  clip: auto;
}
</style>
