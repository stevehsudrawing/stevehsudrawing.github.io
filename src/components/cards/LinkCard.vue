<!--
  LinkCard.vue — Single link card with icon, title, and description.
  Renders one CardData item from the link-cards JSON config.

  Phase 7: replaces build/builders/link-cards.ts buildCardNode().
-->
<script setup lang="ts">
import { computed, toRef, type Ref } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import { useImgDisplayProps } from "../../composables/useImgDisplayProps.js";
import FeatureAwareImg from "../ui/FeatureAwareImg.vue";
import type { CardData } from "../../types/app.js";
import type { HastProperties, HastNode } from "../../types/hast.js";
import { resolveI18nInHtml } from "../../core/utils.js";
import { toHtml } from "hast-util-to-html";

// =========================================================================
// Helpers
// =========================================================================

/**
 * Recursively add data-link-img-props to all <a> elements in a HAST tree.
 * Mutates the tree in place.  Call on a clone of the original node.
 *
 * This replaces build/builders/link-cards.ts processLinkNodes() for the
 * title-description link decoration pass (without QR button insertion).
 */
function addLinkImgProps(
  node: HastNode,
  iconProperties: HastProperties | null,
): void {
  if (!node || typeof node !== "object") return;

  if (node.type === "element" && node.tagName === "a") {
    if (!node.properties) node.properties = {} as HastProperties;
    if (
      iconProperties &&
      !(node.properties as Record<string, unknown>).dataLinkImgProps
    ) {
      (node.properties as Record<string, unknown>).dataLinkImgProps =
        JSON.stringify(iconProperties);
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      addLinkImgProps(child, iconProperties);
    }
  }
}

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

const iconProps = useImgDisplayProps(
  computed(
    () =>
      (props.card.icon?.properties as Record<string, unknown> | null) ?? null,
  ) as Ref<Record<string, unknown> | null | undefined>,
);

/** HAST → HTML for the title node, with link processing. */
const titleHtml = computed(() => {
  if (!props.card.title) return "";

  // Clone so we don't mutate the prop (use JSON round-trip since
  // Vue's reactivity proxy prevents structuredClone).
  const title = JSON.parse(JSON.stringify(props.card.title)) as Parameters<
    typeof toHtml
  >[0];

  // Add data-link-img-props to all <a> elements in the title
  const iconProperties = props.card.icon?.properties ?? null;
  if (iconProperties) {
    addLinkImgProps(title as HastNode, iconProperties);
  }

  return resolveI18nInHtml(toHtml(title), t);
});

/** HAST → HTML for the description node. */
const descHtml = computed(() =>
  props.card.description
    ? resolveI18nInHtml(
        toHtml(props.card.description as Parameters<typeof toHtml>[0]),
        t,
      )
    : "",
);

/** JSON-encode icon properties for data-qr-icon attribute. */
const qrIconJson = computed(() =>
  props.card.icon?.properties
    ? JSON.stringify(props.card.icon.properties)
    : null,
);

/** Extract the href from the title node (if it's an <a>). */
const titleHref = computed(() => {
  if (
    props.card.title?.type === "element" &&
    props.card.title.tagName === "a"
  ) {
    return (props.card.title.properties?.href as string) ?? "";
  }
  return "";
});

/** Whether the title is a single link (wraps the whole card title). */
const titleIsSingleLink = computed(
  () =>
    props.card.title?.type === "element" && props.card.title.tagName === "a",
);

/** Whether to show a QR button for this card. */
const showQR = computed(() => {
  const href = titleHref.value;
  if (!href) return false;
  if (href.startsWith("#") || href.startsWith("javascript:")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  return true;
});

// =========================================================================
// Actions
// =========================================================================

/** Decide card availability class. */
const availableClass = computed(() =>
  props.card.available !== true ? "opacity-75" : "",
);
</script>

<template>
  <div class="card-wrapper col-lg-6 col-xxl-4" :class="availableClass">
    <div class="card flex-grow-1">
      <div class="d-flex card-body">
        <!-- Icon -->
        <div v-if="props.card.icon" class="link-icon-wrapper me-2">
          <FeatureAwareImg
            :light-src="(iconProps.src.value as string) ?? ''"
            :alt="(iconProps.alt.value as string) ?? ''"
            :feature="iconProps.feature.value"
            :color-var="iconProps.colorVar.value"
            :color-mask-src="iconProps.colorMaskSrc.value"
            class="img-fluid img-fit"
          />
        </div>

        <div class="flex-grow-1">
          <!-- Title -->
          <div class="d-flex">
            <div class="d-flex flex-grow-1">
              <span
                v-if="titleHtml"
                class="card-title h6 flex-grow-1"
                v-html="titleHtml"
              ></span>
              <!-- QR button (after single-link title) -->
              <a
                v-if="titleIsSingleLink && showQR"
                href="javascript:void(0)"
                role="button"
                class="text-decoration-none"
                :data-qr-url="titleHref"
                :data-qr-icon="qrIconJson ?? undefined"
                :aria-label="$t('text-show-qr-code', 'Show QR Code')"
                v-b-tooltip="{
                  title: t('text-show-qr-code', 'Show QR Code'),
                  delay: { show: 500 },
                }"
              >
                <i class="bi bi-qr-code"></i>
              </a>
            </div>
          </div>

          <!-- Description -->
          <p v-if="descHtml" class="card-text" v-html="descHtml"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Migrated from base.css -- Cards / Image Utilities sections.
 * These were build-time injected link-card styles, now owned by LinkCard.vue.
 */

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
