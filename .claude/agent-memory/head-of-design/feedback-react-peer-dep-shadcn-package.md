---
name: feedback-react-peer-dep-shadcn-package
description: shadcn-style UI package in a monorepo MUST declare react and react-dom as peerDependencies (and as devDependencies for the package's own type-checking), otherwise the package's TS check fails the moment a new file imports React
metadata:
  type: feedback
---

# React peer dep for shadcn monorepo packages

**Rule:** A design-system package (e.g. `@workspace/ui`) that exports React components MUST declare `react` and `react-dom` as BOTH `peerDependencies` AND `devDependencies` in its `package.json`.

```json
{
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "react": "^19",
    "react-dom": "^19",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}
```

**Why:** The shadcn convention is that `react` is provided by the consumer, not the package. As a peer dep, the consumer (`apps/web`) must declare it. As a dev dep, the package's own TypeScript check (when walked by Next.js or any bundler) can resolve the React types.

**How to apply:**
- Any shadcn-style monorepo UI package needs this. Without it, the build fails the moment a new component file (e.g. `theme-provider.tsx`) is added that imports React — even if existing components also import React but haven't triggered a fresh TS walk.
- Symptom of missing: `Type error: Cannot find module 'react' or its corresponding type declarations.` on a freshly added file inside the package, with the file correctly using `import * as React from "react"`.
- Use the consumer's React version (check `apps/web/package.json`) to set the version range.
- See [[feedback-shadcn-monorepo-setup]] for the broader package setup.
