---
name: project-apps-docs-structure-2026-06-29
description: Locked docs site structure for apps/docs (external) — Variants-first nav, Template root via route group, Diátaxis per variant, Engine + Ops at root
metadata:
  type: project
---

# apps/docs structure decisions — locked 2026-06-29

## What apps/docs is

External usage documentation for the 3 DeesseJS variants (Lite / Template / Cloud). NOT marketing content (lives in `apps/web`), NOT in-template docs (lives in `apps/template/apps/docs/`, owned by `tech-lead`).

The user's own framing: *"`apps/docs` est la documentation d'utilisation des différents templates"*.

## Locked decisions

1. **Scope**: only `apps/docs` (external). In-template docs and marketing comparisons out of scope.
2. **Nav root axis**: **Three root tabs** — Template, Lite, Cloud — all with `root: true` so Fumadocs UI renders Layout Tabs at top of sidebar.
3. **URL structure**: keep `(template)/` as Next.js route group so Template content lives at `/docs` (1 click from anywhere, no redirect). Lite and Cloud are real folders → URLs `/docs/lite` and `/docs/cloud`.
4. **Pattern (Template)**: **Features at root, Diátaxis inside each feature**. Template's 4 top-level Diátaxis sections (tutorials/how-to/reference/explanation) were replaced by 6 feature sections (database, api, auth, emails, admin, logs) + a "quickstart" section for general walkthroughs + the cross-cutting reference/explanation sections kept at root. Each feature has its own Diátaxis sub-structure (tutorials/how-to/reference/explanation).
5. **Pattern (Lite)**: **Folder reference** (`tutorials`) — Diátaxis sections appear as nested folders (only stubs exist).
5. **Engine surfaces REMOVED**: `architecture/`, `api/`, `cli/`, `sdk/` folders deleted entirely. The 2 spec-14 differentiators (14.6 auto-gen API ref, 14.7 architecture overview) are NOT shipped in apps/docs. User accepted this loss.
6. **Changelog REMOVED**: `changelog/` folder deleted. Spec 14.14 not shipped.
7. **`comparisons/`** (vs ShipFast etc.) lives on `apps/web`, NOT on `apps/docs` — this is usage docs not evaluation docs.
8. **Flagship "Deleting features"**: lives inside `template/how-to/delete-notifications.mdx` (still ships via spec 14.8).
9. **(template)/index.mdx** is titled "Getting started" — it's the root page at `/docs`, ambiguously Template-specific but accepted by user.
10. **Cloud tab KEEP**: even though Cloud is "Coming soon" placeholder, user wants it visible as a tab.

## Why these decisions

- **Tabs instead of nested nav**: 3 root folders with `root: true` enable Fumadocs Layout Tabs — the cleanest UX for multi-variant docs. User explicitly chose this.
- **Template at root** = wedge URL is the shortest possible (`/docs/getting-started` is gold for SEO).
- **Extract in Template** because Template has many Diátaxis pages — flattening with separators is more scannable than nested folders.
- **Folder reference in Lite** because Lite has only stub `index.mdx` in each Diátaxis subfolder — nested folders are fine for sparse content.
- **Engine surfaces sacrificed**: user accepted loss of spec 14.6 (API ref) and 14.7 (architecture overview). Tradeoff = simpler nav vs fewer SEO surfaces.

## Why: history

Set up 2026-06-29 in a structure-design session. User started by saying "déterminer la structure de la documentation sans encore la rédiger". Came after the analysis phase that flagged spec 14's 14 sub-features (Fumadocs, MDX, diátaxis, versioning, auto-gen API, architecture overview, deleting-features walkthrough, etc.). User manually edited several meta.json files to introduce Layout Tabs + Extract pattern + simplify root nav. Build green, structure accepted as final.

## How to apply

