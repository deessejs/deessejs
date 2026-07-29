---
name: nextjs-proxy
description: Next.js 16 renames middleware.ts to proxy.ts — correct filename for auth guard
metadata:
  type: reference
---

# Next.js 16 — proxy.ts (formerly middleware.ts)

**Source:** [Next.js docs - File-system conventions: proxy.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

## Convention

In **Next.js 16+**, the middleware file convention has been renamed from `middleware.ts` to `proxy.ts`.

| Version | Filename | Export Function | Config |
|---------|----------|-----------------|--------|
| Next.js 14-15 | `middleware.ts` | `middleware()` | `config` |
| **Next.js 16+** | `proxy.ts` | `proxy()` | `config` |

## Location

Same rules as middleware:
- Root of project (same level as `app/` or `pages/`)
- Or inside `src/` if using src layout

## Example

```tsx
// proxy.ts (root of project, NOT inside app/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Auth, redirects, rewrites, etc.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

## apps/app Implementation

`apps/app/proxy.ts` is the auth guard:
- Protects `/home` and `/settings` routes (redirects to `/login` if not authenticated)
- Redirects authenticated users away from auth pages (`/login`, `/signup`, etc.)
- Validates email verification status

**Why NOT a bug:** This is correct Next.js 16 naming.

## Gotchas

- `proxy.ts` must be at the **project root** or `src/` root — NOT inside `app/`
- Export must be named `proxy` (not `middleware`)
- `config.matcher` is optional but recommended to avoid running on static assets
