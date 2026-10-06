import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { TestimonialsMarquee } from "@/app/(marketing)/_components/testimonials-marquee"

/** Testimonials — infinite horizontal marquee, paused on hover. */
export function Testimonials() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What customers say"
        title=""
        bordered={false}
      />
      <TestimonialsMarquee />
    </Section>
  )
}
