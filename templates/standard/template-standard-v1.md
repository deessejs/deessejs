# DeesseJS Template Standard, version 1.2

Status: ratified by the Head of Templates on 2026 10 21. Version 1.1 adds the manifest slug and product fields, the published schema location, the catalogue contract, the product field ownership split, and corrects the agent memory rule. Version 1.2 states the manifest self reference, the manifest validation step, the travel of the portable agent configuration, and the print width rule.
Owner: Head of Templates, agent 7b03e907 49fd 4b62 b58a 274643fc774c.
Authority: this document is written into the parent template `deessejs`. Child templates conform to it, never the reverse.
Machine specific content and repository health of the parent remain in the scope of the Head of Engineering.
Product line, commercial order, product fields and the catalogue content remain in the scope of the Chief Product Officer.

Formatting note: prose in this document contains no dashes, per the user formatting rule. Literal identifiers appear inside code marks and keep their exact spelling.

---

## 1. Purpose and authority

A template is a public promise. Someone clones it, runs one command, and gets a working project with the same quality bar as every other template of the organisation. This standard defines that bar so the promise is identical across the family A, family B and family C templates.

Three rules govern everything else in this document.

**Rule 1, the parent is the only source of common structure.** `deessejs` is the parent template of the family A templates. Nothing common is ever factored from a child template. A change that two children share is first landed in the parent, then tracked down.

**Rule 2, the standard covers the transverse, not the layout.** Electron and agent templates do not have the same shape as a Next.js monorepo and must not be forced into it. What is transverse is the toolchain, the CI contract, the release flow, the governance files, the manifest and the hygiene rules.

**Rule 3, divergence is a recorded decision, never a silent drift.** Every template that does not satisfy a rule records the gap in the conformance matrix, with an owner and a date. An undocumented deviation is a defect.

## 2. Reference stack

| Element | Rule | Note |
|---|---|---|
| Node | 24 is the reference runtime, 22 is the supported floor | `engines.node` declares `>=22` in every template |
| CI Node matrix | 22 and 24 | lint runs on 24 only, build and type check run on both |
| Package manager | pnpm 11 | `packageManager` field pinned to an exact pnpm version in every template |
| Lockfile | exactly one | pnpm lockfile only, npm and bun are banned in organisation repositories |
| Workspaces | pnpm workspaces with a catalog | the parent catalog is the source of truth for dependency versions |
| Task runner | Turborepo in monorepo layouts | single app layouts use plain scripts |
| Lint | ESLint 9 flat config | `eslint.config.mjs`, the legacy `.eslintrc.js` form is retired |
| Format | Prettier, print width 80 or 100, one value per repository, consistent inside the repository | the manifest file is covered by the format check |
| Tests | Vitest | `test`, `test:run` and `test:coverage` scripts |
| Commits | Husky with a pre commit hook | lint staged plus format check on staged files |
| Versioning | Changesets | a `release.yml` workflow is mandatory wherever `.changeset` exists |
| Licence | MIT | every template ships the MIT licence file |

The Head of Engineering recommendation on the reference runtime is ratified as written. Node 26 is not adopted until it has been in use for a full quarter.

## 3. Repository layouts

Exactly two layouts are permitted.

**Layout M, monorepo.** `apps/` for deployable surfaces, `packages/` for shared libraries, `docs/` for the documentation site, `scripts/` for repository automation, `public/` for static assets. A pnpm workspace file and a Turborepo config at the root. The parent template and the family A and family B templates use this layout.

**Layout S, single application.** One root application, optional `content/` for MDX, optional `src/`, optional `tests/`. The documentation template and the agent template use this layout.

| Rule | Layout M | Layout S |
|---|---|---|
| Workspace file | `pnpm-workspace.yaml` with a catalog | not applicable |
| Task runner | `turbo.json` | plain scripts |
| Package identity | the repository name, never a generic placeholder | the repository name |

**Rule 4, package identity.** The root `name` field is the repository name. The placeholder values `next monorepo`, `my agent` and a bare dot are defects wherever they survive in a published template.

## 4. Root script contract

Every template exposes the same root script names, so that a reader who knows one template knows all of them.

| Script | Contract |
|---|---|
| `dev` | starts the development servers |
| `build` | production build of every workspace |
| `lint` | lint every workspace, zero warnings tolerated |
| `format` | formats the repository |
| `format:check` | checks formatting, exits non zero on a violation |
| `type-check` | type checks every workspace |
| `test` | runs the test suite |
| `test:coverage` | runs the test suite with coverage |
| `setup` | one command bootstrap, the script name is always `setup` |

**Rule 5, the format check covers every tracked file type**, including the template manifest at the root. A manifest that is not Prettier clean breaks the lint job, which is exactly what happened in the package template.

**Rule 5 bis, the print width does not move inside a repository.** The reference width is 100 for a new template. An existing repository keeps the width it already uses, because a width change is a whole repository reformat that hides the real change inside a diff of thousands of lines. The width is recorded in the conformance matrix.

## 5. CI contract

