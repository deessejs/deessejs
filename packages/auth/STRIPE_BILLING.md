# Organization Stripe billing

Billing is optional. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and at least one of `STRIPE_PRO_MONTHLY_PRICE_ID` or `STRIPE_PRO_ANNUAL_PRICE_ID` to enable the Better Auth Stripe endpoints. Values are Stripe-issued configuration inputs; this project does not define amounts or trial periods.

Configure Stripe to send `checkout.session.completed` and `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` to `https://<app-host>/api/v1/auth/stripe/webhook`. Set the webhook signing secret as `STRIPE_WEBHOOK_SECRET` in each Vercel environment that receives these events, then redeploy. The plugin verifies webhook signatures.

Organization subscriptions are the only enabled customer flow. Billing authorization checks membership role against the exact `referenceId`; owners and admins are allowed. Entitlement is based on persisted status: `active` and `trialing` grant Pro, period-end cancellation keeps access through the recorded period end, and `past_due` grants none. Per-seat billing is not configured.
