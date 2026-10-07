import { ENTERPRISE_FAQ } from "@/lib/enterprise/faq"

/**
 * ContactPage + FAQPage JSON-LD. The FAQPage mainEntity is
 * derived from `ENTERPRISE_FAQ` so the schema and the visible
 * Accordion never drift apart.
 *
 * Mounted as a `<script type="application/ld+json">` inline in the
 * page tree — Next.js will hoist it into the document head via the
 * streaming renderer.
 */
export function JsonLd() {
  const data = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "DeesseJS Enterprise",
    description:
      "Custom Pro engagements for larger teams. Multi-template bundles, dedicated support, procurement-ready invoicing.",
    url: "/enterprise",
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: ENTERPRISE_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  })
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  )
}
