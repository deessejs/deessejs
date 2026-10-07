import type { UseCaseTab } from "@/components/product/use-case/use-case-tabs"

/**
 * Group 1 - the four existing landing-page clusters (hero +
 * promise, surface grid, authority, process + CTA), condensed
 * from the inline CAPABILITY_CLUSTERS array. These describe
 * the structural blocks a B2B landing page needs.
 *
 * Group 2 - four new "behind the curtain" pillars: headline
 * spec, tabbed explorer, KB link, numbered steps. These
 * describe the primitives shipped in the template (not the
 * surface itself), so a buyer can drop them into their own
 * page without a separate vendor.
 */

export const GROUP_1: ReadonlyArray<UseCaseTab> = [
  {
    slug: "hero-block",
    iconName: "Sparkles",
    title: "Hero & promise",
    description:
      "The first 50px above the fold. Earn the click in five seconds or lose the visitor for the day.",
  },
  {
    slug: "surface-grid",
    iconName: "Layers",
    title: "Surface grid",
    description:
      "Show what the registry covers, not what the product is. Surfaces over templates: SaaS, AI, mobile, desktop, CLIs, APIs, blogs.",
  },
  {
    slug: "authority-block",
    iconName: "ShieldCheck",
    title: "Authority",
    description:
      "Earn trust without testimonials. Manifesto + KB docs + public changelog. Evidence that the team ships, on the same domain.",
  },
  {
    slug: "process-cta",
    iconName: "Workflow",
    title: "Process & CTA",
    description:
      "From interest to commitment. Numbered steps the visitor can mentally complete in one read, then a final CTA that asks for the close.",
  },
]

export const GROUP_2: ReadonlyArray<UseCaseTab> = [
  {
    slug: "headline-spec",
    iconName: "Sparkles",
    title: "Headline spec",
    description:
      "Concrete headlines outperform adjectives. One declarative sentence above the fold beats a carousel of stock imagery.",
  },
  {
    slug: "tabbed-explorer",
    iconName: "Layers",
    title: "Tabbed explorer",
    description:
      "Selecting a surface tile reveals a tabbed deep-dive with the install hint, the working mockup, and a few paragraphs of selling copy.",
  },
  {
    slug: "kb-link",
    iconName: "ShieldCheck",
    title: "KB link",
    description:
      "A live KB surface, not a screenshot of one. The articles the visitor can search are the same articles they will live with after they buy.",
  },
  {
    slug: "numbered-steps",
    iconName: "Workflow",
    title: "Numbered steps",
    description:
      "Three to five steps the visitor can rephrase back to a colleague. The numbered cadence reads as 'this is how shipping works' rather than 'this is what we want you to believe'.",
  },
]
