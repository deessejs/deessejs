# `@workspace/cookies`

Cookie consent system for the SaaS template.

## What's included

- **Zustand store** — framework-agnostic, handles persistence, hydration, and consent versioning
- **`CookieConsent`** — banner + preferences modal (React component)
- **`CookiePreferencesButton`** — opens preferences modal from anywhere (footer, settings page)
- **`ConsentScript`** — wraps `next/script`, only loads scripts when consent is given
- **`CookiePolicy`** — default cookie policy page content (can be used as-is or replaced)

## Usage

### App layout

```tsx
// app/layout.tsx
import { CookieConsent } from "@workspace/cookies"
import { Toaster } from "@workspace/ui/components/sonner"

export default function Layout({ children }) {
  return (
    <>
      {children}
      <CookieConsent />
      <Toaster />
    </>
  )
}
```

### Open preferences from footer

```tsx
// app/footer.tsx
import { CookiePreferencesButton } from "@workspace/cookies"

export function Footer() {
  return (
    <footer>
      <nav>
        <CookiePreferencesButton />
      </nav>
    </footer>
  )
}
```

### Gate third-party scripts on consent

```tsx
import { ConsentScript } from "@workspace/cookies"

<ConsentScript
  category="analytics"
  src="https://example.com/analytics.js"
  strategy="lazyOnload"
/>
```

### Cookie policy page

```tsx
// app/cookies/page.tsx
import { CookiePolicy } from "@workspace/cookies"

export default function CookiesPage() {
  return <CookiePolicy />
}
```

## Consent categories

| Category | Default | Description |
|---|---|---|
| `functional` | always on | Strictly necessary cookies |
| `analytics` | off | Analytics and tracking |
| `marketing` | off | Marketing and ads |

## GDPR compliance

- Consent is opt-in (non-essential categories default to off)
- Consent is versioned — changing categories re-prompts users
- Users can withdraw consent at any time via the preferences button
- `ConsentScript` prevents non-essential scripts from loading without consent

## Architecture

The Zustand store is framework-agnostic — no Next.js imports. Only `ConsentScript` depends on `next/script`. All other exports work in any React environment.
