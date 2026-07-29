# 18. Security & compliance

> Built-in OWASP top 10 review, GDPR tools, IP controls, audit log. Certifications (SOC2 / HIPAA) are the buyer's journey; architecture supports, certification is not in scope.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 18.1 | CSRF protection | ✅ | C | Next.js default + Better Auth |
| 18.2 | XSS protection | ✅ | C | React default + Content Security Policy |
| 18.3 | SQL injection protection | ✅ | C | Drizzle parameterized queries |
| 18.4 | Rate limiting (auth, API, sign-up) | ✅ | C | Better Auth + per-endpoint |
| 18.5 | Bot protection (Turnstile) | ✅ | U | Per 1.22 |
| 18.6 | Audit log (cross-feature) | ✅ | C | Per 1.24, 2.20 |
| 18.7 | GDPR tools (data export, deletion) | ✅ | U | Per 2.24 |
| 18.8 | IP whitelist / blacklist | ✅ | C | Per 2.21, 2.22 |
| 18.9 | Secrets management (env vars) | ✅ | C | `.env.example`, documented, Vercel / Doppler integration |
| 18.10 | Security headers (CSP, HSTS, X-Frame-Options) | ✅ | C | Next.js middleware |
| 18.11 | Subresource Integrity | 🟡 | U | For buyer-loaded third-party scripts |
| 18.12 | Encryption at rest | 🟡 | — | Postgres encryption is buyer / cloud-provider config; documented |
| 18.13 | Encryption in transit (TLS) | ✅ | C | Cloudflare / Vercel default |
| 18.14 | SOC2-ready architecture | ⚪ | — | Out of scope to certify. Architecture supports. |
| 18.15 | HIPAA | ⚪ | — | Out of scope. |
| 18.16 | Penetration testing | ⚪ | — | Out of scope. |
| 18.17 | Bug bounty | ⚪ | — | Out of scope. |
| 18.18 | Security disclosure process | ✅ | U | `SECURITY.md` in the repo |
| 18.19 | Dependency scanning (npm audit, Snyk) | ✅ | C | CI pipeline |
| 18.20 | OWASP top 10 review | ✅ | C | Pre-launch checklist |

**Notes:**
- 18.6 (audit log) is more than a single feature — it's a cross-cutting concern. We ship the table + the API + the UI.
- 18.14/18.15 (certifications) are not in scope. Architecture supports, certification is the buyer's journey.

## Cross-references

- Parent: [README.md](./README.md)
- Related: [01-auth-and-identity.md](./01-auth-and-identity.md) — auth-level security (1.22 bot protection, 1.24 audit)
- Related: [02-orgs-and-rbac.md](./02-orgs-and-rbac.md) — IP controls, GDPR tools
- Related: [19-performance-and-dx.md](./19-performance-and-dx.md) — CI/CD templates for dep scanning
