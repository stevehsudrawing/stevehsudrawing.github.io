<!--
  HastFragment.vue — Recursive HAST-to-Vue renderer.

  Converts a HAST node tree (from markdown or link-card JSON) into
  Vue VNodes, upgrading `<a>` to `<TypeAwareLink>`, `<img>` to
  `<FeatureAwarePicture>` or `<ColoredImg>`, `<section-heading>`
  (markdown heading markers) to `<SectionHeading>`, and elements with
  a `dataModal` property to `<ModalTrigger>` (parameterless modal
  openers).  Other elements are rendered as native HTML elements with
  their attributes passed through.
-->
<script lang="ts">
import { defineComponent, h, type VNode } from "vue";
import {
  extractColoredImgProps,
  extractLinkProps,
  extractPictureProps,
} from "../../composables/content/useHastToVue";
import { useI18n } from "../../composables/core/useI18n";
import type { HastNode } from "../../types/hast";
import ColoredImg from "../images/ColoredImg.vue";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import SectionHeading from "../ui/SectionHeading.vue";
import ModalTrigger from "./ModalTrigger.vue";

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

        // <section-heading> → SectionHeading (markdown heading markers
        // produced by MarkdownArticle; inline children become slot content)
        if (node.tagName === "section-heading") {
          const { headingId, title, level, pagePath } = properties;
          return h(
            SectionHeading,
            {
              title: typeof title === "string" ? title : "",
              headingId: typeof headingId === "string" ? headingId : undefined,
              level: typeof level === "number" ? level : 2,
              pagePath: typeof pagePath === "string" ? pagePath : undefined,
            },
            { default: () => children },
          );
        }

        // data-modal="..." → ModalTrigger (parameterless modal opener)
        const modalId = properties.dataModal;
        if (typeof modalId === "string" && modalId !== "") {
          return h(ModalTrigger, { modalId }, { default: () => children });
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
            // Skip directive metadata keys — they are not HTML attributes
            if (
              key === "dataI18n" ||
              key === "dataI18nHtml" ||
              key === "dataModal"
            )
              continue;
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
          return h(tagName, vueProps, t(i18nKey));
        }

        return h(tagName, vueProps, children);
      }

      return "";
    }

    return () => props.nodes.map(renderNode);
  },
});
</script>
