import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
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
