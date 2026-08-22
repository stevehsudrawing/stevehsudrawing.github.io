<!--
  LinkCard.vue — Single link card with icon, title, and description.
  Renders one LinkCardData item from the link-cards JSON config.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import type {
  LinkCardData,
  TypeAwareImageProps,
  TypeAwareLinkProps,
} from "../../types/app";
import type { HastNode } from "../../types/hast";
import QRCodeButton from "../buttons/QRCodeButton.vue";
import TypeAwareImage from "../images/TypeAwareImage.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import HastFragment from "../render-functions/HastFragment.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Card data from JSON config. */
  card: LinkCardData;
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

// ---- Availability (discriminated union: available cards have titleLink) ----

/** Available cards render a link title; unavailable cards render plain text. */
const available = computed(() => props.card.available !== false);

const availableClass = computed(() => (available.value ? "" : "opacity-75"));

/** Title link (only present for available cards). */
const titleLink = computed<TypeAwareLinkProps | null>(() =>
  props.card.available === false ? null : props.card.titleLink,
);

/** Title text derived from the card id. */
const titleText = computed(() => t("text-" + props.card.id));

// ---- Icon (id-derived alt) ----

/** Card icon with the id-derived alt injected. */
const icon = computed<TypeAwareImageProps | null>(() => {
  const i = props.card.icon;
  if (!i) return null;
  if (i.type === "picture") {
    return {
      type: "picture",
      imgProps: { ...i.imgProps, alt: titleText.value },
    };
  }
  return {
    type: "colored-img",
    imgProps: { ...i.imgProps, alt: titleText.value },
  };
});

// ---- Description (HAST → HastFragment) ----

/** HAST children for the card description. */
const descNodes = computed<HastNode[]>(() => {
  if (!props.card.description) return [];
  const desc = props.card.description;
  return desc.type === "root" && Array.isArray(desc.children)
    ? (desc.children as HastNode[])
    : [desc as HastNode];
});

// ---- QR (external title links only) ----

const showQR = computed(() => {
  if (!titleLink.value || titleLink.value.type !== "external") return false;
  const href = titleLink.value.href;
  if (!href) return false;
  if (href.startsWith("#") || href.startsWith("javascript:")) return false;
  return true;
});
</script>

<template>
  <div class="card-wrapper col-md-6 col-xl-4" :class="availableClass">
    <div class="card flex-grow-1">
      <div class="d-flex card-body">
        <!-- Icon -->
        <div v-if="icon" class="link-icon-wrapper me-2">
          <TypeAwareImage :image="icon" class="img-fluid img-fit" />
        </div>

        <div class="flex-grow-1">
          <!-- Title -->
          <div class="d-flex">
            <TypeAwareLink
              v-if="titleLink"
              v-bind="titleLink"
              :icon="icon"
              class="card-title mb-1 flex-grow-1"
            >
              {{ titleText }}
            </TypeAwareLink>
            <span v-else class="card-title mb-1">{{ titleText }}</span>
            <!-- QR button -->
            <QRCodeButton
              v-if="showQR && titleLink"
              :url="titleLink.href"
              :icon="icon"
            />
          </div>

          <!-- Description -->
          <p v-if="descNodes.length > 0" class="card-text">
            <HastFragment :nodes="descNodes" />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Migrated from base.css — Cards / Image Utilities sections.
 * These were build-time injected link-card styles, now owned by LinkCard.vue.
 */

a {
  color: var(--shlh-link-color) !important;
}

/* ---- Card wrapper ---- */
.card-wrapper {
  display: flex;
}

/* ---- Icon ---- */
.link-icon-wrapper {
  width: 40px;
  min-width: 40px;
}
</style>
