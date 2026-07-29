# 5. Mail

> Resend + React Email. All mail is React components, versioned in code. The differentiator is per-user email preferences (per-category, not just global unsubscribe).

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 5.1 | Resend as the transport | ✅ | C | Confirmed |
| 5.2 | React Email templates | ✅ | C | All mail is React components, versioned in code |
| 5.3 | Auth templates (verify, reset, invite, magic link) | ✅ | C | Better Auth default + buyer override |
| 5.4 | Billing templates (receipt, dunning, trial ending) | ✅ | C | Stripe events → Resend |
| 5.5 | Transactional templates (notification digest, etc.) | ✅ | U | The mail the buyer's app sends |
| 5.6 | Marketing templates (announcements, newsletter) | 🟡 | U | Ship the components; buyer uses their own list management |
| 5.7 | Bounce / complaint handling (webhooks) | ✅ | C | Resend webhooks → suppression list |
| 5.8 | Open / click tracking | ✅ | C | Resend native; toggleable |
| 5.9 | Unsubscribe (per category, one-click) | ✅ | C | Required by CAN-SPAM / GDPR |
| 5.10 | Email preferences (per user) | ✅ | D | Per-user, per-category; not just global unsubscribe |
| 5.11 | Multiple sender domains (per org) | 🔵 | — | v2. v1 ships one default sender. Buyers can configure. |
| 5.12 | Sandbox mode (dev) | ✅ | U | Resend sandbox, no real delivery, captures screenshots for testing |
| 5.13 | Email queue (batching, throttling) | ✅ | C | Resend native + our queue on Trigger.dev |

**Notes:**
- 5.10 (per-user email preferences) is the differentiator. Most templates ship global unsubscribe; per-user, per-category is what mature apps do.
- 5.6 (marketing) is intentionally light — buyer can wire ConvertKit / Resend Audiences / etc.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — Resend + React Email integration
- Related: [01-auth-and-identity.md](./01-auth-and-identity.md) — auth templates (verify, reset, magic link)
- Related: [03-billing.md](./03-billing.md) — billing templates (receipt, dunning)
- Related: [11-in-app-notifications.md](./11-in-app-notifications.md) — email digest for unread notifications