A conforming template carries these workflows, named as stated.

| Workflow | Trigger | Content |
|---|---|---|
| `ci.yml` | pull request and push on main | lint, type check, build, test |
| `release.yml` | push on main | Changesets publish, required wherever `.changeset` exists |

**Rule 6, every CI job declares concurrency** with the workflow and branch as the group, and cancels in progress. **Rule 7, every job installs with a frozen lockfile** and uses the pnpm cache. **Rule 8, the Node matrix runs 22 and 24** on build and type check.

**Rule 9, action versions.** `actions/checkout` and `actions/setup-node` are at version 5 or above in every workflow. Versions below 5 are deprecated on the current runners. The reference target is version 7, the current major of both actions, and it is adopted once the publish pipelines are verified against it, because version 7 of `setup-node` changes the behaviour of `NODE_AUTH_TOKEN` and the publish path of the library templates depends on it.

**Rule 10, the lint job runs the format check** as a separate named step, so a formatting failure is reported as a formatting failure.

**Rule 11, the coverage action.** The StepSecurity coverage action requires a paid subscription for private repositories and fails on every branch. The upstream action it wraps is used instead, or the job is guarded by repository visibility.

## 6. Release and versioning

**Rule 12, Changesets.** A published template uses Changesets, with a `release.yml` workflow, a `.changeset/config.json`, and the changelog and version scripts at the root. A template that carries a `.changeset` directory but no release workflow has a dead release path and is not conforming. This is the current state of the agent template. Changesets serve the maintainer release flow of the template repository, not the end user, because a generated project starts with a fresh history and no upstream. The manifest therefore excludes the pending changeset entries from the distributed copy, so the end user never inherits a changelog fragment.

**Rule 13, the root package name is never a placeholder** and the version is the template version.

## 7. Dependency policy

**Rule 14, the catalog is the source of truth.** Dependency versions live in the pnpm catalog at the root of the parent template. Child templates do not pin their own divergent version ranges for shared dependencies.

**Rule 15, Dependabot is present in every template**, with a weekly schedule covering the root and every workspace directory, a pull request limit, and a group for shared dependencies.

**Rule 16, the major group is quarantined.** The `npm major` group is removed from the automatic batch and re introduced only once the corresponding migration has landed and been verified. The Next.js major migration is the current case: the global `LayoutProps`, `PageProps` and `RouteContext` types are removed in the new major, and the application code still relies on them.

**Rule 17, one lockfile.** A repository carries exactly one lockfile. The complete electron template currently carries both a pnpm and an npm lockfile, and the agent template carries an npm lockfile.

## 8. Documentation and governance

**Rule 18, the README names the template.** The title, the banner alt text, the badge links and the licence links all point at the repository that is being read. A README that still points at a sibling template is a credibility defect, not a cosmetic one.

**Rule 19, no placeholder survives.** No `your org` badge, no `your org` licence link, no unresolved token.

**Rule 20, the governance files are present in every template.** `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/FUNDING.yml`, `.github/ISSUE_TEMPLATE/` and `.github/dependabot.yml`.

**Rule 21, the README states the quick start**, the reference stack, the repository layout and the boundary of the template, meaning which new project starts from it and which does not.

## 9. Agent configuration policy

**Rule 22, portable agent configuration stays in the index.** `.claude/skills/`, `.claude/agents/` and `.claude/workflows/` are part of the template contract and are kept.

**Rule 23, machine specific content is removed and ignored.** `.claude/settings.local.json`, `.claude/plans/` and `.claude/worktrees/` are per machine artefacts that carry local paths and, in the case of the local settings, a permission profile that is not meant to travel. They are removed from the index and added to `.gitignore`.

**Rule 23 bis, the agent memory stays in the index.** The first draft of this standard removed `.claude/agent-memory/` with the three paths above. Inspection of the repositories showed that folder holds curated team knowledge, between 5 and 47 files per repository, with frontmatter and cross links, and no local path anywhere. It is portable content, not a machine artefact, and it is removed from the index only after its content has been relocated to a curated path. Until that relocation happens, the folder stays tracked and is excluded from the distributed copy by the manifest, exactly like the other paths that must not reach the end user.

**Rule 24, the agent instructions stay.** `AGENTS.md` and `CLAUDE.md` are the portable agent instructions and are kept.

## 10. Template manifest contract

Every template carries a `deesse-template.json` manifest at the root, validated against the published schema.

**The schema location.** The schema source of truth is `templates/schema/template-v2.json` in the parent template `deessejs`, served at `https://raw.githubusercontent.com/deessejs/deessejs/main/templates/schema/template-v2.json`. The intended published mirror is `https://registry.deessejs.com/schema/template/v2.json`, which currently returns 404 because the registry does not serve it. Every manifest points at the source of truth until the mirror is published, and the mirror then becomes the canonical location.

**The manifest fields.**

