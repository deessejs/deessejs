# 11. In-app notifications

> Upstash Realtime on Upstash Redis. Real-time, typed SSE. The differentiators are email digest, per-user preferences, and multi-channel delivery. Most templates ship a basic bell; we ship a notification system.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 11.1 | Real-time delivery (Upstash Realtime) | ✅ | C | Typed SSE |
| 11.2 | Bell icon (header) | ✅ | C | Unread count badge |
| 11.3 | Dropdown (recent 10) | ✅ | C | Polished, not a placeholder |
| 11.4 | Mark as read (per notification, all) | ✅ | C | Optimistic UI |
| 11.5 | Categories (info, success, warning, error) | ✅ | C | Color + icon |
| 11.6 | Per-user preferences | ✅ | D | Which categories, in-app vs email vs both — per user. **Most templates skip this.** |
| 11.7 | Message history (paginated) | ✅ | C | `/notifications` page |
| 11.8 | Email digest (daily / weekly) | ✅ | D | Aggregated email of unread notifications, opt-in. **Rare in the band.** |
| 11.9 | Web push notifications | ⚪ | — | v2. Service worker + VAPID. iOS support is murky. |
| 11.10 | Deep links (notification → page) | ✅ | U | Each notification has a `link` field |
| 11.11 | Notification templates (per category) | ✅ | C | React Email-style, versioned in code |
| 11.12 | Bulk actions (mark all read, archive) | ✅ | U | Power-user feature |
| 11.13 | Notification API (for jobs, webhooks) | ✅ | C | `notifications.send({...})` |
| 11.14 | Multi-channel (in-app + email + future push) | ✅ | D | One notification, multiple delivery channels, user preference per category |

**Notes:**
- In-app notifications are a major differentiator. supastarter has basic bell; ShipFast, Makerkit, SaasRock have none; Nexty has a chat but not notifications.
- 11.6, 11.8, 11.14 are the real differentiators (per-user preferences, email digest, multi-channel).

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — Upstash Realtime integration
- Related: [05-mail.md](./05-mail.md) — email digest delivery via Resend
- Related: [04-background-jobs.md](./04-background-jobs.md) — notifications are sent from jobs
- Related: [02-orgs-and-rbac.md](./02-orgs-and-rbac.md) — admin notifications for role changes
