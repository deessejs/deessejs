import { Home } from "@/components/pages/homepage"


export default function HomePage() {
  return (
    <>
      <Home.Hero />
      <Home.TechStack />
      <Home.Surfaces />
      <Home.ForWho />
      <Home.Skip />
      <Home.Contracts />
      <Home.CliInAction />
      <Home.LatestGuides />
      <Home.Ecosystem />
      {/* Hidden until real testimonials come in: the 12 quotes are
          placeholder personas mapped to the for-who archetypes,
          not real customers. The component, the TESTIMONIALS const,
          and the export all stay in place — uncomment to reactivate
          once we have verified customer quotes to ship. */}
      {/* <Home.Testimonials /> */}
      <Home.Integrations />
      <Home.CodingAgents />
      {/* Hidden until real traction: the strip showed "12K npm downloads"
          and "3.2K GitHub stars" while the project isn't published in
          any meaningful way. The component, the STATS const, and the
          export all stay in place — uncomment to reactivate once the
          numbers reflect actual registry + npm traffic. */}
      {/* <Home.Stats /> */}
      {/* Hidden until real testimonials come in: the 12 quotes are
          placeholder personas mapped to the for-who archetypes,
          not real customers. The component, the TESTIMONIALS const,
          and the export all stay in place — uncomment to reactivate
          once we have verified customer quotes to ship. */}
      {/* <Home.Testimonials /> */}
      <Home.FAQ />
      <Home.FinalCta />
    </>
  )
}
