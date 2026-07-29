# `<DemoButton>` — the friction-free preview component

The sibling of `<DeployButton>`. While Deploy says "fork this and make it yours", Demo says "see it in action first". The DemoButton is the **friction-free** CTA — no OAuth, no env vars, no repo setup — just a click and a new tab opens to a running instance of the template.

Date: 2026-07-02.

## Purpose

Document the `<DemoButton>` component contract: prop signature, URL semantics, edge cases, visual specs, accessibility, tests. Parallel structure to [`deploy-button.md`](./deploy-button.md) — same shape, different behavior.

## Why this component exists

Users browsing the templates gallery fall into two camps:

1. **"I'm building something, I want to start here"** → clicks `<DeployButton>`. OAuth, fork, setup, build. High commitment.
2. **"I'm comparing, I want to see this in action first"** → wants to click once and see the template rendered live. Zero commitment.

Camp 2 is **larger** than camp 1 at the discovery phase (most gallery visitors aren't ready to commit). Without a Demo CTA, camp 2 users either bounce (lost conversion) or copy the repo manually and run it themselves (friction we imposed for no reason).

The DemoButton makes the "see first, decide later" path friction-free.

## Component signature

```tsx
// packages/ui/src/demo-button.tsx

interface DemoButtonProps {
  /**
   * The demo URL. Either:
   * - A string URL (https://demo.template.deessejs.com)
   * - A DemoDescriptor object from manifest.json (resolved from the registry)
   * Required.
   */
  demo: string | DemoDescriptor

  /**
   * Variant. Default = primary paired with DeployButton. "compact" = inline use.
   */
  variant?: 'default' | 'compact'

  /**
   * Custom click handler. Receives the resolved URL as the first argument.
   * Useful for analytics before navigation.
   */
  onClick?: (url: string) => void

  /**
   * Children. If provided, replaces the default "See live demo →" label.
   * Default label matches the Vercel templates UX pattern.
   */
  children?: React.ReactNode
}

interface DemoDescriptor {
  /** The demo URL — required */
  url: string
  /** GitHub branch the demo was deployed from (for transparency) */
  branch?: string
  /** ISO timestamp of last deployment (for staleness signal in UI) */
  lastDeployed?: string
  /** Provider hosting the demo — "vercel", "codesandbox", etc. */
  provider?: 'vercel' | 'codesandbox' | 'other'
}
```

## URL semantics

The DemoButton is a plain `<a>` link. No query params to compose (unlike DeployButton — there is no orchestrator on the other side). The URL comes directly from `manifest.json.demo.url`.

### Source of truth

```json
// In templates-registry/templates/starter.json (the manifest.json)
{
  "name": "Starter",
  "demo": {
    "url": "https://starter.demo.deessejs.com",
    "branch": "main",
    "lastDeployed": "2026-07-01T12:00:00Z",
    "provider": "vercel"
  }
}
```

### Who hosts the demo

| Phase | Hosting | Mechanism |
|---|---|---|
| **MVP** | Manual by DeesseJS team | Engineer deploys the template to a known Vercel project (`deessejs-demo-starter`), copies the URL into `manifest.json` |
| **M0.2** | Auto on template repo CI | A GitHub Action on each `deessejs/template-*` repo deploys on every push to `main`. Deploy URL fed back to `templates-registry` via API |
| **M1+** | Per-version demos | `demos: [{ label: "v0.3.0", url: "..." }, { label: "v0.2.0", url: "..." }]` — let users preview any version |

The MVP is fully manual but the schema already accommodates the auto-fed case (the `branch` and `lastDeployed` fields exist for the CI to fill in).

### What "demo" means (vs the user's own deploy)

| Surface | Demo (this component) | User's deploy (DeployButton) |
|---|---|---|
| **Repo** | `deessejs/template-starter` (the template's own repo) | The user's fork of it |
| **Owner** | DeesseJS team | The user |
| **Env vars** | Pre-configured with demo values (or noop'd) | User provides their own (DB keys, Stripe keys) |
| **Data** | Ephemeral, may reset on redeploy | Persistent |
| **URL** | `demo.deessejs.com` or `template-{slug}.vercel.app` | `my-project-7k2x.vercel.app` (random) |

The demo is **not** for production use. It's a "what does this look like running" preview. We display this in the demo's footer or in the button's tooltip.

## Visual specs

### Default variant (paired with DeployButton)

The pair looks like this:

```
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│  Deploy to Vercel →            │  │  See live demo ↗            │
└─────────────────────────────────┘  └──────────────────────────────┘
   primary (filled)                   secondary (outlined)
```

- **Size**: same height as `<DeployButton>` (≥ 48px), so they align.
- **Color**: secondary. White background, black border, black text. The DeployButton is primary, this is secondary.
- **Copy**: "See live demo ↗" (external-link arrow, signals "leaving for a different site").
- **Hover**: subtle background tint (e.g. light gray on the white background).
- **Focus visible**: same focus ring convention as DeployButton.

### Compact variant (cards, inline)

- **Size**: ≥ 36px height.
- **Color**: text-only or minimal underline. Used inline in copy like "Already running: **See live demo →**".
- **Copy**: "View demo ↗"

### Staleness signal

If `manifest.json.demo.lastDeployed` is older than 90 days, the DemoButton shows a subtle indicator:

```
See live demo ↗ · last deployed 4 months ago
```

This is honesty UX — we don't want users clicking a link to a broken demo. The timestamp comes from the registry, which is re-validated on each deploy.

## Accessibility

Same requirements as `<DeployButton>`:

| Requirement | Implementation |
|---|---|
| **Keyboard** | Plain `<a>`, focusable, Enter triggers navigation |
| **Screen reader** | `aria-label="View live demo of template <name> (<provider>)"` |
| **Focus** | Visible focus ring matching design system |
| **Color contrast** | WCAG AA. Outlined-on-white = ~7:1 contrast, comfortable |
| **Reduced motion** | Hover tint is instant, no transitions; respects `prefers-reduced-motion` |

## Tests

```ts
describe('<DemoButton>', () => {
  it('renders a link to the demo URL', () => {})
  it('opens in a new tab by default', () => {})
  it('includes rel="noopener noreferrer" for external links', () => {})
  it('renders default copy when no children provided', () => {})
  it('renders custom children when provided', () => {})
  it('shows staleness indicator when lastDeployed > 90 days ago', () => {})
  it('hides staleness indicator when lastDeployed is recent', () => {})
  it('has accessible aria-label with template name and provider', () => {})
  it('fires onClick with the resolved URL before navigation', () => {})

  // Snapshot tests
  it('matches snapshot for default variant', () => {})
  it('matches snapshot for compact variant', () => {})
  it('matches snapshot for stale demo (>90 days)', () => {})

  // Accessibility
  it('passes axe checks for default variant', () => {})
})
```

Plus an E2E:

```ts
test('Demo button on /templates/starter navigates to the demo URL', async ({ page }) => {
  await page.goto('/templates/starter')
  const demoLink = page.getByRole('link', { name: /live demo/i })
  await expect(demoLink).toHaveAttribute('href', /demo\.deessejs\.com/)
})
```

## Locations of use

| Location | Variant | Paired with |
|---|---|---|
| `/templates/[slug]` (hero, primary CTA row) | Default | `<DeployButton>` side-by-side |
| `/templates/[slug]` (footer) | Default | (optional) repeat for users who scroll |
| `/templates` (card) | Compact | Display only if demo is set. Default template cards without demo just hide the demo link. |
| `/` (marketing landing, featured template card) | Compact | Standalone, no DeployButton there |
| `/blog/[slug]` (when post showcases a template) | Compact | Optional |
| `/docs/*` (when doc references a template) | Compact | Inline text reference |

The MVP must-haves: the hero CTA on `/templates/[slug]` (paired with Deploy) and the card on `/templates` (compact, conditional on demo availability).

## Variants roadmap

| Variant | When | Description |
|---|---|---|
| **Default** (hero CTA) | MVP | Outlined, "See live demo ↗" |
| **Compact** (card / inline) | MVP | Text or minimal underline, "View demo ↗" |
| **"Demo + source diff"** | Post-MVP | Side-by-side iframe: live demo on left, source on right. Power-user tool. |
| **"Run in CodeSandbox"** | Future | If the template has a CodeSandbox config, button variant generates the CSB URL |
| **"Run in StackBlitz"** | Future | Same shape, different provider |

## Demonstrating the "no-commit" path vs the "commit" path

The hero of `/templates/[slug]` is the moment of choice. The two-button layout is intentional:

```
                  Deploy to Vercel →     See live demo ↗
                  (commit, 2 minutes)    (peek, 0 seconds)
                  primary                secondary
```

Copy the user is reading at this moment:

> The Starter template gives you auth, a Postgres-backed database, transactional mail, and a billing layer out of the box. **Deploy** to fork it into your own GitHub and customize, or **see the live demo** first to know what you're getting.

The second sentence is the bridge — the user understands both options before clicking.

## Failure modes

| Scenario | Behavior |
|---|---|
| Demo URL returns 404 | The team gets alerted (Plausible tracks demo clicks + we can ping the URL weekly). Template card hides the demo link until fixed |
| Demo URL is slow / flaky | Demo is on the team's Vercel org, not ours — if Vercel is down, the button still works but loads slowly. We display no "loading" state on the button itself (the target page handles it) |
| User clicks Demo but has JS disabled | It's a plain `<a>`, so it works without JS. (Server-rendered component, matches DeployButton's no-JS design) |
| Demo is `null` or missing in manifest | Button not rendered. The template page shows only the DeployButton. The card on the gallery hides the demo link silently |
| Demo is more than 6 months stale | Badge says "demo may be outdated" instead of "see live demo". User can still click, but with eyes open |

## Boundaries — what this doc doesn't cover

- The `<DeployButton>` contract (in [`./deploy-button.md`](./deploy-button.md))
- The gallery's rendering of these buttons in a CTA row (in [`./templates-gallery.md`](./templates-gallery.md))
- The `manifest.json.demo` field schema (in [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md))
- The hosting strategy for demos (CD-side concern, lives in Cloud or deployment docs)
- The blog / docs use cases (separate surfaces, this doc only covers the templates library)

## Cross-references

- [`./templates-library.md`](./templates-library.md) — index doc (4 surfaces now)
- [`./deploy-button.md`](./deploy-button.md) — the sibling conversion component
- [`./templates-gallery.md`](./templates-gallery.md) — where both buttons render
- [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md) — the `manifest.json.demo` field spec
- [`../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md`](../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md) — Vercel pattern that inspired this (their templates all have a live demo link)
