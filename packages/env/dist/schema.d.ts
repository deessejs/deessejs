import { z } from "zod";
/**
 * Server-side env contract.
 *
 * Required in every runtime that imports `@workspace/env/server`:
 *   - DATABASE_URL          Postgres connection string
 *
 * Optional (defaults shown):
 *   - NODE_ENV              "development" | "test" | "production"
 *   - TEST_DATABASE_URL     Alias for DATABASE_URL when unset
 *   - BETTER_AUTH_SECRET    >=32 chars in prod; optional in dev/test
 *                           (better-auth auto-generates a dev-only default)
 *                           Generate: openssl rand -base64 32
 *   - AUTH_SECRET           Alias for BETTER_AUTH_SECRET (also validated
 *                           against the 32-char minimum when present)
 *   - BETTER_AUTH_URL       Defaults to http://localhost:3000
 *   - ALLOWED_ORIGINS       CSV. Defaults to localhost dev origins.
 *
 * BETTER_AUTH_SECRET note: better-auth validates the secret internally.
 * In production (NODE_ENV=production), it throws if unset. In dev/test,
 * it uses a built-in default. Making it optional here lets the test
 * suite run without env vars while still enforcing it at prod startup.
 */
/**
 * Canonical host URL (no trailing slash) used by the inter-app URL
 * configuration. Per ADR-021, every inter-app link is built as
 * `new URL(path, host)`; a trailing slash on the base URL would
 * be silently neutralised by `new URL`'s resolution rules but
 * hides a contributor mistake behind a non-obvious normalisation.
 * The `.refine` rejects the value at parse time so the mistake
 * surfaces locally before CI.
 *
 * Exported so a colocated unit test (`tests/unit/schema.urls.test.ts`)
 * can pin the validation contract; not part of the runtime surface.
 */
export declare const canonicalUrl: z.ZodString;
/**
 * Alias resolution lives in the consumer (server.ts), not in the schema.
 *
 * `AUTH_SECRET` is a historical alias for `BETTER_AUTH_SECRET`.
 * `TEST_DATABASE_URL` is a historical alias for `DATABASE_URL`. Both
 * pairs are declared as separate optional fields; the .superRefine
 * accepts either; the production gate looks at the resolved value
 * (alias wins when the canonical is unset). The two consumers of the
 * schema (this file + scripts/env-check.ts) honour the same convention
 * because the rule is symmetric: at least one of each pair must hold
 * its invariant under NODE_ENV=production.
 *
 * Why an object-level .transform() would be wrong: Zod 4 runs
 * .superRefine() before .transform(), and .transform().pipe() around
 * a stricter object drops the `? optional` markers in the inferred
 * type, so .pipe() loses the `BETTER_AUTH_SECRET?: string` shape that
 * `ServerEnv` consumers depend on. Avoiding the transform keeps the
 * inferred type matching what consumers expect.
 */
export declare const serverInputShape: {
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    TEST_DATABASE_URL: z.ZodOptional<z.ZodString>;
    BETTER_AUTH_URL: z.ZodDefault<z.ZodString>;
    BETTER_AUTH_SECRET: z.ZodOptional<z.ZodString>;
    AUTH_SECRET: z.ZodOptional<z.ZodString>;
    ALLOWED_ORIGINS: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM_EMAIL: z.ZodDefault<z.ZodString>;
    RESEND_FROM_NAME: z.ZodDefault<z.ZodString>;
    MAIL_TRANSPORT: z.ZodDefault<z.ZodEnum<{
        console: "console";
        resend: "resend";
    }>>;
    RATE_LIMIT_PER_MINUTE: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    GITHUB_TOKEN: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    WEB_URL: z.ZodDefault<z.ZodString>;
    APP_URL: z.ZodDefault<z.ZodString>;
    DOCS_URL: z.ZodDefault<z.ZodString>;
    API_BASE_URL: z.ZodDefault<z.ZodString>;
    PARENT_DOMAIN: z.ZodOptional<z.ZodString>;
    LOCALES: z.ZodDefault<z.ZodString>;
    DEFAULT_LOCALE: z.ZodDefault<z.ZodString>;
};
export declare const serverSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    TEST_DATABASE_URL: z.ZodOptional<z.ZodString>;
    BETTER_AUTH_URL: z.ZodDefault<z.ZodString>;
    BETTER_AUTH_SECRET: z.ZodOptional<z.ZodString>;
    AUTH_SECRET: z.ZodOptional<z.ZodString>;
    ALLOWED_ORIGINS: z.ZodDefault<z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM_EMAIL: z.ZodDefault<z.ZodString>;
    RESEND_FROM_NAME: z.ZodDefault<z.ZodString>;
    MAIL_TRANSPORT: z.ZodDefault<z.ZodEnum<{
        console: "console";
        resend: "resend";
    }>>;
    RATE_LIMIT_PER_MINUTE: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    GITHUB_TOKEN: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GITHUB_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    WEB_URL: z.ZodDefault<z.ZodString>;
    APP_URL: z.ZodDefault<z.ZodString>;
    DOCS_URL: z.ZodDefault<z.ZodString>;
    API_BASE_URL: z.ZodDefault<z.ZodString>;
    PARENT_DOMAIN: z.ZodOptional<z.ZodString>;
    LOCALES: z.ZodDefault<z.ZodString>;
    DEFAULT_LOCALE: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
/**
 * Client-side env contract. Only NEXT_PUBLIC_* values, safe to bundle to the
 * browser. Values are inlined at build time by the bundler.
 *
 * Authored against `createEnv({ ...runtimeEnvStrict })`, so each key must
 * appear in the destructured literal passed by `client.ts`. Adding a key to
 * this schema without listing it in `client.ts` is a compile-time error.
 */
export declare const clientSchema: z.ZodObject<{
    NEXT_PUBLIC_APP_NAME: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_APP_DESCRIPTION: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_WEB_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_APP_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_DOCS_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_API_BASE_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_LOCALES: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_DEFAULT_LOCALE: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
//# sourceMappingURL=schema.d.ts.map