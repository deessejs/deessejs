---
name: reference-next16-apps-web-quirks
description: Next 16 options in apps/web/next.config.ts that look optional but are load-bearing
metadata:
  type: reference
---

Every line in `apps/web/next.config.ts` is load-bearing. None of these are "nice to have":

```ts
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  serverExternalPackages: ["shiki"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@workspace/ui", "tw-animate-css"],
};

export default withContentCollections(nextConfig);  // OUTERMOST wrapper, no await
```

## Why each option matters

1. **`pageExtensions: ["ts","tsx","js","jsx","md","mdx"]`** — Without `md,mdx`, content-collections cannot compile posts/releases, and Next won't route the (content) group. Removing any of these breaks the blog/changelog.

2. **`serverExternalPackages: ["shiki"]`** — shiki 3 is ESM-only and bundles WASM (oniguruma). If Turbopack/Webpack tries to bundle it, HMR crashes with "Module not found" on `shiki/dist/*`. Marking it external lets Next use Node's native ESM resolver.

3. **`allowedDevOrigins: ["127.0.0.1","localhost"]`** — Next 16 blocks cross-origin dev resources by default (security tightening). Without this, `pnpm dev` works on `localhost` but fails when accessed via `127.0.0.1` or via a LAN IP from another device.

4. **`transpilePackages: ["@workspace/ui","tw-animate-css"]`** — Workspace deps and the Tailwind animate plugin need explicit transpile. Without these, Turbopack raises "Module not found" or returns unstyled output.

5. **`withContentCollections(nextConfig)` is OUTERMOST and NOT awaited** — Upstream issue #690. The maintainer-recommended pattern is `export default withContentCollections(...)` — Next awaits the Promise itself. If you `await withContentCollections(...)` first or wrap with another async plugin outside, the types break under Next 16 strict and dev server hangs.

## Adjacent gotchas (not in next.config.ts but in the same file family)

- `apps/web/CLAUDE.md` warns: "This is NOT the Next.js you know". Read `node_modules/next/dist/docs/` for any routing/server-action change.
- `apps/web/tsconfig.json` paths include `"content-collections": ["./.content-collections/generated"]` — this path is created by content-collections at build/dev time. Don't add it to `.gitignore` (already excluded via `**/.next` rules).

**How to apply:** Treat `next.config.ts` as a contract, not a config. Adding a new option is fine; removing or rearranging one of these WILL break the dev server or the blog.

Related: [[feedback-next16-read-node-modules-docs]], [[project-content-collections-engine]]