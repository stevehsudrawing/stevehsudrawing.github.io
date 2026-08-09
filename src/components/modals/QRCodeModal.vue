<!--
  QRCodeModal.vue — QR code generation + branded share card.
  Replaces features/qr-code.ts imperative DOM manipulation.
  Uses qrcode for canvas generation and html-to-image/html2canvas for PNG export.
-->
<script setup lang="ts">
import { ref, watch, nextTick, computed, toRef, type Ref } from "vue";
import QRCode from "qrcode";
import { useI18n } from "../../composables/useI18n";
import { useTheme } from "../../composables/useTheme";
import { useToast } from "../../composables/useToast";
import { useImgDisplayProps } from "../../composables/useImgDisplayProps";
import { useDelayedTooltip } from "../../composables/useDelayedTooltip";
import InlineSvg from "../ui/InlineSvg.vue";
import FeatureAwareImg from "../ui/FeatureAwareImg.vue";

// =========================================================================
// Props
// =========================================================================

/**
 * Props for QRCodeModal.
 *
 * @property url - The URL to encode in the QR code.
 * @property imgProperties - Optional HAST-format icon properties for the
 *   centre overlay image (src, alt, dataI18nAlt, etc.).
 * @property hideOpenLink - When true, the \"Open Link\" button is hidden.
 */
const props = defineProps<{
  url: string;
  imgProperties?: Record<string, unknown> | null;
  hideOpenLink?: boolean;
}>();

/**
 * Emits for QRCodeModal.
 *
 * - open-link: User clicked \"Open Link\" — parent switches to
 *   ExternalLinkConfirmModal with the same URL + icon properties.
 */
const emit = defineEmits<{
  (
    e: "open-link",
    url: string,
    imgProperties: Record<string, unknown> | null,
  ): void;
}>();

// =========================================================================
// State
// =========================================================================

const visible = ref(false);
const { t } = useI18n();
const { effectiveTheme } = useTheme();
const { showToast } = useToast();

// ---- Tooltip ----

const openTip = useDelayedTooltip(500);
const shareTip = useDelayedTooltip(500);
const downloadTip = useDelayedTooltip(500);
const copyTip = useDelayedTooltip(500);

const qrCanvas = ref<HTMLCanvasElement | null>(null);
const buttonsDisabled = ref(false);

// -------------------------------------------------------------------------
// Center icon (derived from imgProperties HAST)
// -------------------------------------------------------------------------

const {
  src: centerIconSrcRaw,
  alt: centerIconAltRaw,
  feature: centerIconFeature,
  colorVar: centerIconColorVar,
  colorMaskSrc: centerIconColorMaskSrc,
} = useImgDisplayProps(
  toRef(props, "imgProperties") as Ref<
    Record<string, unknown> | null | undefined
  >,
);

const centerIconSrc = computed(
  () => centerIconSrcRaw.value ?? "/images/webp/icons/link.webp",
);
const centerIconAlt = computed(
  () => centerIconAltRaw.value ?? t("text-link", "Link"),
);

// -------------------------------------------------------------------------
// Computed
// -------------------------------------------------------------------------

const isInternal = computed(() => {
  try {
    const u = new URL(props.url, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
});

const shareApiSupported = computed(() => {
  const testFile = new File(
    [new Blob([""], { type: "image/png" })],
    "test.png",
    { type: "image/png" },
  );
  return !!navigator.canShare?.({ files: [testFile] });
});

const qrColors = computed(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    dark: cs.getPropertyValue("--bs-body-color").trim() || "#000000",
    light: cs.getPropertyValue("--bs-body-bg").trim() || "#ffffff",
  };
});

const cardTitle = computed(() => {
  if (props.imgProperties) {
    const i18nAltKey = props.imgProperties.dataI18nAlt as string | undefined;
    return i18nAltKey
      ? t(i18nAltKey)
      : (props.imgProperties.alt as string) || t("text-link", "Link");
  }
  return t("text-link", "Link");
});

// =========================================================================
// Actions
// =========================================================================

// -------------------------------------------------------------------------
// QR code generation
// -------------------------------------------------------------------------

let prevUrl = "";

async function generateQR(): Promise<void> {
  if (!qrCanvas.value || props.url === prevUrl) return;
  prevUrl = props.url;

  const { dark, light } = qrColors.value;
  await QRCode.toCanvas(qrCanvas.value, props.url, {
    width: 250,
    margin: 0,
    color: { dark, light },
    errorCorrectionLevel: "Q",
  });
}

watch(visible, async (v) => {
  if (v) {
    await nextTick();
    await generateQR();
  }
});

