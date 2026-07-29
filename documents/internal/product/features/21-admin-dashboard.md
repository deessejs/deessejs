# 21. Admin dashboard

> The system-level admin surface — for the template operator (the buyer's internal team). Different from RBAC (org-level, in [02-orgs-and-rbac.md](./02-orgs-and-rbac.md)). Better Auth ships an admin plugin; this is the full dashboard on top.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 21.1 | System admin login (separate from user login) | ✅ | C | Different session, MFA required |
| 21.2 | System dashboard (overview) | ✅ | C | Total users, orgs, MRR, jobs, errors |
| 21.3 | User management (system-wide) | ✅ | C | List, search, filter, impersonate, suspend, delete |
| 21.4 | Org management (system-wide) | ✅ | C | List, search, filter, suspend, transfer |
| 21.5 | Job inspector | ✅ | C | Trigger.dev integration, run history, retry, cancel |
| 21.6 | Audit log viewer (cross-org) | ✅ | C | Filterable by org, user, event, date |
| 21.7 | API analytics dashboard | ✅ | D | Surfaces 7.13 in the admin UI. Per-org calls / errors / p95 |
| 21.8 | Billing overview | ✅ | C | Per-org subscription, MRR chart, churn |
| 21.9 | Email queue inspector | ✅ | C | Resend integration, sent / bounced / complained |
| 21.10 | Webhook inspector (in / out) | ✅ | C | List, retry failed, view payloads |
| 21.11 | Storage inspector | ✅ | C | R2 usage per org, file counts |
| 21.12 | System health | ✅ | C | Uptime, error rates, latency p50 / p95 / p99 |
| 21.13 | Feature flag management | ✅ | C | Toggle per org / globally |
| 21.14 | Announcement / maintenance mode | ✅ | U | Banner, full-page takeover, scheduled |
| 21.15 | Global search (users / orgs / events) | ✅ | U | One search box, multi-entity results |
| 21.16 | Activity timeline (cross-org) | ✅ | U | Recent events across the system |
| 21.17 | Impersonation from system | ✅ | C | Deeper than org-level; can impersonate across orgs |
| 21.18 | Impersonation audit (system-level) | ✅ | C | Every system-level impersonation logged + visible |
| 21.19 | System admin MFA required | ✅ | C | TOTP / passkey, no exceptions |
| 21.20 | System admin IP whitelist | ✅ | U | Block admin UI access from non-allowed IPs |

**Notes:**
- The system admin is the **operator** (the buyer's internal team / SRE). NOT an end-user. Different session, different auth, different UI.
- 21.7 (API analytics in admin) is a differentiator — surfaces 7.13 but is the only place to see cross-org API usage.
- Better Auth ships an admin plugin, but it's a scaffold, not a dashboard. We build the full UI on top.
- 21.15 (global search) and 21.16 (activity timeline) are the things buyers notice in mature dashboards and notice-by-absence in immature ones.

## Cross-references

- Parent: [README.md](./README.md)
- Related: [02-orgs-and-rbac.md](./02-orgs-and-rbac.md) — org-level RBAC (the in-org surface)
- Related: [01-auth-and-identity.md](./01-auth-and-identity.md) — MFA, IP whitelist, audit
- Related: [07-api.md](./07-api.md) — 7.13 API analytics surfaced here
- Related: [04-background-jobs.md](./04-background-jobs.md) — 4.11 job observability surfaced here
- Related: [05-mail.md](./05-mail.md) — 5.7 bounce handling surfaced here
- Related: [06-storage.md](./06-storage.md) — 6.10 file metadata surfaced here
- Related: [18-security-and-compliance.md](./18-security-and-compliance.md) — 18.6 audit log surfaced here
- Related: [03-billing.md](./03-billing.md) — billing overview per org
