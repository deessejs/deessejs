---
name: reference-content-collections-next16-mdx-wrapper
description: content-collections @content-collections/mdx/react MDXContent fails silently in Next 16 RSC (server.js uses new Function); requires "use client" wrapper to render MDX in browser
metadata:
  type: reference
---

# content-collections + Next 16: MDXContent needs a client wrapper

## TL;DR

In Next 16 + React 19.2 + Turbopack, `<MDXContent code={mdxCode} />` from `@content-collections/mdx/react` (when used as a server component) renders the markdown source as plain text instead of compiled HTML. The cause: `dist/react/server.js` uses `new Function(code)` to compile the MDX at render time, and Next 16's RSC runtime blocks this silently.

**Fix:** wrap MDXContent in a "use client" component so it loads `dist/react/client.js` (which uses `useMemo` + `getMDXComponent` from mdx-bundler, both browser-safe).

```tsx
// src/components/blog/mdx-renderer.tsx
"use client";
import { MDXContent } from "@content-collections/mdx/react";
export function MdxRenderer({ code }: { code: string }) {
  return <MDXContent code={code} />;
}
```

Use `<MdxRenderer code={post.mdxCode} />` in server components.

## Why this happens

`@content-collections/mdx` (0.2.2) exports `@content-collections/mdx/react` with conditional exports:

```json
"./react": {
  "types": "./dist/react/client.d.ts",
  "react-server": "./dist/react/server.js",
  "import": "./dist/react/client.js",
  "require": "./dist/react/client.cjs"
}
```

- **server.js** uses `new Function(...scopeKeys, code)` to evaluate the compiled MDX at render time.
- **client.js** uses `useMemo` + `getMDXComponent` from `mdx-bundler/client`, also `new Function` internally but runs in the browser where it works.

In Next 16 RSC, the server.js path is picked, and `new Function` fails silently — the result is the raw `code` string rendered as text instead of compiled HTML.

## How to apply

- When integrating content-collections MDX in a Next 16 app, ALWAYS wrap `<MDXContent>` in a "use client" component. Don't import directly into a server component page.
- The `code` string is serializable so it crosses the server/client boundary cleanly.
- Don't need `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, or `mdx-components.tsx` at the project root. The content-collections pipeline is self-contained.
- The `compileMDX(context, document, options)` transform call uses mdx-bundler internally and works in the build pipeline (no Next 16 conflict).

## Symptoms to recognize

- Build succeeds, page loads, but `<MDXContent code={...} />` renders the markdown source as plain text (you see `# Headers` literally instead of `<h1>Headers</h1>`).
- No error in the console — silent failure.
- Same setup works in older Next.js (13, 14, 15) — the regression is specific to Next 16 RSC.

## What NOT to try

- Don't switch to `@content-collections/mdx/react/server` explicit import — it's the broken path.
- Don't add `@mdx-js/loader` or `@next/mdx` — not needed and creates Turbopack loader config pain.
- Don't manually invoke `new Function(code)` server-side — same block, just less convenient.
- Don't downgrade content-collections — the issue is Next 16 RSC, not the engine.