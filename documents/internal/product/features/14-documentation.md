# 14. Documentation (for the buyer's product)

> Fumadocs, MDX, versioned, searchable. The differentiators are auto-generated API reference (from OpenAPI) and the architecture overview doc — most templates ship "Getting Started" and stop.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 14.1 | Fumadocs site | ✅ | C | Confirmed |
| 14.2 | MDX content | ✅ | C | All docs in MDX |
| 14.3 | Search (in-site) | ✅ | C | Fumadocs default |
| 14.4 | Versioning (per release) | ✅ | C | Docusaurus-style; buyer's v1.0, v1.1, etc. |
| 14.5 | Code snippets with copy button | ✅ | C | shadcn-style |
| 14.6 | API reference (auto-generated from OpenAPI) | ✅ | D | Buyer never writes API docs by hand |
| 14.7 | Architecture overview | ✅ | D | "How the pieces fit together" — a real doc most templates don't ship |
| 14.8 | "Deleting features" walkthrough | ✅ | D | The wedge proof |
| 14.9 | Tutorials / how-to / reference | ✅ | C | Diátaxis framework |
| 14.10 | Dark mode (docs match product) | ✅ | C | |
| 14.11 | Mobile responsive | ✅ | C | |
| 14.12 | "Edit on GitHub" link | ✅ | C | Buyers can PR corrections |
| 14.13 | Feedback widget ("was this helpful?") | ✅ | U | Sends to buyer's feedback endpoint |
| 14.14 | Changelog page | ✅ | C | From the buyer's git tags |

**Notes:**
- 14.6 (API reference from OpenAPI) and 14.7 (architecture overview) are differentiators. Most templates ship "Getting Started" and stop.
- 14.8 is the flagship — the wedge proof.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../onboarding.md`](../onboarding.md) — "Deleting features" flagship doc
- Related: [07-api.md](./07-api.md) — auto-generated API reference
- Related: [20-cross-cutting.md](./20-cross-cutting.md) — modular contract (the wedge proof)
- Related: [15-blog.md](./15-blog.md) — blog (also MDX, same toolchain)
