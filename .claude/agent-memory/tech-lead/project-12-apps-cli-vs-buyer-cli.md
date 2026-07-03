---
name: project-12-apps-cli-vs-buyer-cli
description: Distinction between the proposed deesse init CLI and the existing buyer-facing CLI in apps/template/apps/cli/; different repos, different stacks, different audiences
metadata:
  type: project
---

Easy confusion point. Two CLIs in the DeesseJS ecosystem, completely separate.

## The two CLIs

| Aspect | Init CLI (new, proposed) | Buyer CLI (existing, in [[project-deessejs-process-docs]]) |
|---|---|---|
| Folder | `documents/internal/architecture/12-apps/cli/` (docs only at the moment) | `apps/template/apps/cli/` (lives inside the template product) |
| Repo | Will live in separate repo `deessejs/deesse` (proposed) | Lives inside `deessejs/deessejs` (the main monorepo) |
| ADR | Local ADR 0002 (proposed) | System ADR 0002 (Accepted 2026-06-17) |
| Audience | **New DeesseJS adopters** (developers running `npx`) | **Buyer's end users** (non-developers, designers, ops folks) |
| Purpose | Scaffold a new DeesseJS project from a template repo | Talk to the buyer's deployed service via `@deessejs/sdk` |
| Distribution | npm package, installed via `npx` | Bun single-binary, downloaded from GitHub releases |
| Runtime | Node.js (≥ 22.12) | Bun (for dev + build) |
| Bin name | TBD: `deesse` or `create-deessejs` | `deessejs` |
| Stack | mri + clack + giget + nypm + cross-spawn + picocolors + detect-agent | commander + @deessejs/sdk (per system ADR 0002) |
| CI | npm publish flow | 4-binary matrix (linux-x64, darwin-x64, darwin-arm64, windows-x64) |
| Deps | Zero from the template's `packages/*` | Consumes `@deessejs/sdk` from the template's workspace |
| Release cadence | Independent (CLI v0.1 → v0.2 → v1.0) | Tied to template product releases |

## How to know which is which in conversation

- "the CLI" + scaffold/init/template context → **init CLI**
- "the CLI" + buyer/SDK/RPC/binary context → **buyer CLI**
- When in doubt, ask. But default to: the founder is talking about the init CLI if they say "deesse init" or "templates"; they're talking about the buyer CLI if they say "binaries" or "user-facing for buyers".

## Why both exist

The buyer CLI is the thing a buyer's customer downloads to interact with the buyer's product. The init CLI is the thing a new DeesseJS user runs once to get a starting project. Different audiences, different deployment models, different stacks. The only thing they share is the word "CLI".
