<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git workflow — staging-first

This repo uses a **staging-first** workflow. All development happens against `staging`, never directly against `main`.

```
feature/fix branch  ─PR─▶  staging  ─merge (manual, human)─▶  main  ─▶  release
```

**Rules:**

- **Base new work on `staging`** — `git checkout staging && git pull && git checkout -b my-branch`
- **PRs always target `staging`** — `gh pr create --base staging`
- **`staging → main` is the release path** — done manually by a human, after CI green and review approval
- **Never push directly to `main`** — even for hotfixes, branch from `staging` and PR there
- **Never merge a PR into `main` from the agent** — `main` is owned by the human release process

**Why this exists:**

- `staging` is the integration branch — multiple PRs land there, get tested together, surface interaction bugs
- `main` reflects release-ready state — only updated via deliberate human promotion
- The release workflow (changesets → version bump → publish) triggers on push to `main`
- Decoupling "incoming work" from "release surface" prevents a broken `main` blocking all deploys

**Skills assume this flow:** `/spec`, `/implement`, `/create-pr`, `/review-pr` all reset to `staging` first and open PRs against `staging`. If you find any skill referencing `main` as a base or PR target, that's a bug — fix it.

**Branch naming:**

- `impl/{n}-{slug}` for issue-driven work (`/spec`, `/implement`) — e.g. `impl/18-fix-ready-endpoint-db-ping`
- `chore/{slug}` for chores, refactors, infra — e.g. `chore/setup-staging-workflow`
- `fix/{slug}` for unsolicited bug fixes

### Better-Auth guides

Pattern senior pour better-auth dans ce repo. **Lis toujours `docs/guides/better-auth/index.md` en premier** avant de modifier `packages/auth` ou `packages/database/src/schema/auth.ts`.

| Guide | Contenu |
|---|---|
| [docs/guides/better-auth/index.md](docs/guides/better-auth/index.md) | Décisions verrouillées + état du code — **point d'entrée obligatoire** |
| [docs/guides/better-auth/setup.md](docs/guides/better-auth/setup.md) | Config de base, drizzle-adapter, secrets, trustedOrigins |
| [docs/guides/better-auth/hooks.md](docs/guides/better-auth/hooks.md) | `databaseHooks`, ordering, fire-and-forget |
| [docs/guides/better-auth/org.md](docs/guides/better-auth/org.md) | Organization plugin, auto-create org, invitations, rôles |
| [docs/guides/better-auth/email.md](docs/guides/better-auth/email.md) | Email verification, password reset, Resend + console dev |
| [docs/guides/better-auth/session.md](docs/guides/better-auth/session.md) | Session config, cookies, expiration, trustedOrigins |
| [docs/guides/better-auth/client.md](docs/guides/better-auth/client.md) | Hooks React, `useActiveOrganization`, workaround #9710 |
| [docs/guides/better-auth/pitfalls.md](docs/guides/better-auth/pitfalls.md) | Bugs ouverts (#9070, #9710), options supprimées, gotchas — **à lire AVANT toute implémentation** |

### Fresh CLI 

`fresh` is a CLI for AI-powered web search and fetch, backed by Exa.ai.

**Subcommands:**
- `fresh auth login [--no-open]` — device authorization flow. `--no-open` skips auto-opening the browser.
- `fresh auth logout` — sign out and clear stored credentials.
- `fresh auth status` — check whether the token is valid.
- `fresh auth whoami` — show current user info.
- `fresh search -q <text> [-l <n>] [-t <type>]` — web search.
  - `-l/--limit` default 10
  - `-t/--type`: `auto` (default), `fast`, `deep-lite`, `deep`, `deep-reasoning`, `instant`
- `fresh fetch <url> [-p <prompt>]` — fetch and extract content from a URL; optional `-p/--prompt` steers extraction.

**Auth state to watch:** if `fresh auth status` reports "Token expired", run `fresh auth login` (with `--no-open` if you want to open the browser URL manually).

**Notes:**
- General help via `fresh --help` and per-command via `fresh <cmd> --help`.
- Version via `fresh --version`.
