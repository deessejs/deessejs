# ADR-008, doc titles cap at four words

## Status

Accepted (2026-08). Non-negotiable.

## Context

The internal-documentation site renders four root sections
(deessejs, Rules, Decisions, Knowledge Base) plus a flat
list of pages under each. Every page has a frontmatter
`title` field that appears in three places:

1. **The page H1** rendered above the body.
2. **The sidebar entry** for the page.
3. **The browser tab title** when the reader visits the
   page.

A long title is a wall in all three places. The sidebar
gets vertical scroll; the browser tab truncates with an
ellipsis and loses meaning; the H1 wraps onto two lines and
visually outranks the section header above it. The reader
stops reading because the title is longer than the first
paragraph.

This ADR formalises the cap that has emerged across the
site's seven root tabs and twenty-five indexed pages.

## Decision

Every page in `apps/internal-documentation/content/docs/`
has a frontmatter `title` of four words or fewer.

The cap is **four words**, not five, not three. Four is
enough to disambiguate "Domain-Specific Types" from
"No Generic Verbs" (the two rules whose difference is
precisely the four-word boundary), and tight enough that a
sidebar full of entries stays scannable.

The cap applies to the frontmatter `title` field only. The
section header on the page (the `## ...` inside the body
where the prose begins) is a separate concept with its own
length budget, and the prose rules of the body content
govern this, not this ADR.

A title that needs more than four words is **a signal**:
either the entry is conflating two concepts, or the entry
needs a section of its own, or the author splits the entry
into two. The author restructures, not truncates.

## What this rule allows

- **Single-word titles** for pages that are genuinely
  one-word concepts (the section index pages: Decisions,
  Rules, Knowledge Base).
- **Two-word titles** for entries whose concept is a pair
  (Project Mindset, Domain-Specific Types, Hono
  Integration).
- **Three-word titles** for entries whose concept is a
  short phrase (Top-Down Composition, No Speculative
  Defences, Functions Over Classes).
- **Four-word titles** for entries whose concept is the
  longest allowed phrase (Prefer `type` Over `interface`,
  Entity-First Naming, Open Extension, Closed
  Modification, Functions Over Classes for Public API,
  Domain-Specific Types Over Primitives).
- **Hyphenated compounds** count as one word. Domain-
  Specific is one word in the title.
- **Code in backticks** counts as one word per backtick
  expression. `\`type\`` is one word; the four-word
  budget still applies.
- **The path** (folder + filename) doesn't change. A long
  path is acceptable; the title rendered is the
  frontmatter `title`, which the cap governs.

## What this rule forbids

- **Five-word or longer titles**. Review rejects them.
- **Truncation as a fix**: a title that reads as Function
  Over Class for Public API (cut from Functions Over
  Classes for Public API) gets rejected; the author
  splits the entry, or restructures, or renames the
  concept.
- **Acronyms** that hide length. HonoEnv isn't a way
  to fit Hono Environment in one word; the title stays
  spelled out.
- **Re-introducing a section heading inside the body** that
  duplicates the title. The title is the page H1; the body
  starts below it. The first body section is a separate
  `## ...` heading, and serves as the right place for longer
  prose, not the title.

## What this rule doesn't change

- **The `meta.json` `title`** field, which is the section
  tab name (deessejs, Rules, Decisions, Knowledge Base).
  The tab is peer-level with three siblings, and the
  budget differs. The tab title has the right length
  if it fits in one or two words; four words would be a
  different smell (too long for a tab).
- **The `meta.json` `description`** field, which an earlier
  convention caps at six words and a single list.
  The description is the hover tooltip, not the page title.
- **The folder names and file slugs** in
  `content/docs/**/`. These are URLs, not titles. A slug
  can be longer than four words; readers parse the URL,
  not scan it.
- **The page body**. The body has no length cap beyond
  the prose rules already documented in the rest of the
  rules.

## How to enforce

The typecheck pass checks the cap at build time. A
small script reads every `.mdx` file under
`content/docs/`, parses the frontmatter, and rejects any
`title` field whose word count exceeds four. The script
runs in CI on every PR that touches the rendering site.
Failures block the PR.

The script is the same shape as the em-dash lint described
in ADR-007. The two scripts together are the project's
machine-checkable guarantees for the rendering site.

## Where this rule came from

The rule emerged from the implementation of the four root
tabs in `internal-documentation/`. The first tab labels
(deessejs, Rules, Decisions, Knowledge Base) set
the bar at one word. The rules list grew to sixteen
entries and the longest entry, Functions Over Classes
for Public API, was the first to feel cramped in the
sidebar. The pattern repeated in the KB entries and the
architectural decision records. The cap is the longest
entry that doesn't feel cramped, rounded down for safety.

## Related

- [ADR-006: Fumadocs Cards design rules](./ADR-006-fumadocs-card-design.md):
  the description-length rule (six words, single list) on
  Cards. Different surface, same principle: sidebar text
  stays scannable.
- [ADR-007: no em dash in internal doc](./ADR-007-no-em-dash-in-internal-doc.md):
  the other rendering-site convention. The two together
  shape the writing style of the site.
- The meta schema (the JSON config file), which carries its own length budget per field.
