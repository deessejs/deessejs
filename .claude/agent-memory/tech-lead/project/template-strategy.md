---
name: template-strategy
description: GitHub template repo strategy — changesets NOT needed, CI/dx yes
metadata:
  type: project
---

# Template Strategy — saas-template

## Distribution

**GitHub Template Repo** ("Use this template" button). Users fork/clone → own git history.

→ Changesets brings NO value to end users (each copy = fresh repo)

## Planned Structure

```
packages/
├── database/    # drizzle ORM
├── auth/        # better-auth
└── api/         # honojs + orpc

apps/
├── web/         # Next.js (existing)
├── app/         # Next.js app router
└── docs/        # fumadocs
```

## Features by Audience

| Feature | End User | Maintainer |
|---|---|---|
| CI (lint/typecheck/build) | ✅ Yes | ✅ Yes |
| pnpm workspaces + catalogs | ✅ Yes | ✅ Yes |
| turbo.json | ✅ Yes | ✅ Yes |
| .env.example | ✅ Yes | ✅ Yes |
| CODEOWNERS | ✅ Yes | ✅ Yes |
| Remote cache | ❌ Optional | ❌ Optional |
| changesets | ❌ No | ⚠️ Maybe (template changelog) |
| turbo prune | ⚠️ If Docker | ⚠️ If Docker |
