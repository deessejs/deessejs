# `<DeployButton>` — the conversion component

The component that turns "I picked a template" into "I have a live app". The single most important UI element of the templates library. Lives in `packages/ui/src/deploy-button.tsx` so it's reusable across the marketing site, the docs, and any other surface that wants to ship a template to Vercel. Date: 2026-07-02.

## Purpose

Document the `<DeployButton>` component contract: prop signature, URL composition, edge cases, variants, tests, and accessibility requirements. This is the spec a contributor implements against, and the spec a reviewer checks PRs against.

The gallery's role (the routes, the filters, the layout) is documented in [`templates-gallery.md`](./templates-gallery.md). The component itself is documented here.

## Why this component is load-bearing

Every other surface in the templates library is **discovery**. The `<DeployButton>` is **conversion**. It's the moment a user goes from "I'm considering this" to "I have a running app". If the button is buried, broken, slow, or unclear, the entire upstream discovery work is wasted.

The component is also the **only piece of the library that talks to Vercel**. Every other component is content. This component is the bridge to the deploy orchestrator at `vercel.com/new/clone`.

## Component signature

```tsx
// packages/ui/src/deploy-button.tsx

interface DeployButtonProps {
  /**
   * The template to deploy. Either:
   * - A GitHub URL string (https://github.com/owner/repo or a subdirectory path)
   * - A TemplateManifest object (resolved from the registry)
   * Required.
   */
  template: string | TemplateManifest

  /**
   * Override the default Vercel project name. Defaults to <template.dir>-<random>.
   * Optional. Read from manifest.projectName if available.
   */
  projectName?: string

  /**
   * Override the default Vercel repository name. Defaults to the project name.
   * Optional.
   */
  repositoryName?: string

  /**
   * Open the deploy URL in a new tab. Defaults to true.
   * Recommended: true (the user is leaving our site; back button should return).
   */
  newTab?: boolean

  /**
   * Variant. Default = the primary gallery CTA. "compact" = for inline use in docs.
   */
  variant?: 'default' | 'compact'

  /**
   * Custom click handler. Useful for analytics (`onDeployClick`) before navigation.
   * Receives the computed URL as the first argument. Default behavior: open the URL.
   */
  onClick?: (url: string) => void

  /**
   * Children. If provided, replaces the default "Deploy to Vercel →" label.
   * Use sparingly — the default label is the conversion copy.
   */
  children?: React.ReactNode
}
```

## URL composition

