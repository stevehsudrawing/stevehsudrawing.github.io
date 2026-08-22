<!--
  TypeAwareImage.vue — Type-aware image dispatcher (parallel to TypeAwareLink).
  Renders FeatureAwarePicture or ColoredImg based on TypeAwareImageProps.type.
  Pure dispatcher: callers resolve alt / i18n before building the props;
  extra attrs (class, aria-*) fall through to the rendered image component
  via $attrs.
-->
<script setup lang="ts">
import type { TypeAwareImageProps } from "../../types/app";
import ColoredImg from "./ColoredImg.vue";
import FeatureAwarePicture from "./FeatureAwarePicture.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{ image: TypeAwareImageProps }>();
</script>

<template>
  <FeatureAwarePicture
    v-if="image.type === 'picture'"
    v-bind="image.imgProps"
  />
  <ColoredImg v-else v-bind="image.imgProps" />
</template>
