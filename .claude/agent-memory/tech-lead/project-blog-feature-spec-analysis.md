---
name: project-blog-feature-spec-analysis
description: Deep-dive of documents/internal/product/features/15-blog.md (2026-06-26) — buyer-facing blog spec, aspirational ✅ for 0 implemented files, 6 decisions pending, 5 downstream specs blocked
metadata:
  type: project
---

# Blog feature spec (15-blog.md) — deep-dive findings

## Scope reminder

Spec 15 is titled **« Blog (for the buyer's product) »** — this is the blog **each buyer of the template receives in their repo**, NOT the deessejs.com marketing blog. The two are separate concerns. Easy to conflate — the marketing site also has dead `/blog` and `/changelog` nav links in `apps/web/src/components/headers/home-header.tsx` + a fictional link `/blog/agents-are-now-first-class-developers` in the hero of `apps/web/src/app/page.tsx`.

## Spec 15 — 15 features inventory (4 added 2026-06-26 for public release notes, then 15.15 in-app notifs removed 2026-06-26)

| # | Feature | Status | Source |
|---|---|---|---|
| 15.1 | MDX content (content-collections) | ✅ (aspirational) | C |
| 15.2 | Categories / tags | ✅ | C |
| 15.3 | Authors (per-post, bio + avatar, MDX decoupled) | ✅ | C |
| 15.4 | Cover images (R2, optimized) | ✅ | C |
| 15.5 | SEO (meta, OG, Twitter cards) | ✅ | C |
| 15.6 | RSS / Atom feed | ✅ | C |
| 15.7 | Sitemap (posts + tags) | ✅ | C |
| 15.8 | Newsletter signup (buyer wires own list) | ⚪ | U | Skipped v1 (decision 2026-06-26). No component, no endpoint. Buyer wires their own if needed. |
| 15.9 | Related posts (tag-based v1, ML out) | 🟡 | U |
| 15.10 | Reading time | ✅ | C |
| 15.11 | Series (multi-post) | 🟡 | U |
| 15.12 | Drafts / scheduled posts | ✅ | C |
| **15.13** | **Public release notes (user-facing, manual MDX)** | ✅ | **U** |
| **15.14** | **Release categorization (Keep a Changelog enum)** | ✅ | **U** |
| **15.15** | **Cross-link to related content (manual relatedPosts)** | ✅ | **C** |
| **15.16** | **RSS subscription for release notes (`/changelog/feed.xml`)** | ✅ | **C** |

**Zero differentiators (D).** Spec 15 is 100 % table-stakes. Decision 2026-06-26 removed the only D (was 15.15 in-app notifs via packages/notifications).

## Reality gap (critical for M8 QA)

README of features claims **M4 → Blog ✅ all**, but **no blog files exist in `apps/template/`**. The status column is aspirational. M8 delete-test pass will be a structural lie (nothing to remove → nothing to break). This must be implemented before M8, otherwise the modular contract claim collapses on this feature.

## Architecture decisions still pending

1. **Content engine** — RESOLVED 2026-06-26: `content-collections` (NOT Fumadocs). See [[project-blog-engine-decision-2026-06-26]] for full rationale. Fumadocs stays scoped to docs site only.
2. **Layout** — pending: (b) recommended = blog routes inside buyer's main Next.js app as `app/(content)/blog/[slug]/page.tsx`. Not a separate Fumadocs app, not a docs route.
3. **Author schema** — simple MDX entity (`content/authors/<slug>.mdx`) vs Better Auth user coupling. Recommended: MDX entity (decoupled).
4. **Newsletter endpoint** — stub `501 Not Implemented` + doc « wire your own » vs default provider (Resend Audiences). Recommended: stub.
5. **Changelog location** — confirmed by spec 14.14: lives in DOCS (`content/docs/changelog.mdx` or git-tags generated), NOT in blog. This contradicts my earlier competitive analysis that bundled blog+changelog in one engine. Trust the spec.
6. **JSON-LD Article schema** (22.4, marked D) — to spec in detail separately.
7. **Delete test timing** — TDD-style before impl, or after as regression? Recommended: after (regression test, more valuable when feature exists).

## Downstream specs blocked (goulot d'étranglement)

- **14-documentation.md** 14.2 (MDX) — shares MDX toolchain with 15.1; 14.14 (dev changelog) is **superseded** by 15.13-15.16
- **16-marketing-and-sales.md** 16.8 (marketing SEO) — depends on 15.5 blog SEO + 15.13 release note SEO
- **22-seo.md** 22.5 sitemap + 22.19 news sitemap + 22.4 JSON-LD Article — consumed by both blog + release notes
- **20-cross-cutting.md** 20.1 modular contract — blog + release notes must live in `src/features/blog/` to be deletable
- **23-testing.md** (implied) — 23.25 delete test covers both blog and release notes

5 specs wait on this. Implementing blog + release notes unblocks a non-trivial portion of M4.

## Spec 15 — minimal v1 surface (post-simplifications 2026-06-26)

Three features cut to reduce surface area and remove soft deps:
- **15.8 newsletter signup** → ⚪ skipped in v1 (was ✅ U)
- **15.15 in-app release notifs** → removed entirely (was 🟡 D)
- **15.16 RSS subscription** → kept (replaces in-app as the only subscription mechanism)

Spec 15 is now 15 features, 0 differentiators, 100 % table-stakes. No vendor lock-in, no soft deps on packages/notifications or packages/jobs. Aligns with the agentic positioning (RSS = tool-callable by agents).

## « Done » framework applied to spec 15

Spec README mandates 10-dimension check for every ✅ feature. **Blog scores 0/10** today:

| Dimension | Status | Note |
|---|---|---|
| Happy + 2 unhappy paths | ⛔ | Post 404, invalid frontmatter build fail, malformed RSS fallback |
| Fumadocs doc page | ⛔ | Dedicated doc page missing |
| TS end-to-end | ⛔ | Zod schema shared everywhere |
| i18n ready | ⛔ | en strings only, structure next-intl-compatible |
| A11y WCAG 2.1 AA | ⛔ | Reading time visible, 22.14 alt lint |
| Responsive | ⛔ | Mobile 1-col, tablet 2-col, desktop 3-col |
| **Modular (delete test)** | ⛔ | Critical — `src/features/blog/` + nav entry |
| Lighthouse ≥ 90 + p95 < 200ms | ⛔ | Static gen + R2 optimized |
| OWASP top 10 | 🟡 | rehype-sanitize on MDX, newsletter POST sanitized |
| Observability | ⛔ | Events: `blog.post.published`, `blog.newsletter.signup`, `blog.rss.fetched` |

## Fumadocs-specific gotchas (out of scope per 2026-06-26 decision)

Fumadocs stays scoped to docs only. The blog does not use Fumadocs. Going forward:
- 15.1 MDX content = content-collections (NOT fumadocs-mdx)
- Fumadocs-specific gotchas (RSS hand-roll, OG image plugin, multi-source search, v16 provider rename) remain relevant **only for spec 14** (docs)
- For blog: content-collections provides RSS, OG, etc. via standard route handlers + content-collections utilities

## Effort estimate (corrected)

First analysis said 1 week. After spec deep-dive: **2-3 weeks** for the 10-dimension done + downstream unblocks (R2 storage needed for 15.4, JSON-LD Article for 22.4, delete test for 20.1, doc page for 14.2).

## Why

This spec is one of the few table-stakes features with cross-spec dependencies. Treating it as "just another content surface" underestimates the modular-contract cost. M8 QA cannot pass on an aspirational ✅.

## How to apply

- When user asks "what's next in M4?" — blog is the load-bearing item with 5 blocked downstream specs.
- When user asks "is the buyer template shippable?" — answer is still no, and blog is one of the load-bearing missing pieces (alongside RBAC, billing).
- When user asks "blog deessejs.com vs blog acheteur?" — distinguish clearly. Spec 15 is the buyer one. The marketing site blog is a separate, unspec'd chantier.
- Before implementing blog, surface the 6 pending decisions in [[project-build-state-2026-06-25]]-style status update.

Related: [[project-build-state-2026-06-25]], [[project-positioning-drift-2026-06-25]], [[project-deessejs-overview]]