When adding a new doc page:
- Decide which **variant** it belongs to first (Template = paid features; Lite = free basics; Cloud = managed later)
- Then pick the **Diátaxis quadrant** within that variant (tutorial vs how-to vs reference vs explanation)
- Engine surfaces (architecture, api, cli, sdk) sit at root, shared across variants
- Use `---Label---` separators in `meta.json` `pages` arrays for visual grouping (NOT `{group, pages}` objects — schema is `z.array(z.string())`)
- Use `---[Icon]Label---` to put a lucide icon on a separator (e.g. `---[Package]Variants---`)
- Use `defaultOpen: true` on folders that should expand by default
- Use `icon: "<lucide-name>"` on variant folders (`package`, `book-open`, `cloud` etc.) — `lucideIconsPlugin` is already wired in `apps/docs/src/lib/source.ts`

## Fumadocs meta.json syntax — full reference (verified against fumadocs.dev/docs/page-conventions 2026-06-29)

`pages: []` accepts only `string[]` items. The `pages` array is NOT a free-form structure.

| Item type | Syntax | Use |
|---|---|---|
| **Path** | `"folder-or-file"` OR `"./folder/file"` (canonical) | Reference a sibling file/folder |
| **Route group** | Dossier nommé `(name)/` dans `content/` | Folder name disappears from URL |
| **Separator** | `"---"` (no label) OR `"---Label---"` (with label) OR `"---[Icon]Label---"` (with lucide icon) | Visual divider in sidebar |
| **Link** | `"[Text](url)"` OR `"[Icon][Text](url)"` | External/internal link in sidebar |
| **External link** | `"external:[Text](url)"` | Same but flagged external |
| **Rest** | `"..."` | Includes remaining unmentioned siblings (alphabetical) |
| **Reversed rest** | `"z...a"` | Same, reversed order |
| **Extract** | `"...folder"` | Pulls items from a folder into current nav level |
| **Exclude** | `"!item"` | Excludes item from rest |

## Other meta.json fields (schema from `fumadocs-core/dist/source/schema.js`)

| Field | Type | Effect |
|---|---|---|
| `title` | string | Display name |
| `icon` | string | Lucide icon name (via `lucideIconsPlugin`) |
| `description` | string | Folder description (rendered in sidebar) |
| `defaultOpen` | boolean | Open folder by default in sidebar |
| `collapsible` | boolean | Can the folder be collapsed (default true) |
| `pages` | string[] | Folder items (see syntax above) |
| `pagesIndex` | string | Override `index.mdx` as folder index — accepts path OR link |
| `root` | boolean | Marks folder as a root — multiple `root: true` folders enable Layout Tabs in Fumadocs UI |

## Special structural notes

- **`root: true` + Layout Tabs**: Fumadocs UI renders root folders as tabs at the top of the sidebar. With ONE root folder, no tabs appear. With MULTIPLE `root: true` folders, the UI shows tabs to switch between them. Currently only Template has `root: true` in this repo → no tabs.
- **Path resolution**: items in `pages` are joined to the folder's virtual path. `./foo` and `foo` both work but `./foo` is the documented canonical form.
- **`pages` overrides filesystem scan**: when `pages` is specified, only listed items appear. When unspecified, Fumadocs does an alphabetical scan.
- **`index.mdx` is always first** by default — but only within its own folder. To use a different file as index, use `pagesIndex`.

## Open items (still to decide when content is being written)

- Concrete page inventory per variant (how many tutorials? which how-tos?)
- Whether `cloud/` placeholder should be hidden from nav until shipped or shown as "Coming soon"
- `defaultOpen: true` vs `defaultOpen: false` per variant (probably true for Template, false for the rest)
- `icon` per variant (`package`, `book-open`, `cloud`)
- Whether to enable Layout Tabs (add `root: true` to Lite) — currently NO tabs because only Template is root
- `collapsible: false` on top-level variant folders so users always see all variants without clicking

## Cross-refs

- [[project-apps-docs-fumadocs-setup]] — the engine underneath (loader, .source/, schema)
- [[project-scope-and-boundaries]] — apps/docs IN-scope, apps/template OUT-of-scope