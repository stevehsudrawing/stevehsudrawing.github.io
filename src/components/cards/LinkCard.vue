<!--
  LinkCard.vue — Single link card with icon, title, and description.
  Renders one CardData item from the link-cards JSON config.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import {
  extractPictureProps,
  extractColoredImgProps,
  extractLinkProps,
  type ExtractedLinkProps,
} from "../../composables/useHastToVue";
import FeatureAwarePicture from "../ui/FeatureAwarePicture.vue";
import ColoredImg from "../ui/ColoredImg.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import QRCodeButton from "../buttons/QRCodeButton.vue";
import HastFragment from "../ui/HastFragment.vue";
import type {
  CardData,
  FeatureAwarePictureProps,
  ColoredImgProps,
} from "../../types/app";
import type { HastNode } from "../../types/hast";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Card data from JSON config. */
  card: CardData;
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

// ---- Icon ----

/** Whether the card icon uses colored (CSS mask) rendering. */
const isIconColored = computed(() => {
  if (!props.card.icon) return false;
  const raw = (props.card.icon.properties?.dataImgFeature as string) ?? "";
  return raw.split(" ").includes("colored");
});

/** ColoredImg props extracted from the card's colored icon HAST node. */
const coloredIconProps = computed<ColoredImgProps | null>(() =>
  isIconColored.value && props.card.icon
    ? extractColoredImgProps(props.card.icon, t)
    : null,
);

/** FeatureAwarePicture props extracted from the card's non-colored icon HAST node. */
const pictureIconProps = computed<FeatureAwarePictureProps | null>(() =>
  !isIconColored.value && props.card.icon
    ? extractPictureProps(props.card.icon, t)
    : null,
);

// ---- Title ----

/** Link props extracted from the card's title HAST node (if it's an <a>). */
const titleLink = computed<ExtractedLinkProps | null>(() =>
  props.card.title ? extractLinkProps(props.card.title, t) : null,
);

/** HAST children for the title fallback (when not a single <a>). */
const titleNodes = computed<HastNode[]>(() => {
  if (!props.card.title) return [];
  if (titleLink.value) return []; // Handled by TypeAwareLink
  return [props.card.title];
});

// ---- Description (HAST → HastFragment) ----

/** HAST children for the card description. */
const descNodes = computed<HastNode[]>(() => {
  if (!props.card.description) return [];
  const desc = props.card.description;
  // Description is a root node; pass its children
  return desc.type === "root" && Array.isArray(desc.children)
    ? (desc.children as HastNode[])
    : [desc as HastNode];
});

// ---- QR ----

const showQR = computed(() => {
  if (!titleLink.value) return false;
  if (titleLink.value.type !== "external") return false;
  const href = titleLink.value.href;
  if (!href) return false;
  if (href.startsWith("#") || href.startsWith("javascript:")) return false;
  return true;
});

// ---- Availability ----

const availableClass = computed(() =>
  props.card.available !== true ? "opacity-75" : "",
);
</script>

<template>
  <div class="card-wrapper col-md-6 col-xl-4" :class="availableClass">
    <div class="card flex-grow-1">
      <div class="d-flex card-body">
        <!-- Icon (colored) -->
        <div v-if="coloredIconProps" class="link-icon-wrapper me-2">
          <ColoredImg
            :src="coloredIconProps.src"
            :color-var="coloredIconProps.colorVar"
            :alt="coloredIconProps.alt"
            class="img-fluid img-fit"
          />
        </div>
        <!-- Icon (standard) -->
        <div v-else-if="pictureIconProps" class="link-icon-wrapper me-2">
          <FeatureAwarePicture
            :src="pictureIconProps.src"
            :alt="pictureIconProps.alt"
            :feature="pictureIconProps.feature"
            class="img-fluid img-fit"
          />
        </div>

        <div class="flex-grow-1">
          <!-- Title -->
          <div class="d-flex">
            <TypeAwareLink
              v-if="titleLink"
              :href="titleLink.href"
              :type="titleLink.type"
              :picture-props="pictureIconProps"
              :colored-props="coloredIconProps"
              class="card-title h6 flex-grow-1"
            >
              {{ titleLink.textContent }}
            </TypeAwareLink>
            <span v-else-if="titleNodes.length > 0" class="card-title h6">
              <HastFragment :nodes="titleNodes" />
            </span>
            <!-- QR button -->
            <QRCodeButton
              v-if="showQR"
              :url="titleLink!.href"
              :picture-props="pictureIconProps"
              :colored-props="coloredIconProps"
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
