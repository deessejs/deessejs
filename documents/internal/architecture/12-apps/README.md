# `12-apps/` — Per-app documentation

## Purpose

One subdirectory per app in `apps/` (`template/`, `web/`, `demo/`, `lite/`, `cloud/`). Each subdirectory contains the **local** documentation for that app: what it is, what it owns, how it is deployed, and the local ADRs that bind it.

App docs sit alongside [`../11-packages/`](../11-packages/) (which documents packages). Apps and packages are different layers:

- **Apps** are independently deployable surfaces (e.g. `apps/template` is the buyer-facing product; `apps/web` is `deessejs.com`).
- **Packages** are shared libraries consumed by apps and other packages.

The dependency direction is `apps → packages`, never the reverse. The doc structure mirrors this: app docs reference package docs, but not the other way around.

## What's in here

```
12-apps/
├── template/      # apps/template — THE PRODUCT (what buyers clone)
├── web/           # apps/web — deessejs.com (marketing + buyer dashboard)
├── demo/          # apps/demo — demo.deessejs.com (post-v1)
├── lite/          # apps/lite — OSS subset (post-v1)
└── cloud/         # apps/cloud — managed hosting (post-v1)
```

## Conventions

- **One folder per app.** Match the directory name in `apps/`.
- **No duplication with system concerns.** System-wide concerns (security, deployment, testing) live in their `0X-` folders. App docs link to them.
- **Local ADRs stay local.** Decisions scoped to a single app live in `12-apps/<app>/decisions/`. System-wide ADRs stay in `10-decisions/`.
- **The dogfooding claim is documented here.** `apps/web` is built on DeesseJS itself; this is a marketable claim. The relevant docs live in `12-apps/web/`.

## App template

Each `12-apps/<name>/` folder contains:

| File | Required | Purpose |
|---|---|---|
| `README.md` | yes | What the app is, what it owns, who maintains it, deploy target |
| `<topic>.md` | as needed | App-specific topics (e.g. `extraction.md` for template, `marketing.md` for web) |
| `decisions/` | optional | Local ADRs, numbered `NNNN-<slug>.md` |

The `README.md` follows this structure:

1. **Purpose** — what the app does, in one sentence
2. **Audience** — who uses it (buyers, operators, internal team)
3. **Surface** — what URLs it serves, what it owns in the system
4. **Deploy** — where it runs, how it ships
5. **Cross-references** — system concerns, system ADRs, local ADRs, package docs

## Related

- [`../11-packages/`](../11-packages/) — per-package documentation
- [`../10-decisions/0011-repo-structure.md`](../10-decisions/0011-repo-structure.md) — the apps/packages contract (superseded)
- [`../10-decisions/0012-template-as-pattern.md`](../10-decisions/0012-template-as-pattern.md) — current repo structure
- [`../03-web-app/`](../03-web-app/) — web app concerns (transverse)
