# Stripe billing foundation

Stripe billing is optional. The Better Auth Stripe plugin is omitted when the
Stripe environment variables are all absent, so local development and existing
deployments continue to boot without Stripe configuration. Supplying only part
of the configuration is rejected during environment validation.

## Operator setup

Create the DeesseJS Pro product and its recurring per-seat price in Stripe.
The amount, currency, and tax treatment must come from the approved offer and
are not selected by this repository. V1 currently supports monthly billing only.
Annual billing is not available until its Price ID and flow are implemented.

Set these server-only values independently in Vercel. Keep Stripe mode and
resources isolated by environment:

| Vercel environment | `STRIPE_SECRET_KEY` | `STRIPE_PRO_MONTHLY_PRICE_ID` | `STRIPE_WEBHOOK_SECRET` |
| --- | --- | --- | --- |
| Staging / Preview | Stripe test-mode secret key | Test-mode Pro Price ID | Signing secret from the test webhook endpoint |
| Production | Stripe live-mode secret key | Live-mode Pro Price ID | Signing secret from the production live webhook endpoint |

Do not reuse the test endpoint's signing secret in production or the live
secret key/Price ID in staging. Leave all three values unset to keep Stripe
optional until the environment-specific setup is ready. Vercel's environment
values provide the separation. Never put Stripe secrets in client variables or
commit them.

- `STRIPE_SECRET_KEY`: Stripe secret API key for that environment.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the webhook endpoint configured
  below. Use a different secret for each Stripe endpoint/environment.
- `STRIPE_PRO_MONTHLY_PRICE_ID`: operator-created monthly Pro Price ID.

Configure a Stripe webhook endpoint at
`https://app.deessejs.com/api/v1/auth/stripe/webhook` (substitute the app host
for staging or local development). Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Store that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`. For local
forwarding, use the Stripe CLI and the same path:

```sh
stripe listen --forward-to localhost:3001/api/v1/auth/stripe/webhook
```

## Database deployment

The Stripe plugin's generated schema is committed with this change. Apply its
migration through the repository's explicit deployment migration operation
(`pnpm db:migrate`) before enabling Stripe in an environment. Server startup
does not apply migrations.

The Stripe plugin's `seats` value is the purchased subscription quantity. The
Checkout flow sends that quantity for the server-configured Pro Price ID. It does
not use `seatPriceId`, which would synchronize quantity to all organization
members. DeesseJS stores explicit member seat assignments and checks them
against purchased capacity before granting Pro.

The `auth:generate` schema command must load the auth configuration with a
complete Stripe environment so Better Auth includes the plugin-owned fields in
its generated schema. Use temporary, non-production Stripe-shaped values only
for schema generation when operator values are not available. Never commit or
deploy those temporary values.

The Better Auth plugin configures organization subscriptions and webhook
synchronization. Server-side entitlement checks grant Pro only to current
organization members with an explicit seat assignment, within purchased
capacity, when the persisted `pro` subscription has the V1 monthly interval and a
recognized `active` or `trialing` status.
There is no `past_due` grace period. Cancellation at period end retains access
through the persisted paid period. Billing managers are owners and admins;
ordinary members receive only the sanitized Pro-included result, not raw
subscription records.

The public template and official section APIs gate paid metadata using current
membership, subscription state, and seat assignment. Their source GitHub URLs remain public and
must not be treated as protected delivery. Do not assign or advertise paid
source entries as usable until the separate private-source flow issues
short-lived authorized downloads.
