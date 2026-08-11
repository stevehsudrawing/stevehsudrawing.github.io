<!--
  HastFragment.vue — Recursive HAST-to-Vue renderer.

  Converts a HAST node tree (from markdown or link-card JSON) into
  Vue VNodes, upgrading `<a>` to `<TypeAwareLink>` and `<img>` to
  `<FeatureAwarePicture>` or `<ColoredImg>`.  Other elements are
  rendered as native HTML elements with their attributes passed
  through.
-->
<script lang="ts">
import { h, defineComponent, type VNode } from "vue";
import { useI18n } from "../../composables/useI18n";
import {
  extractLinkProps,
  extractPictureProps,
  extractColoredImgProps,
} from "../../composables/useHastToVue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import FeatureAwarePicture from "../ui/FeatureAwarePicture.vue";
import ColoredImg from "../ui/ColoredImg.vue";
import type { HastNode } from "../../types/hast";

type RenderResult = VNode | string;

export default defineComponent({
  name: "HastFragment",
  props: {
    /** HAST nodes to render (typically root.children). */
    nodes: {
      type: Array as () => HastNode[],
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    /**
     * Recursively convert a single HAST node to a VNode or string.
     */
    function renderNode(node: HastNode): RenderResult {
      // — Text --
      if (node.type === "text") {
        return (node.value as string) ?? "";
      }

      // — Comment --
      if (node.type === "comment") return "";

      // — Element --
      if (node.type === "element") {
        const properties = node.properties ?? {};
        const i18nKey = (properties.dataI18n as string) ?? "";

        // Resolve dataI18n: replace children with translated text
        const childNodes = i18nKey ? [] : (node.children ?? []);
        const children = childNodes.map(renderNode);

        // <a> → TypeAwareLink
        if (node.tagName === "a") {
          const link = extractLinkProps(node, t);
          if (link) {
            return h(
              TypeAwareLink,
              { href: link.href, type: link.type },
              { default: () => children },
            );
          }
        }

        // <img> → ColoredImg or FeatureAwarePicture
        if (node.tagName === "img") {
          const featureStr = (node.properties?.dataImgFeature as string) ?? "";

          if (featureStr.split(" ").includes("colored")) {
            const coloredProps = extractColoredImgProps(node, t);
            if (coloredProps) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return h(ColoredImg, coloredProps as any);
            }
          } else {
            const pictureProps = extractPictureProps(node, t);
            if (pictureProps) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return h(FeatureAwarePicture, pictureProps as any);
            }
          }
        }

        // — Native HTML element --
        const tagName = node.tagName!;
        const vueProps: Record<string, unknown> = {};

        if (node.properties) {
          const { className, ...rest } = node.properties;
          if (className) {
            vueProps.class = Array.isArray(className)
              ? (className as string[]).join(" ")
              : (className as string);
          }
          // Pass through remaining primitive properties
          for (const [key, val] of Object.entries(rest)) {
            // Skip i18n metadata keys — they are directives, not HTML attrs
            if (key === "dataI18n" || key === "dataI18nHtml") continue;
            if (
              typeof val === "string" ||
              typeof val === "number" ||
              typeof val === "boolean"
            ) {
              vueProps[key] = val;
            }
          }
        }

        // Resolve dataI18n: replace children with the translated text
        if (i18nKey) {
          const fallback = (node.children ?? [])
            .filter((c) => c.type === "text")
            .map((c) => (c.value as string) ?? "")
            .join("");
          return h(tagName, vueProps, t(i18nKey, fallback));
        }

        return h(tagName, vueProps, children);
      }

      return "";
    }

    return () => props.nodes.map(renderNode);
  },
});
</script>
