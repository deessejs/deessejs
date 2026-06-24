import { HomeFooter } from "#components/footers/home-footer"
import { HomeHeader } from "#components/headers/home-header"
import { HomeFeatures } from "#components/homepage/features"
import { HomeHero } from "#components/homepage/hero"
import { HomeInteractiveDemo } from "#components/homepage/interactive-demo"

/**
 * Homepage. M1 vertical slice — 5 sections, all dummy content.
 *
 * Each section is its own component under src/components/:
 *   1. HomeHeader          → src/components/headers/home-header.tsx
 *   2. HomeHero            → src/components/homepage/hero.tsx
 *   3. HomeFeatures        → src/components/homepage/features.tsx
 *   4. HomeInteractiveDemo → src/components/homepage/interactive-demo.tsx
 *   5. HomeFooter          → src/components/footers/home-footer.tsx
 *
 * Replace each section's content in follow-up passes. Layout, grid, spacing,
 * and primitive selection are stable; copy and the real InteractiveFiletree
 * are the work that remains.
 */
export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <main className="flex-1">
        <HomeHero />
        <HomeFeatures />
        <HomeInteractiveDemo />
      </main>
      <HomeFooter />
    </>
  )
}