The component generates a URL to `vercel.com/new/clone` with query parameters. Source of truth for the query params is the [Vercel Deploy Button docs](https://vercel.com/docs/deploy-button).

### Required parameters

```ts
const url = new URL('https://vercel.com/new/clone')
url.searchParams.set('repository-url', template.repositoryUrl)
```

`repository-url` is the only required parameter. The URL must be a valid GitHub / GitLab / Bitbucket URL (Vercel validates).

### Optional parameters

```ts
// Default project name = the template's slug + short random suffix
// e.g. "starter-7k2x" — short enough to be memorable, random enough to be unique
if (projectName) {
  url.searchParams.set('project-name', projectName)
}

if (repositoryName) {
  url.searchParams.set('repository-name', repositoryName)
}

if (template.stores && template.stores.length > 0) {
  url.searchParams.set('stores', JSON.stringify(template.stores))
}
```

### Store parameter (the killer feature — when Cloud ships)

The `stores` parameter is a JSON-encoded array of service descriptors. At MVP, the component supports it but no template uses it. When DeesseJS Cloud has a Vercel Marketplace integration, the `manifest.json` of templates that need Cloud services will declare:

```json
{
  "stores": [
    {
      "type": "integration",
      "integrationSlug": "deessejs-cloud",
      "productSlug": "postgres"
    },
    {
      "type": "integration",
      "integrationSlug": "deessejs-cloud",
      "productSlug": "redis"
    }
  ]
}
```

When the component sees `stores.length > 0`, it includes them in the URL. Vercel's deploy flow then provisions the Cloud services automatically during the wizard.

### Full URL example

For a template that needs Postgres + Redis (future state):

```
https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdeessejs%2Ftemplate-saas&project-name=my-saas-7k2x&repository-name=my-saas-7k2x&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22deessejs-cloud%22%2C%22productSlug%22%3A%22postgres%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22deessejs-cloud%22%2C%22productSlug%22%3A%22redis%22%7D%5D
```

(URL-decoded for readability in the example, but the component URL-encodes everything.)

## Visual specs

### Default variant (gallery CTA)

- **Size**: large. Height ≥ 48px. Padding vertical 12-16px, horizontal 24px.
- **Color**: primary brand color. Background `#000` (matches Vercel's own button), white text. Border-radius matches the design system (8px).
- **Copy**: "Deploy to Vercel →" (with right arrow). The arrow signals "leaving this page".
- **Above the fold**: yes, always. The button is the first interactive element on `/templates/[slug]`.
- **Hover**: slight darken + 1px lift via `box-shadow`.
- **Focus visible**: 2px solid outline matching primary brand, 2px offset.
- **Loading state**: spinner + "Opening Vercel…" for 600ms after click (optimistic; gives Vercel's page time to load before the tab opens).

### Compact variant (inline / docs)

- **Size**: medium. Height ≥ 36px.
- **Color**: secondary. Black border, black text, white background.
- **Copy**: "Deploy →" (shorter).

### When the template is private (post-MVP)

- Replace the button with a `<RequestAccessButton>` (separate component).
- The Deploy button stays disabled if `manifest.visibility === 'private'`, with a tooltip explaining.

## Accessibility

| Requirement | Implementation |
|---|---|
| **Keyboard** | `<a>` element, focusable, Enter triggers navigation (default anchor behavior) |
| **Screen reader** | `aria-label="Deploy template <name> to Vercel"` (full sentence, not just button text) |
| **Focus** | Visible focus ring (per design system) |
| **Color contrast** | WCAG AA. Black on white (default) = 21:1, max |
| **Reduced motion** | The hover lift and the loading spinner respect `prefers-reduced-motion` |

## Tests

Tests live in `packages/ui/src/deploy-button.test.tsx` and run in CI on every PR.

```ts
describe('<DeployButton>', () => {
  it('generates a valid Vercel clone URL with required repository-url', () => {})
  it('includes project-name when provided', () => {})
  it('includes stores JSON when manifest has stores', () => {})
  it('opens in a new tab by default', () => {})
  it('respects newTab={false}', () => {})
  it('fires onClick with the generated URL before navigation', () => {})
  it('renders the default label when no children are provided', () => {})
  it('renders custom children when provided', () => {})
  it('has accessible focus and aria-label', () => {})
  it('is disabled when template.visibility is "private"', () => {})

  // Snapshot tests
  it('matches snapshot for default variant', () => {})
  it('matches snapshot for compact variant', () => {})

  // Visual regression (Playwright)
  it('renders above the fold on /templates/[slug]', () => {})
})
```

Plus an **E2E test** in `apps/web/test/e2e/deploy-button.spec.ts` that:
1. Loads `/templates/starter`
2. Clicks the Deploy button
3. Asserts the resulting URL pattern (e.g. `vercel.com/new/clone?repository-url=...&project-name=...`)
4. Doesn't actually click through to Vercel (would require OAuth setup)

## Locations of use

| Location | Variant | Notes |
|---|---|---|
| `/templates/[slug]` (hero) | Default | Primary CTA, above the fold, mandatory |
| `/templates/[slug]` (footer) | Default (large) | Re-presentation for users who scroll past the hero CTA |
| `/templates` (card) | Compact | Optional card-level CTA. Default: just clicking the card goes to the template page. |
| `/` (marketing landing) | Compact | "Featured template" widget, pointing to the latest template |
| `/docs/*` (inline example) | Compact | When a doc references a template, the button can be inline |
| `/blog/[slug]` (inline example) | Compact | Same — blog posts can showcase templates |

The default gallery case (the `[slug]` page) is the **must-have**. Everything else is opportunistic.

## Variants roadmap

| Variant | When | Description |
|---|---|---|
| **Default** (gallery CTA) | MVP | Black, white text, "Deploy to Vercel →" |
| **Compact** (inline) | MVP | Outlined, smaller |
| **"Copy CLI command"** | TBD | Instead of Vercel, copies `npx @deessejs/cli init my-app --template <slug>` to clipboard. Bridges the gallery to the agent-first CLI. |
| **"Deploy to DeesseJS Cloud"** | When Cloud ships | Same shape as default, but the URL points to Cloud instead of Vercel |
| **"Open in CodeSandbox"** | Future | When a template has a CodeSandbox config, this variant is added |
| **"Open in StackBlitz"** | Future | Same shape |

The "Copy CLI command" variant is the **agent-first bridge** — it's the path for an agent that scraped the gallery to get the CLI command for free. See [`../12-apps/cli/architecture.md#agent-first-contract`](../12-apps/cli/architecture.md#agent-first-contract).

## Boundaries — what this doc doesn't cover

- The `<DeployButton>` is rendered on the template page. Page layout is in [`templates-gallery.md`](./templates-gallery.md).
- The `manifest.json` schema (which provides the `template` prop) is in [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md).
- The Vercel Deploy Button documentation is upstream; we consume its contract, not modify it.
- DeesseJS Cloud's Vercel Marketplace integration (which lights up the `stores` parameter) is a separate workstream in the Cloud docs.

## Cross-references

- [`./templates-library.md`](./templates-library.md) — index
- [`./templates-gallery.md`](./templates-gallery.md) — where this component is rendered
- [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md) — the `manifest.json` schema
- [`../01-stack/`](../01-stack/) — design system & component library conventions
- [`../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md`](../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md) — Vercel Templates research, specifically the `stores` parameter discovery
- [`https://vercel.com/docs/deploy-button`](https://vercel.com/docs/deploy-button) — upstream contract we consume
