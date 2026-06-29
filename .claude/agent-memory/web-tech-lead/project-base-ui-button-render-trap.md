---
name: project-base-ui-button-render-trap
description: Base UI Button requires nativeButton={false} when render={<Link/>} or render={<a/>} — otherwise dev warning every render
metadata:
  type: project
---

In `apps/web/`, the shadcn/ui CLI v4 generates `Button` from Base UI, not Radix. Base UI's Button has a `nativeButton` prop that defaults to `true` — which renders a real `<button>` element.

When you use the polymorphic `render` prop to swap the underlying element for `<Link>` or `<a>`, you MUST pass `nativeButton={false}`:

```tsx
// ❌ Wrong — dev console fills with "nativeButton must be false when render is set"
<Button render={<a href="#pricing" />}>Start building</Button>

// ✅ Right
<Button nativeButton={false} render={<a href="#pricing" />}>Start building</Button>

// ✅ Right with Next Link
<Button nativeButton={false} render={<Link href="/docs" />}>Read the docs</Button>
```

## Why

Base UI's Button enforces a11y: if you supply `render={<a/>}` or `render={<Link/>}` but don't set `nativeButton={false}`, it logs a dev-only warning every render that says the underlying button semantics conflict with the rendered element. It's not fatal, but it floods the console and hides real warnings.

In production it's stripped, so you might not notice until QA tests on dev.

## Where this is already correct in apps/web

`apps/web/src/app/(unprotected)/(marketing)/page.tsx` already follows this pattern in 3 places (hero CTA, CTA section buttons, pricing card "Get" button). When you copy/paste those buttons, the `nativeButton={false}` travels with them.

## Where to watch

- New auth cards (`src/components/auth/*.tsx`) — keep the pattern
- New CTAs anywhere in `(unprotected)/` — keep the pattern
- `packages/ui/src/components/ui/button.tsx` — DO NOT add a default `nativeButton={false}` here; Base UI's safety check would be bypassed and you'd silently ship a button-in-anchor in some other consumer

**How to apply:** Every time you write or modify a `<Button>` with a `render` prop, set `nativeButton={false}` explicitly. Don't rely on auto-fix or default exports.

Related: [[project-shadcn-final-state]] (Base UI is the chosen renderer for shadcn CLI v4 in this monorepo)