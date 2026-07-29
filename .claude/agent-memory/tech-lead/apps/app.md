---
name: app-architecture
description: apps/app — authenticated app (login/signup/dashboard/settings), separate Next.js deploy from apps/web
metadata:
  type: project
---

# apps/app — Authenticated app

**Role**: authenticated app only. Login, signup, dashboard, settings. Separate Next.js deploy from [[web-architecture]].

- Public marketing / blog / changelog / legal pages live in `apps/web`, NOT here.
- When `apps/web` links to `/login` or `/signup`, those routes live in this app.
- Both apps share `packages/ui` for components and `packages/ui/lib/config` for `APP_CONFIG`.

## Route group structure

```
app/
├── layout.tsx                  ← root: ThemeProvider + TooltipProvider + globals.css
├── (unprotected)/
│   ├── layout.tsx              ← SiteHeader wrapper (public pages)
│   └── (auth)/
│       ├── layout.tsx          ← centered auth card (max-w-md)
│       ├── login/page.tsx       → /login
│       └── signup/page.tsx     → /signup
└── (protected)/
    ├── layout.tsx              ← SidebarProvider + AppSidebar + SidebarInset + SidebarTrigger
    ├── home/page.tsx            → /
    └── settings/page.tsx       → /settings
```

## Auth check (disabled for now, ready to re-enable)

In `(protected)/layout.tsx` — pattern validated by Next.js 16 docs:

```tsx
const session = await auth.api.getSession({ headers: await headers() })
if (!session) redirect("/login")
```

## Sidebar

Built from **shadcn sidebar-07 block** (`npx shadcn@latest add sidebar-07`).

### Files

```
apps/app/components/sidebars/
├── app-sidebar.tsx       ← main wrapper, data provider
├── team-switcher.tsx     ← org/team switcher dropdown
├── nav-main.tsx          ← collapsible nav sections
├── nav-projects.tsx      ← project list with actions
└── nav-user.tsx          ← avatar dropdown (account, billing, logout)
```

### Key patterns

- `SidebarHeader className="flex h-14 flex-row items-center border-b p-0"` — h-14 + flex-row overrides shadcn default `flex-col gap-2 p-2`
- `SidebarFooter className="border-t"` — same override pattern
- TeamSwitcher logo: `Image` from `next/image` (not Radix Avatar), uses `logoUrl: string` prop
- NavUser: `AvatarImage` from Radix, builds Vercel avatar URL from `username`

### Vercel avatar URL pattern

```
https://vercel.com/api/www/avatar?s=40&u=${username}&dpl=dpl_AS99V7XmtTzE4xdb72tYFtNTVV48
```

- Org logo: `s=128`, `u=${encodeURIComponent(APP_NAME)}`
- User avatar: `s=40`, `u=${user.username}`

## Shared config

`packages/ui/src/lib/config.ts` — consumed by all apps:

```ts
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "SaaS Template",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "...",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: { home, login, signup, settings },
} as const
export const APP_NAME = APP_CONFIG.name
```

Consumed as `import { APP_CONFIG, APP_NAME } from "@workspace/ui/lib/config"`.

## Shared imports to avoid

- `@/lib/config` — deprecated, use `@workspace/ui/lib/config`
- `@/hooks/use-mobile` — doesn't exist in apps, use `@workspace/ui/hooks/use-mobile`
- `lucide-react` must be in catalog (`packages/ui` and `apps/app` both have it)

Related: [[stack]] (Tailwind v4 + pnpm allowBuilds gotchas)
