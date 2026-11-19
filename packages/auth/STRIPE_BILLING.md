# Stripe billing foundation

Stripe billing is optional. The Better Auth Stripe plugin is omitted when the
Stripe environment variables are all absent, so local development and existing
deployments continue to boot without Stripe configuration. Supplying only part
of the configuration is rejected during environment validation.

## Operator setup

Create the DeesseJS products and recurring prices in Stripe. Supply the resulting
Pro monthly and annual Price IDs through environment configuration. This code
does not create products, select amounts, set trial periods, or configure
per-seat pricing.

Set these server-only values in each Vercel environment that will use billing:

- `STRIPE_SECRET_KEY`: Stripe secret API key for that environment.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the webhook endpoint configured
  below. Use a different secret for each Stripe endpoint/environment.
- `STRIPE_PRO_MONTHLY_PRICE_ID`: operator-created monthly Pro Price ID.
- `STRIPE_PRO_ANNUAL_PRICE_ID`: operator-created annual Pro Price ID.

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

The plugin schema includes a `seats` column, but no seat price is configured
and no per-seat billing or membership quantity synchronization is enabled.

The `auth:generate` schema command must load the auth configuration with a
complete Stripe environment so Better Auth includes the plugin-owned fields in
its generated schema. Use temporary, non-production Stripe-shaped values only
for schema generation when operator values are not available. Never commit or
deploy those temporary values.

This foundation only configures organization subscriptions and webhook
synchronization. It does not include checkout or billing portal UI, Pro
entitlement checks, or private template source authorization.
