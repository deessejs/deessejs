# 2. Orgs & RBAC

> The depth axis. SaasRock set the bar (6 roles, 30 perms, impersonation, GDPR). We match on depth and beat on per-tenant theming, which is the org-story differentiator.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 2.1 | Multi-org per user | ✅ | C | Better Auth orgs plugin |
| 2.2 | Org creation flow | ✅ | C | First-time UX is critical |
| 2.3 | Org switcher (in header) | ✅ | C | Persistent, fast |
| 2.4 | Org invitations (email) | ✅ | C | Resend template, accept/decline flow |
| 2.5 | Org member list | ✅ | C | Search, filter, role display |
| 2.6 | Org settings | ✅ | C | Name, slug, logo, deletion |
| 2.7 | Org-scoped data | ✅ | C | The `orgId` mixin on every model |
| 2.8 | Org deletion (with grace period) | ✅ | U | Soft-delete + 30-day grace; GDPR alignment |
| 2.9 | Org transfer (ownership) | ✅ | U | Often missed; needs audit log |
| 2.10 | Org branding (logo, color, font) | ✅ | D | Per-tenant theming; rarely done by competitors (most templates ship one theme); lands at the UI layer |
| 2.11 | Sub-orgs / teams within orgs | ⚪ | — | v1 doesn't ship. v2 candidate if asked. Most buyers don't need. |
| 2.12 | Cross-org data sharing | ⚪ | — | The buyer's domain. We don't pre-bake a pattern. |
| 2.13 | Predefined roles (owner / admin / member / billing) | ✅ | C | 4 roles, seeded per org |
| 2.14 | Custom roles | ✅ | C | Beyond SaasRock: any perm combo |
| 2.15 | Fine-grained permissions | ✅ | C | ~30 perms across surfaces (org, billing, members, jobs, settings) |
| 2.16 | Role editor UI | ✅ | C | Admin can change member roles |
| 2.17 | Permission gates (UI + API) | ✅ | C | Single source of truth, both layers respect it |
| 2.18 | Resource-level permissions | 🟡 | U | Org-level only in v1; per-resource (e.g. "this project") is a v2 pattern buyers can layer |
| 2.19 | Impersonation (admin → user) | ✅ | C | Better Auth admin plugin; UI with banner + audit log |
| 2.20 | Audit log (RBAC events) | ✅ | C | Every role change, every impersonation, every permission grant |
| 2.21 | IP whitelist | ✅ | D | Org-level, blocks sign-in from non-allowed IPs. SaasRock has it; we match. |
| 2.22 | IP blacklist | ✅ | C | Per-org, post-saasrock-comparison decision |
| 2.23 | Time-based access (scheduled role expiry) | ⚪ | — | Enterprise-only; not in v1 |
| 2.24 | GDPR management | ✅ | U | Data export (per user), data deletion (per user), data portability |

**Notes:**
- RBAC depth target: **match SaasRock** (their 6 roles / 30 perms). We ship 4 default + custom roles + ~30 perms.
- 2.10 (per-tenant branding) is genuinely differentiating — no template in the band ships multi-tenant theming.
- 2.21/2.22 (IP controls) are usually sold as "enterprise" but they're cheap to ship and buyers mention them in buyer-voice research.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — org-scoped data model
- Competitive: [`../competitive-teardowns.md`](../competitive-teardowns.md) — SaasRock RBAC teardown
- Related: [01-auth-and-identity.md](./01-auth-and-identity.md) — impersonation auth events
- Related: [10-ui.md](./10-ui.md) — per-tenant theming implementation