| Field | Owner | Contract |
|---|---|---|
| `$schema` | technical | the URL of the schema that validates this file |
| `name` | technical | the repository name |
| `slug` | product | the catalogue slug, the key under which the template is published and installed. Required for a starter, optional for a parent template |
| `title` | product | the human readable template name |
| `description` | product | one sentence, the promise to the user |
| `version` | technical | the template version |
| `type` | technical | `template:starter` for a starter, `template:parent` for the parent template |
| `author` | technical | DeesseJS |
| `license` | technical | the SPDX identifier of the licence actually shipped in the repository |
| `source.repo` and `source.ref` | technical | the origin repository and branch |
| `requires` | technical | runtime, node range and package manager |
| `product` | product | the catalogue commercial fields, `layer`, `category`, `labels` and `image` |
| `includes` and `excludes` | technical | the file selection rules, with the machine specific paths excluded |
| `fileTypes` | technical | the classification of the notable files |

**Rule 25, the manifest is Prettier clean** and is covered by the format check.

**Rule 25 bis, the manifest is validated in CI.** The CI job validates `deesse-template.json` against the published schema, with a JSON Schema validator pinned in the workflow, and fails on a violation. A manifest that only a human checked is a manifest that drifts.

**Rule 26, the manifest excludes the paths that must not travel**: `.claude/settings.local.json`, `.claude/agent-memory/`, `.claude/plans/`, `.claude/worktrees/`, environment files, lockfile artefacts, build output and changelogs. The exclusion is a path list, not a prefix of the agent folder: `.claude/skills/`, `.claude/agents/`, `.claude/workflows/`, `AGENTS.md` and `CLAUDE.md` are part of the template contract and travel with the template, because they are the portable agent configuration of the generated project.

**Rule 27, the manifest declares the licence that is actually shipped.** The `license` field is never a commercial intention. It states the SPDX identifier of the licence file in the repository, so the catalogue never advertises a licence the template does not carry.

## 10 bis. The catalogue contract

The catalogue is the product surface that lists and installs the templates. It is fed by the manifests, not by a second hand written copy of the same facts.

**Rule 28, the catalogue reads the manifest.** The catalogue keeps one row per template as a pointer, meaning the owner, the repository, and the commercial fields that are not versioned with the repository. The slug, the title and the description come from the manifest fetched from the repository, in the same way the readme and the topics are already fetched live today. A template that has no manifest cannot be listed, because the catalogue has no copy to publish.

**Rule 29, there is no second copy of the product fields.** The home, the changelog, the use case pages, the pricing copy and the install guide all read the catalogue. No surface hand writes a template name, a template description or a template stack. A surface that hard codes those facts is a defect, because it diverges from the manifest and nobody notices until the product changes.

**Rule 30, the flag and the copy land together.** The `is_template` flag on a repository makes the GitHub "Use this template" button appear. Setting it without changing the site copy creates two competing acquisition paths, neither instrumented. The flag is therefore applied with the product line, in the commercial order the product line sets, and never before the manifest, the catalogue row and the page exist.

## 10 ter. Product field ownership

**Rule 31, the split is explicit.** The Chief Product Officer owns the product line, the commercial order, the slug, the title, the description and the `product` block. The Head of Templates owns the technical fields, the schema, the manifest implementation, the standard and the architecture. A product field is never invented by engineering, and a technical field is never set by product. When a product value changes, it changes in the manifest and flows to every surface.

## 11. Conformance levels and exceptions

A template is **conforming** when it satisfies every rule in sections 2 to 10, **provisionally conforming** when it satisfies every rule except a recorded exception in the matrix, and **non conforming** otherwise. The matrix is owned by the Head of Templates and published with each conformance review.

Every exception records four fields: the rule identifier, the gap, the reason, and the owner with a target date. No exception is granted without a target date.

## 12. Sync governance

**Rule 32, the direction of sync is one way.** Parent to child. A child that discovers a missing common structure opens an issue against the parent, not a pull request against another child.

**Rule 33, the two SaaS templates stay separate repositories.** The single tenant and the multi tenant templates differ in the auth schema and in the data model, not in a configuration switch. A single repository with presets would produce conditional code and double the review surface, which contradicts Rule 1. The tenant mode is expressed as a preset in the parent wherever the difference can be made data driven, and the two repositories track the parent explicitly.

**Rule 34, the two library templates stay separate repositories.** The CLI template produces an application with an SDK and a docs site. The package template produces a publishable library. The overlap is tooling and CI, which belongs in this standard, not in shared code. The boundary in one sentence: **start from the package template when the deliverable is a published library, start from the CLI template when the deliverable is a command line product.**

**Rule 35, the shared design system is a dependency, not a template.** The `ui` repository is the source of truth for the component registry. Templates consume it under a pinned registry version and keep their local `packages/ui` in sync through the parent, never by diverging.

## 13. Change control

This standard is versioned with the parent template. A rule change lands in the parent first, is recorded here with its rationale, and is then tracked down to the children in the next conformance review. The Head of Templates owns this document and the matrix. The Head of Engineering owns repository health for every repository, including the parent, and owns the organisation wide ruleset and roadmap that this standard sits inside.