// Re-generate on theme change.  Read CSS properties directly
// rather than relying on the qrColors computed — getComputedStyle()
// is not reactive and the computed cache may be stale.
watch(effectiveTheme, async () => {
  if (visible.value && qrCanvas.value) {
    await nextTick();
    const cs = getComputedStyle(document.documentElement);
    const dark = cs.getPropertyValue("--bs-body-color").trim() || "#000000";
    const light = cs.getPropertyValue("--bs-body-bg").trim() || "#ffffff";
    await QRCode.toCanvas(qrCanvas.value, props.url, {
      width: 250,
      margin: 0,
      color: { dark, light },
      errorCorrectionLevel: "Q",
    });
  }
});

// -------------------------------------------------------------------------
// Share card -> PNG export
// -------------------------------------------------------------------------

/**
 * Render the QR share card to a PNG blob.
 *
 * Uses the same two-tier fallback as the original features/qr-code.ts:
 * 1. html-to-image toPng (primary — canvas via SVG foreignObject)
 * 2. html2canvas (fallback for mobile / environments without foreignObject)
 */
async function renderShareCardBlob(): Promise<Blob> {
  const shareCard = document.getElementById("qr-share-card");
  if (!shareCard) throw new Error("Share card element not found");

  const bg = qrColors.value.light;
  const hti = window.htmlToImage as Record<string, unknown>;
  const toPng = hti.toPng as (
    el: HTMLElement,
    opts?: Record<string, unknown>,
  ) => Promise<string>;

  try {
    const dataUrl = await toPng(shareCard, {
      backgroundColor: bg,
      pixelRatio: 3,
    });
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    if (blob.size > 0) return blob;
  } catch {
    // html-to-image failed (likely mobile / no foreignObject), fall through to html2canvas
  }

  // html2canvas fallback
  const canvas = await window.html2canvas(shareCard, {
    backgroundColor: bg,
    scale: 3,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  if (blob.size > 0) return blob;

  throw new Error(
    "QR export failed: both html-to-image and html2canvas produced empty output",
  );
}

async function runWithBlob(
  onSuccess: (blob: Blob) => void | Promise<void>,
  errorLabel?: string,
): Promise<void> {
  buttonsDisabled.value = true;
  try {
    const blob = await renderShareCardBlob();
    buttonsDisabled.value = false;
    await onSuccess(blob);
  } catch (error) {
    buttonsDisabled.value = false;
    const label = errorLabel || "Failed to generate QR code image";
    console.error(label, error);
    showToast("error", `${label}: ${(error as Error).message}`);
  }
}

async function downloadPNG(): Promise<void> {
  await runWithBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "Failed to download QR code image");
}

async function shareImage(): Promise<void> {
  await runWithBlob((blob) => {
    const file = new File([blob], "qr-code.png", { type: "image/png" });
    navigator.share({ files: [file] }).catch((err) => {
      if ((err as DOMException).name !== "AbortError") {
        console.error("Sharing failed", err);
      }
    });
  }, "Failed to generate QR code image for sharing");
}

async function copyImage(): Promise<void> {
  await runWithBlob(async (blob) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      showToast(
        "success",
        t(
          "text-copied-image",
          "Copied image. You can paste it into a supported input field.",
        ),
      );
    } catch {
      // ClipboardItem("image/png") not supported — fall back to copying the URL
      await navigator.clipboard.writeText(props.url);
      showToast(
        "success",
        `${t("text-copied-text", "Copied text")}: ${props.url}`,
      );
    }
  }, "Failed to copy QR code image");
}

function openLink(): void {
  visible.value = false;
  emit("open-link", props.url, props.imgProperties ?? null);
}

/** Expose show/hide for imperative callers (parent App.vue). */
// =========================================================================
// Expose
// =========================================================================

