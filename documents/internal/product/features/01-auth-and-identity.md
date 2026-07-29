# 1. Auth & identity

> The first surface the buyer touches. Better Auth is the floor (sessions, 2FA, passkeys, magic links, MFA, admin, rate-limit). We add the bits that come up in buyer-voice research: per-device session revocation, login notifications, account merge, and an audit trail.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 1.1 | Email + password sign-up | ✅ | C | Better Auth default |
| 1.2 | Magic link (email) sign-in | ✅ | C | Better Auth default |
| 1.3 | OAuth — Google | ✅ | C | The most-used provider; must ship |
| 1.4 | OAuth — GitHub | ✅ | C | Second most-used; dev audience expects it |
| 1.5 | OAuth — Microsoft | 🟡 | U | Ship as config, not default-on (enterprise) |
| 1.6 | OAuth — Apple | 🟡 | U | Ship as config, not default-on (iOS buyers) |
| 1.7 | SAML SSO | ⚪ | — | Enterprise-only; not in $299-999 band. Buyer adds it via Better Auth plugins. |
| 1.8 | 2FA / TOTP | ✅ | C | Better Auth default |
| 1.9 | Passkeys (WebAuthn) | ✅ | C | Better Auth default |
| 1.10 | MFA combinations | ✅ | C | 2FA + passkey per account |
| 1.11 | Session management | ✅ | C | Sessions in Upstash Redis, revocable |
| 1.12 | Session revocation (per device) | ✅ | U | "Log out all devices" is table stakes; per-device revocation is a buyer's user-expectation |
| 1.13 | Login notifications (new device email) | ✅ | U | Free security win via Resend; trust signal for the buyer's users |
| 1.14 | Email verification | ✅ | C | Better Auth default |
| 1.15 | Password reset | ✅ | C | Better Auth default |
| 1.16 | Profile management | ✅ | C | Name, avatar, email, password change |
| 1.17 | Avatar upload | ✅ | C | R2, image transformations |
| 1.18 | API keys (per user, scoped) | ✅ | U | Power users / automation; ships with the public API |
| 1.19 | Service accounts (machine identities) | 🔵 | — | v2. v1 ships user-bound API keys. Service accounts need org-level scope + rotation policies. |
| 1.20 | Account deletion | ✅ | U | Required for GDPR; Resend + DB cleanup |
| 1.21 | Account merge (multiple providers) | ✅ | U | If a user signs in with Google, then signs in with email — merge accounts |
| 1.22 | Bot protection (Turnstile / CAPTCHA) | ✅ | U | Cloudflare Turnstile, free, easy |
| 1.23 | Rate limiting | ✅ | C | Better Auth plugin, Upstash Redis backend |
| 1.24 | Audit log (auth events) | ✅ | U | Sign-in, sign-out, password change, API key creation — all logged |

**Notes:**
- 1.5 / 1.6 ship as config templates, not default-on, to keep the wizard short. Buyers enable in 1 click.
- 1.7 (SAML) is the most-requested enterprise feature, but the audience for $999 Studio rarely needs it. Documented as a buyer-implementable extension.

## Cross-references

- Parent: [README.md](./README.md) — meta, legends, status, gap analysis, deletions, milestone matrix
- Deep dive: [`../architecture.md`](../architecture.md) — Better Auth integration
- Research: [`../research.md`](../research.md) — buyer-voice on auth UX
- Related: [02-orgs-and-rbac.md](./02-orgs-and-rbac.md) — org-scoped session and impersonation
