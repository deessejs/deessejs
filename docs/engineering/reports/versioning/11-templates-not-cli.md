# 11. Templates are content, not command-line features <!-- vale fix: Microsoft.HeadingAcronyms -->

[← Index](README.md) · **Prev: [09-risks-and-sources.md](09-risks-and-sources.md)**

_This is the last file in the audit._

A user challenge prompted this section: **why would adding a template ever warrant a new version of `@deessejs/cli`?** The answer: it shouldn't. Templates are content served by an API endpoint; the CLI is a client of that endpoint. The codebase versions them independently. <!-- vale fix: write-good.Passive, Microsoft.Contractions -->

## 11.1 The principle

`@deessejs/cli` is a **client** of the templates endpoint at `https://deessejs.com/api/templates` (served by `packages/api/src/index.ts:73`, data sourced from `packages/api/src/templates.ts`). The CLI's contract is:

- `deessejs list`: list the templates.
- `deessejs info <slug>`: show details for one template.
- `deessejs init <slug>`: clone the template at `<owner>/<repo>` (per the entry's data). <!-- vale fix: Microsoft.FirstPerson -->

**What the templates ARE isn't the CLI's concern.** A new template entry is a content change. The CLI's behavior for that entry matches any other entry: list it, show it, clone it. No new code path. No new flag. No API surface change. <!-- vale fix: Microsoft.Contractions, write-good.TooWordy -->

In short: **adding a template doesn't require a new version of `@deessejs/cli` and doesn't require a changeset.** <!-- vale fix: Microsoft.Contractions, write-good.TooWordy -->

This principle holds whether templates are hand-curated (today) or database-backed (per the inline comment in `packages/api/src/templates.ts`: "V1 is hand-curated. V1.1+ could swap this for a DB-backed source.") or externally submitted (planned).

## 11.2 Today's data source

`packages/api/src/templates.ts` exports a `TEMPLATES: Template[]` array with three hand-curated entries. Each entry is content: `slug`, `name`, `description`, `owner`, `repo`, `license`, `category`, `labels`, plus optional `image` and `cloneUrl`. To add a template today, edit this array and ship a server-side deploy. The codebase doesn't involve the CLI. <!-- vale fix: write-good.Passive -->

When the data source moves to a database, the same principle applies: an `INSERT` into the templates table is content, not a CLI change. When external submissions go live, the same holds: a third-party submission is content, not a CLI change. <!-- vale fix: write-good.Passive -->

## 11.3 Edge cases, when a template change is a command-line change <!-- vale fix: Microsoft.HeadingColons, Microsoft.HeadingAcronyms, Microsoft.Headings -->

The principle above is simple, but three edge cases deserve explicit handling. These are the only situations where a template-related change requires a CLI version bump:

### Edge case A: Template schema change (new required field)

If the codebase adds a new field to the `Template` type in `packages/api/src/templates.ts` AND the new field has no `?` suffix (so the contract requires it), then: <!-- vale fix: write-good.Passive -->

- The CLI's `isTemplate` validator in `apps/cli/src/api.ts` must accept the new field.
- Old CLI versions receiving the new field may reject the whole response as invalid (depending on the validator's strictness).
- This warrants at least a `minor` bump on the CLI; a `major` bump if old CLI versions choke.

**Rule**: required field added to template schema → CLI changeset required, bump at least `minor`.

### Edge case B: Template schema change, new optional field that the command-line tool displays

If the codebase adds a new field AND the CLI renders it (for example, in `deessejs info` output), then: <!-- vale fix: write-good.Passive, Microsoft.Contractions, write-good.TooWordy, Microsoft.Foreign, Microsoft.HeadingAcronyms -->

- This is a user-visible CLI change.
- A `minor` bump on the CLI.

**Rule**: new optional field that the CLI renders → CLI changeset required, `minor`.

### Edge case C: Template schema change, new optional field that the command-line tool ignores

If the codebase adds a new field AND the CLI doesn't read it (defensive parsing; the parser ignores unknown fields), then: <!-- vale fix: write-good.Passive, Microsoft.Contractions, Microsoft.HeadingAcronyms -->

- No CLI change.
- Old CLI versions keep working with new API responses.

**Rule**: new optional field, CLI ignores it → no CLI changeset.

The CLI's `isTemplate` validator SHOULD be defensive about unknown fields (forward compat). If it isn't today, this is a separate hardening task; see [06-implementation-specs.md §6.2](06-implementation-specs.md#62-appscli-packagejson-proposed) for related work.

## 11.4 Decision table

| Change | CLI changeset? | Why |
|---|---|---|
| Add a new template entry to `packages/api/src/templates.ts` | **No** | Content change. CLI behavior unchanged. |
| Update a template's `name`, `description`, `labels`, etc. | **No** | Content change. CLI behavior unchanged. |
| Remove a template entry | **No** | Content change. CLI just won't list it. |
| Add a required field to the `Template` type | **Yes** (`minor` or `major`) | Schema change affects CLI validator. |
| Add an optional field that the CLI renders | **Yes** (`minor`) | User-visible CLI behavior change. |
| Add an optional field that the CLI ignores | **No** | CLI is forward-compatible. |
| Change the templates endpoint address | **Yes** (`major`) | Breaking CLI behavior. | <!-- vale fix: Microsoft.GeneralURL -->
| Move templates from hand-curated array to database | **No** | Server-side architecture; CLI contract unchanged (same JSON shape). |
| Enable external template submissions | **No** | Server-side feature; CLI contract unchanged. |
| Deprecate a template (mark as `deprecated: true` in the entry) | **Maybe** (`minor` if CLI renders the deprecation) | Depends on whether the CLI shows the deprecation status. |

## 11.5 Operational implications

- **Continuous integration**: the changeset-presence check in [08-execution-plan.md](08-execution-plan.md) PR 3 should fire only on PRs that touch `apps/cli/**`. It doesn't need to fire on PRs that only touch `packages/api/src/templates.ts` or any future database schema. <!-- vale fix: write-good.Passive, Microsoft.Contractions, Microsoft.HeadingAcronyms -->
- **Process docs**: [`.changeset/README.md`](../../../../.changeset/README.md), [`docs/engineering/processes/versioning.md`](../../../processes/versioning.md), and [`CONTRIBUTING.md`](../../../../CONTRIBUTING.md) all need an explicit note that adding/updating/removing a template entry isn't a CLI change. <!-- vale fix: Microsoft.Contractions -->
- **Future database migration**: when the data source moves to a DB, the schema migrations live in `packages/database/` and the codebase versions them there. The senior pattern decouples the CLI. <!-- vale fix: write-good.Passive -->

## 11.6 Why this matters for the future

If template additions ever triggered a CLI version bump, three things would break:

1. **External submissions become impossible.** A third-party submitting a template would have to wait for the maintainers to release a new CLI version, defeating the purpose of accepting external submissions.
2. **Operational overhead explodes.** Every template addition would be a release PR, a tag, an npm publish, and a GitHub Release. The maintainers' review bandwidth gets eaten by content changes.
3. **SemVer loses meaning.** A CLI version would no longer track the CLI's own behavior; it would track the size of the template registry. Consumers reading `0.5.0 → 0.6.0` wouldn't know what changed in the CLI without diffing the registry.

The decoupling isn't just good practice; it's required for the architecture to scale. <!-- vale fix: Microsoft.Contractions, write-good.TooWordy -->

## 11.7 Related changes in this audit

This section clarifies (but doesn't contradict) the process described in the project-side [`docs/engineering/processes/versioning.md`](../../../processes/versioning.md) (contributor changeset workflow): <!-- vale fix: Microsoft.Contractions -->

- [`docs/engineering/processes/versioning.md` Contributor: adding a changeset](../../../processes/versioning.md#contributor--adding-a-changeset): when to add a changeset.
- [06-implementation-specs.md §6.2](06-implementation-specs.md#62-appscli-packagejson-proposed): `apps/cli/package.json` entrypoints.
- [02-problems.md §2.8](02-problems.md#28-p3--no-dependabot--changesets-integration): dependency bumps don't need changesets.

Rule of thumb: **if the change amounts to "the registry now has one more template," it's a content change. If it amounts to "the CLI now does X," it's a CLI change.** Only the second warrants a CLI version bump. <!-- vale fix: Microsoft.Contractions, Microsoft.Quotes, write-good.Passive -->