import { DELIVERY_FAQ } from "@/lib/delivery/faq"

/**
 * ContactPage + FAQPage JSON-LD. The FAQPage mainEntity is
 * derived from `DELIVERY_FAQ` so the schema and the visible
 * Accordion never drift apart.
 *
 * Mounted as a `<script type="application/ld+json">` inline in the
 * page tree. Next.js will hoist it into the document head via the
 * streaming renderer.
 */
export function JsonLd() {
  const data = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "DeesseJS Delivery",
    description:
      "Engineering services by the team that built DeesseJS. Production-ready scaffolding, custom builds, embedded engineering.",
    url: "/delivery",
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: DELIVERY_FAQ.map((item) => ({
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
