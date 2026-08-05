<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

This repo is the **DeesseJS main app** — the monorepo that powers the deessejs organization. Started from [`deessejs/saas-template`](https://github.com/deessejs/saas-template) in July 2026. See [docs/engineering/plans/saas-template-divergence.md](docs/engineering/plans/saas-template-divergence.md) for the divergence map and [docs/engineering/plans/deessejs-main-app-repositioning.md](docs/engineering/plans/deessejs-main-app-repositioning.md) for the identity-surface plan.

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

Senior pattern for better-auth in this repo. **Always read `docs/guides/better-auth/index.md` first** before modifying `packages/auth` or `packages/database/src/schema/auth.ts`.

| Guide | Content |
|---|---|
| [docs/guides/better-auth/index.md](docs/guides/better-auth/index.md) | Locked decisions + code state — **mandatory entry point** |
| [docs/guides/better-auth/setup.md](docs/guides/better-auth/setup.md) | Base config, drizzle-adapter, secrets, trustedOrigins |
| [docs/guides/better-auth/hooks.md](docs/guides/better-auth/hooks.md) | `databaseHooks`, ordering, fire-and-forget |
| [docs/guides/better-auth/org.md](docs/guides/better-auth/org.md) | Organization plugin, auto-create org, invitations, roles |
| [docs/guides/better-auth/email.md](docs/guides/better-auth/email.md) | Email verification, password reset, Resend + console dev |
| [docs/guides/better-auth/session.md](docs/guides/better-auth/session.md) | Session config, cookies, expiration, trustedOrigins |
| [docs/guides/better-auth/client.md](docs/guides/better-auth/client.md) | React hooks, `useActiveOrganization`, workaround #9710 |
| [docs/guides/better-auth/pitfalls.md](docs/guides/better-auth/pitfalls.md) | Open bugs (#9070, #9710), removed options, gotchas — **read BEFORE any implementation** |

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

### Internal packages (@deessejs/*)

`@deessejs/errors` and `@deessejs/fp` are our org's internal early-life packages (maintained by martyy-code + codewizdave). They evolve only based on our needs.

**Rules:**

- **File upstream issues, not local workarounds.** When these packages make something awkward for our usage, open an issue on the upstream repo (`github.com/deessejs/errors`, `github.com/deessejs/fp`) before patching locally. Even if waiting for the fix costs dev time — that is the cost of an internal shared codebase.
- **Version checks on user signal only.** The user will tell us when to look at new versions. Do not auto-monitor releases, do not propose upgrades unprompted, do not run `npm outdated` for these packages proactively.
- **Format upstream issues with consumer context** — name the app/package in our repo where it bites, the version used, and a minimal repro. Upstream is maintained by martyy-code + codewizdave.

**Why:** Hard reality of an organization — internal shared code only works if the feedback loop between consumers and maintainers is alive. Local workarounds kill that loop, and silent version drift breaks the upgrade story later.

**How to apply:** When integrating `@deessejs/*` or refactoring code that uses it, if you hit friction — propose an upstream issue, not a local shim. Aligned with [[feedback-long-term-solutions]] (fix at the source, not in the consumer).

### Upstream template (deessejs/saas-template)

This repo is built on top of [deessejs/saas-template](https://github.com/deessejs/saas-template), the SaaS monorepo template. Bugs that surface in template-owned code (a fresh clone of upstream `main` reproduces them) need both a local fix AND an upstream issue.

**Rules:**

- **File upstream issues for template-owned bugs.** If a fresh clone of upstream `main` reproduces it, file an issue on `github.com/deessejs/saas-template/issues` even when we patch locally. Read `https://github.com/deessejs/saas-template/tree/main/.github/ISSUE_TEMPLATE/` first and match the structure (see [feedback-issue-templates memory](.claude/agent-memory/tech-lead/feedback-issue-templates.md)).
- **Local fix lands first. No upstream PRs.** Local fix lands in our repo (we need it now). The upstream maintainer picks up the issue from there. Per the [upstream PR policy](.claude/agent-memory/tech-lead/feedback-upstream-pr-policy.md).
- **Severity threshold: blocked, fragilised, or wrong behavior.** Not "could be cleaner". Cosmetic issues are local-only.
- **Version checks on user signal only.** Same rule as the Internal packages section above: do not auto-monitor upstream releases, do not propose bumps unprompted.

**What counts as template-owned** (and triggers the issue rule):

- Bug in apps/* or packages/* code that we have not added or modified since scaffolding.
- Wrong call by the template in choosing or pinning a dependency (when reproducible upstream).

**What does not** (local-only):

- Bug in `apps/cli/` or AGENTS.md customizations or docs/engineering/plans/.
- Configuration, env vars, runtime mismatch on our end.
- Cosmetic, naming, or comment-level issues.
