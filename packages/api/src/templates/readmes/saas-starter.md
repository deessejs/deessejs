# SaaS Starter

Production-ready Next.js boilerplate for B2B SaaS applications.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Better Auth + Drizzle ORM
- **Database:** Postgres
- **Styling:** Tailwind CSS v4 + shadcn/ui primitives
- **API:** oRPC end-to-end typed contracts
- **Email:** Resend + react-email
- **Background jobs:** pg-boss

## Getting started

```bash
deessejs init saas-starter
cd saas-starter
pnpm install
pnpm dev
```

## Features

- Email + password and OAuth sign-in flows (Better Auth)
- Multi-factor authentication scaffold
- Stripe-ready billing primitives
- Playwright integration suite
- Drizzle migrations pre-wired to a local Postgres
- Production-grade rate limiting and session handling

## Documentation

See `apps/internal-documentation/content/docs/knowledge-base/guides/` for the full reference, or open the hosted KB at `/knowledge-base`.