defineExpose({
  show: () => {
    visible.value = true;
  },
  hide: () => {
    visible.value = false;
  },
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="$t('text-qr-code', 'QR Code')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    hide-footer
  >
    <div class="d-flex justify-content-center">
      <!-- ==== QR share card (exact DOM structure for html-to-image) ==== -->
      <div id="qr-share-card">
        <div id="qr-share-card-header">
          <div id="qr-share-card-header-text">
            <span id="qr-share-card-title">{{ cardTitle }}</span>
            <span id="qr-share-card-brand">
              {{
                $t(
                  "text-from-steve-hsu-s-link-hub",
                  "from Steve Hsu's Link-Hub",
                )
              }}
            </span>
          </div>
        </div>

        <div
          id="qr-code-container"
          class="no-copy position-relative d-inline-block"
        >
          <canvas ref="qrCanvas"></canvas>
          <!-- Center overlay icon -->
          <span
            id="qr-code-icon-bg"
            class="position-absolute top-50 start-50 translate-middle rounded-2 d-flex align-items-center justify-content-center"
          >
            <FeatureAwareImg
              id="qr-code-icon"
              :light-src="centerIconSrc"
              :alt="centerIconAlt"
              :feature="centerIconFeature"
              :color-var="centerIconColorVar"
              :color-mask-src="centerIconColorMaskSrc"
              :width="32"
              :height="32"
            />
          </span>
        </div>

        <code class="mt-2 mb-0 d-block">{{ url }}</code>

        <div id="qr-share-card-footer">
          <div id="qr-share-card-footer-text">
            <span>{{
              $t("text-learn-more-about-me", "Learn more about me")
            }}</span>
            <code id="qr-share-card-source"
              >https://stevehsudrawing.github.io</code
            >
          </div>
          <div id="qr-share-card-logo-container">
            <InlineSvg
              src="/images/svg/icons/steve-hsu.svg"
              :width="25"
              :height="21"
              color-var="bs-primary"
              class="no-copy"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="w-100 d-flex">
        <button
          v-if="!isInternal && !hideOpenLink"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          :aria-label="$t('text-open', 'Open')"
          v-b-tooltip.top.manual="{
            modelValue: openTip.visible,
            title: t('text-open', 'Open'),
          }"
          @mouseenter="openTip.scheduleShow()"
          @mouseleave="openTip.cancelAndHide()"
          @click="openLink"
        >
          <i class="bi bi-box-arrow-up-right"></i>
        </button>
        <button
          v-if="shareApiSupported"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          :aria-label="$t('text-share', 'Share')"
          v-b-tooltip.top.manual="{
            modelValue: shareTip.visible,
            title: t('text-share', 'Share'),
          }"
          @mouseenter="shareTip.scheduleShow()"
          @mouseleave="shareTip.cancelAndHide()"
          @click="
            shareTip.cancelAndHide();
            shareImage();
          "
          :disabled="buttonsDisabled"
        >
          <i class="bi bi-share"></i>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border"
          :aria-label="$t('text-download', 'Download')"
          v-b-tooltip.top.manual="{
            modelValue: downloadTip.visible,
            title: t('text-download', 'Download'),
          }"
          @mouseenter="downloadTip.scheduleShow()"
          @mouseleave="downloadTip.cancelAndHide()"
          @click="
            downloadTip.cancelAndHide();
            downloadPNG();
          "
          :disabled="buttonsDisabled"
        >
          <i class="bi bi-download"></i>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border me-auto"
          :aria-label="$t('text-copy', 'Copy')"
          v-b-tooltip.top.manual="{
            modelValue: copyTip.visible,
            title: t('text-copy', 'Copy'),
          }"
          @mouseenter="copyTip.scheduleShow()"
          @mouseleave="copyTip.cancelAndHide()"
          @click="
            copyTip.cancelAndHide();
            copyImage();
          "
          :disabled="buttonsDisabled"
        >
          <i class="bi bi-clipboard"></i>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="visible = false"
        >
          {{ $t("text-close", "Close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* --- QR share card (captured by html-to-image for PNG export) --- */
code {
  background-color: unset;
  outline: none;
}

#qr-share-card {
  background-color: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  padding: 25px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
}

#qr-share-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-direction: row;
  justify-content: space-between;
}

#qr-share-card-header-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

#qr-share-card-title {
  font-size: 16.8px;
  font-weight: calc(var(--bs-body-font-weight) + 100);
  color: var(--bs-body-color);
  line-height: 1.2;
}

#qr-share-card-brand {
  font-size: 12.8px;
  color: var(--bs-secondary-color);
  white-space: nowrap;
}

#qr-share-card-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: rgba(var(--bs-body-color-rgb), 0.8);
  font-size: 12px;
  border-top: 1px solid rgba(var(--bs-body-color-rgb), 0.8);
  margin-top: 0.75rem;
  padding-top: 0.5rem;
}

#qr-share-card-footer-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

#qr-share-card-logo-container {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

#qr-share-card-logo {
  display: block;
  color: var(--bs-link-color);
}

/* --- QR code container + centre icon --- */

#qr-code-container {
  position: relative;
  width: 250px;
  height: 250px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

#qr-code-icon-bg {
  width: 32px;
  height: 32px;
  background-color: var(--bs-body-bg);
  border-radius: var(--bs-border-radius-sm);
  box-shadow: 0 0 0 2px var(--bs-body-color);
}

#qr-code-icon {
  display: block;
}

#qr-code-modal-link {
  font-size: 13.6px;
  word-break: break-all;
  color: rgba(var(--bs-body-color-rgb), 0.9);
  max-width: 100%;
  line-height: 1.25;
}

/* --- BModal body centering --- */
:deep(.modal-body) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
