<!--
  LoadingPlaceholder.vue — Centered loading spinner, error icon,
  or empty-state icon with a label shown below.  Used inside card
  shells so the card layout (h-100, borders) remains stable.
-->
<script setup lang="ts">
// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** Display text below the icon. */
  label: string;
  /** "loading" → spinner, "error" → x-circle, "empty" → slash-circle. */
  state: "loading" | "error" | "empty";
  /** Detail text shown below the label (error / empty states only). */
  errorMessage?: string;
  /** Detail text shown below the label (empty state only). */
  emptyMessage?: string;
}>();
</script>

<template>
  <div
    class="loading-placeholder d-flex flex-column align-items-center justify-content-center flex-grow-1 text-body-secondary py-4"
  >
    <!-- Spinner -->
    <div
      v-if="state === 'loading'"
      class="spinner-border text-primary mb-2"
      role="status"
    >
      <span class="visually-hidden">{{ label }}</span>
    </div>

    <!-- Error icon -->
    <i
      v-else-if="state === 'error'"
      class="bi bi-x-circle-fill text-danger mb-1 fs-3"
    ></i>

    <!-- Empty icon -->
    <i v-else class="bi bi-slash-circle text-body-secondary mb-1 fs-3"></i>

    <span class="small fw-semibold">{{ label }}</span>
    <span
      v-if="state === 'error' && errorMessage"
      class="small text-center px-2"
    >
      {{ errorMessage }}
    </span>
    <span
      v-if="state === 'empty' && emptyMessage"
      class="small text-center px-2"
    >
      {{ emptyMessage }}
    </span>
  </div>
</template>
