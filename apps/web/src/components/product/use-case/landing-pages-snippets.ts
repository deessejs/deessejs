/**
 * Landing pages pillar code snippets - server-only module.
 *
 * Eight TypeScript / TSX samples for the landing pages use case
 * (`/use-cases/landing-pages`): the four existing clusters
 * (Hero & promise, Surface grid, Authority, Process & CTA)
 * plus four new "behind the curtain" pillars (Headline spec,
 * Tabbed explorer, KB link, Numbered steps).
 *
 * Landing pages is a frontend-only static marketing template,
 * so snippets import from `@workspace/ui`, `@workspace/utils`,
 * `@workspace/contracts`, `@workspace/env` only - never from
 * `@workspace/auth`, `@workspace/database`, or `@workspace/api`.
 *
 * Server-only because the consumer pre-highlights the snippets
 * server-side via `codeToHtml`; the strings never ship in the
 * client's JS bundle.
 *
 * Snippets are illustrative. Real public API may differ.
 */

export type LandingPagesPillarSlug =
  | "hero-block"
  | "surface-grid"
  | "authority-block"
  | "process-cta"
  | "headline-spec"
  | "tabbed-explorer"
  | "kb-link"
  | "numbered-steps"

export type LandingPagesPillarSnippet = {
  tabName: string
  lang: "typescript"
  code: string
}

export type LandingPagesPillarTool = {
  files: ReadonlyArray<LandingPagesPillarSnippet>
}

const heroBlockFile: LandingPagesPillarSnippet = {
  tabName: "hero-block.tsx",
  lang: "typescript",
  code: `import { Button } from "@workspace/ui/components/button"

export const Hero = () => (
  <section>
    <p>Use case</p>
    <h1>Ship your next project from your terminal.</h1>
    <p>One CLI line, one clone, one running app.</p>
    <Button asChild><a href="/templates">Browse templates</a></Button>
  </section>
)`,
}

const surfaceGridFile: LandingPagesPillarSnippet = {
  tabName: "surface-grid.tsx",
  lang: "typescript",
  code: `import { surfaces } from "@workspace/contracts"

export const tiles = surfaces.map((s) => ({
  id: s.id,
  title: s.title,
  href: \`/use-cases/\${s.slug}\`,
  icon: s.icon,
}))`,
}

const authorityBlockFile: LandingPagesPillarSnippet = {
  tabName: "authority-block.tsx",
  lang: "typescript",
  code: `export const Authority = () => (
  <section>
    <h2>Read the manifesto. Browse the changelog.</h2>
    <a href="/manifesto">Manifesto</a>
    <a href="/changelog">Changelog</a>
    <a href="/knowledge-base">Knowledge base</a>
  </section>
)`,
}

const processCtaFile: LandingPagesPillarSnippet = {
  tabName: "process-cta.tsx",
  lang: "typescript",
  code: `import { FinalCta } from "@/components/pages/_shared/final-cta"

export const PageCta = () => (
  <FinalCta
    eyebrow="Two doors"
    title="Choose your starting point."
    body="Browse the registry or read the setup guide."
    actions={[
      { label: "Browse templates", href: "/templates" },
      { label: "Read the guide", href: "/knowledge-base/guides/install-deessejs-cli" },
    ]}
  />
)`,
}

const headlineSpecFile: LandingPagesPillarSnippet = {
  tabName: "headline-spec.ts",
  lang: "typescript",
  code: `export const headline = (input: {
  surface: string
  verb: string
  outcome: string
}) => ({
  h1: \`\${input.verb} \${input.outcome}, on the \${input.surface} surface.\`,
  sub: \`Concrete promises outperform adjectives. One declarative
sentence above the fold beats a carousel of stock imagery.\`,
})`,
}

const tabbedExplorerFile: LandingPagesPillarSnippet = {
  tabName: "tabbed-explorer.tsx",
  lang: "typescript",
  code: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"

export const SurfaceExplorer = ({ surfaces }: { surfaces: Surface[] }) => (
  <Tabs defaultValue={surfaces[0]?.id}>
    <TabsList>
      {surfaces.map((s) => (
        <TabsTrigger key={s.id} value={s.id}>{s.title}</TabsTrigger>
      ))}
    </TabsList>
    {surfaces.map((s) => (
      <TabsContent key={s.id} value={s.id}>{s.copy}</TabsContent>
    ))}
  </Tabs>
)`,
}

const kbLinkFile: LandingPagesPillarSnippet = {
  tabName: "kb-link.tsx",
  lang: "typescript",
  code: `export const KbLinks = () => (
  <ul>
    <li><a href="/knowledge-base/guides/install-deessejs-cli">Install the CLI</a></li>
    <li><a href="/knowledge-base/topics/auth">Auth setup</a></li>
    <li><a href="/knowledge-base/topics/database">Drizzle on Postgres</a></li>
  </ul>
)`,
}

const numberedStepsFile: LandingPagesPillarSnippet = {
  tabName: "numbered-steps.tsx",
  lang: "typescript",
  code: `export const NumberedSteps = ({ steps }: { steps: Step[] }) => (
  <ol>
    {steps.map((s, i) => (
      <li key={s.title}>
        <span>{String(i + 1).padStart(2, "0")}</span>
        <h3>{s.title}</h3>
        <p>{s.body}</p>
      </li>
    ))}
  </ol>
)`,
}

export const LANDING_PAGES_SNIPPETS: Record<LandingPagesPillarSlug, LandingPagesPillarTool> = {
  "hero-block":        { files: [heroBlockFile] },
  "surface-grid":      { files: [surfaceGridFile] },
  "authority-block":   { files: [authorityBlockFile] },
  "process-cta":       { files: [processCtaFile] },
  "headline-spec":     { files: [headlineSpecFile] },
  "tabbed-explorer":   { files: [tabbedExplorerFile] },
  "kb-link":           { files: [kbLinkFile] },
  "numbered-steps":    { files: [numberedStepsFile] },
}
