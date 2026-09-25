/**
 * /about page namespace — single import surface for every section.
 *
 * Mirrors the pattern established by `@/components/pages/enterprise`
 * and `@/components/pages/delivery`: the route file imports
 * `About` and renders each section as `<About.X />`, becoming a
 * literal table of contents.
 *
 * Sections, top to bottom:
 *   - Hero    — eyebrow + h1 + lead
 *   - MainApp — "The main app" prose
 *   - Editor  — "Edited by Nesalia Inc." prose
 *   - Contact — "Get in touch" 3-card channel grid (data in lib/about/channels.ts)
 *
 * The closing "Read next" block lives outside this namespace and is
 * rendered directly by `page.tsx` via the shared `_shared/RelatedLinks`.
 */
import { Contact } from "./contact"
import { Editor } from "./editor"
import { Hero } from "./hero"
import { MainApp } from "./main-app"

export const About = {
  Hero,
  MainApp,
  Editor,
  Contact,
} as const

// Named re-exports for consumers that want a single component
// without going through the namespace (e.g. tests, storybook).
export { Contact, Editor, Hero, MainApp }
