# `00-system-overview/` — High-level architecture

## Purpose

The top of the architecture documentation tree. This folder holds the **system-level views** that anyone should read first: who the system serves, what containers it runs, and where each piece lives.

The goal: a new contributor (or our future selves in 6 months) can land here, read two diagrams, and understand the shape of DeesseJS.

## What's in here

- `c4-context.md` — C4 level 1: actors (buyer, buyer's end users, operators) and the system boundary.
- `c4-containers.md` — C4 level 2: the runnable units (Next.js app, public API, jobs, realtime workers, control plane if Cloud).
- `deployment-view.md` — where each container runs in production (Vercel, Cloudflare, Upstash, etc.) and the network between them.

## Conventions

- Diagrams: Mermaid (renders in GitHub, Fumadocs, and most viewers). No external image uploads.
- One view per file. If a diagram needs more than ~150 lines of Mermaid, split it.
- Keep these files **narrative**, not exhaustive. Details live in `01-stack/` and `02-data-model/`.

## Related

- [`../product/architecture.md`](../../product/architecture.md) — the **product-facing** architecture doc (rationale for buyers, dependency graph, modular contract). Different audience, different level.
- [`01-stack/`](../01-stack/) — per-technology rationale.
- [`02-data-model/`](../02-data-model/) — the data layer.
- [`07-deployment/`](../07-deployment/) — concrete deployment targets and env vars.
