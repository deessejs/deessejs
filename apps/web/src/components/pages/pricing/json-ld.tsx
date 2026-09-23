import { PRICING_FAQ } from "@/lib/pricing"

/**
 * FAQPage JSON-LD. Derived from `PRICING_FAQ` so the schema and the
 * visible Accordion never drift apart.
 *
 * Mounted as a `<script type="application/ld+json">` inline in the
 * page tree — Next.js will hoist it into the document head via the
 * streaming renderer.
 */
export function JsonLd() {
  const data = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PRICING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  })
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  )
}
