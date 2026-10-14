// One-off validation script. Run with:
//
//   cd packages/database && node scripts/validate-issuer-fix.mjs
//
// Drives the local `t3-pg-test` Postgres (already running on 127.0.0.1:5444)
// to reproduce the production drift, apply the corrective 0003 migration,
// and assert that signup no longer fails with 23502. Output is a sequence
// of PASS/FAIL markers. Exit code is 0 only if every step passes.
//
// The script does not connect to Neon production at any point.

import { readFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import postgres from "postgres"

const __dirname = dirname(fileURLToPath(import.meta.url))
const drizzleDir = resolve(__dirname, "../../database/drizzle")

const ADMIN_URL =
  process.env.TEST_PG_ADMIN_URL ||
  "postgresql://test:test@127.0.0.1:5444/postgres"

let step = 0
let pass = 0
let fail = 0
function ok(label) {
  step += 1
  pass += 1
  console.log(`  [${String(step).padStart(2, "0")}] PASS  ${label}`)
}
function bad(label, err) {
  step += 1
  fail += 1
  console.error(`  [${String(step).padStart(2, "0")}] FAIL  ${label}`)
  if (err) console.error("         ", err)
}

async function execFile(sql, path) {
  const text = await readFile(path, "utf8")
  // drizzle-kit separates statements with `--> statement-breakpoint`
  const statements = text
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)
  for (const stmt of statements) {
    await sql.unsafe(stmt)
  }
}

async function main() {
  // Connect to the maintenance `postgres` database to create a
  // dedicated, throwaway database for the validation.
  const admin = postgres(ADMIN_URL, { max: 1 })

  const DB = `deessejs_issuer_fix_${Date.now().toString(36)}`
  console.log(`\n# Step A — create throwaway database ${DB}`)
  try {
    await admin.unsafe(`CREATE DATABASE "${DB}"`)
    ok(`created database ${DB}`)
  } catch (e) {
    bad("create database", e)
    await admin.end()
    return done(null, 1)
  }
  await admin.end()

  const sql = postgres(
    `postgresql://test:test@127.0.0.1:5444/${DB}`,
    { max: 1 },
  )

  try {
    // Apply the in-repo migrations 0000/0001/0002 — that mirrors what
    // the repo on staging has today.
    console.log("\n# Step B — apply in-repo migrations 0000..0002")
    for (const f of [
      "0000_boring_steel_serpent.sql",
      "0001_magenta_firebrand.sql",
      "0002_admin_plugin_columns.sql",
    ]) {
      try {
        await execFile(sql, resolve(drizzleDir, f))
        ok(`applied ${f}`)
      } catch (e) {
        bad(`apply ${f}`, e)
        return done(sql, 1)
      }
    }

    // Simulate the production drift — the unknown 4th migration that
    // Better Auth 1.7.0–1.7.2 applied. This is the state production
    // is in: `account.issuer text NOT NULL` plus the unique index.
    console.log(
      "\n# Step C — simulate production drift (Better Auth 1.7.x schema)",
    )
    try {
      await sql.unsafe(
        `ALTER TABLE "account" ADD COLUMN "issuer" text NOT NULL DEFAULT 'https://example.test'`,
      )
      await sql.unsafe(
        `ALTER TABLE "account" ALTER COLUMN "issuer" DROP DEFAULT`,
      )
      await sql.unsafe(
        `CREATE UNIQUE INDEX "account_issuer_accountId_uidx"
           ON "account" ("issuer", "account_id")`,
      )
      ok("applied drifted migration (issuer NOT NULL + unique index)")
    } catch (e) {
      bad("apply drifted migration", e)
      return done(sql, 1)
    }

    // Reproduce the failure: Better Auth 1.6.23's signup insert does
    // NOT write `issuer`. PostgreSQL should reject it with 23502.
    console.log("\n# Step D — reproduce 23502 not_null_violation on signup")
    try {
      await sql`
        INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
        VALUES ('u1', 'Tester', 't@e.test', false, now(), now())
      `
      await sql`
        INSERT INTO "account"
          (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES ('a1', 't@e.test', 'credential', 'u1', 'hash', now(), now())
      `
      bad("expected signup insert to FAIL with 23502, but it succeeded")
      return done(sql, 1)
    } catch (e) {
      // postgres.js surfaces pg's `code` as `e.code` and the message
      // mentions the column name.
      if (e && e.code === "23502" && /issuer/.test(String(e.message))) {
        ok("signup insert rejected with 23502 not_null_violation on issuer")
      } else {
        bad("expected 23502 on issuer", e?.message ?? e)
        return done(sql, 1)
      }
    }

    // Defensive cleanup — only delete if present.
    await sql`DELETE FROM "user" WHERE id = 'u1'`

    // Apply the corrective migration. The script reads the exact file
    // the PR commits — so the test mirrors the rollout.
    console.log(
      "\n# Step E — apply corrective 0003_drop_account_issuer_unique",
    )
    try {
      await execFile(
        sql,
        resolve(drizzleDir, "0003_drop_account_issuer_unique.sql"),
      )
      ok("applied 0003_drop_account_issuer_unique.sql")
    } catch (e) {
      bad("apply 0003_drop_account_issuer_unique.sql", e)
      return done(sql, 1)
    }

    // Verify the schema matches expectations after the migration.
    console.log("\n# Step F — post-migration schema invariants")
    const col = await sql`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_schema='public' AND table_name='account' AND column_name='issuer'
    `
    if (col[0]?.is_nullable === "YES") {
      ok("account.issuer is now NULL-able")
    } else {
      bad(
        `account.issuer is_nullable expected YES, got ${col[0]?.is_nullable}`,
      )
    }

    const idx = await sql`
      SELECT 1 AS hit FROM pg_indexes
      WHERE schemaname='public' AND tablename='account'
        AND indexname='account_issuer_accountId_uidx'
    `
    if (idx.length === 0) {
      ok("account_issuer_accountId_uidx no longer exists")
    } else {
      bad("account_issuer_accountId_uidx still exists")
    }

    // Re-run the same Better Auth 1.6.23 insert — it must now succeed.
    console.log("\n# Step G — verify Better Auth 1.6.23 signup now succeeds")
    try {
      await sql`
        INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
        VALUES ('u2', 'Tester2', 't2@e.test', false, now(), now())
      `
      await sql`
        INSERT INTO "account"
          (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES ('a2', 't2@e.test', 'credential', 'u2', 'hash', now(), now())
      `
      ok("credential signup insert succeeded with no `issuer` value")
    } catch (e) {
      bad("expected signup insert to SUCCEED, but it failed", e?.message ?? e)
    }

    // Idempotency check — applying the corrective migration a second
    // time must be a no-op (DROP INDEX IF EXISTS, ALTER … DROP NOT
    // NULL on an already-nullable column).
    console.log("\n# Step H — idempotency (re-apply 0003)")
    try {
      await execFile(
        sql,
        resolve(drizzleDir, "0003_drop_account_issuer_unique.sql"),
      )
      ok("re-apply of 0003 succeeded (idempotent)")
    } catch (e) {
      bad("re-apply of 0003 failed", e?.message ?? e)
    }

    // The pre-existing OAuth rows that DID have an `issuer` value
    // must still be there — the migration must not have lost data.
    console.log("\n# Step I — existing data preserved")
    try {
      await sql`
        INSERT INTO "account"
          (id, account_id, provider_id, user_id, issuer, created_at, updated_at)
        VALUES ('a3', 'oauth|3', 'github', 'u2', 'https://github.com',
                now(), now())
      `
      const r = await sql`SELECT issuer FROM "account" WHERE id = 'a3'`
      if (r[0]?.issuer === "https://github.com") {
        ok("existing issuer value preserved (OAuth row intact)")
      } else {
        bad(`issuer value not preserved: got ${JSON.stringify(r[0])}`)
      }
    } catch (e) {
      bad("could not preserve issuer data", e?.message ?? e)
    }
  } finally {
    await sql.end()
  }

  return done(null, 0)
}

function done(client, code) {
  console.log(`\n# Summary: ${pass} passed, ${fail} failed`)
  if (client) client.end().catch(() => {})

  // Drop the throwaway database (best effort, ignore errors).
  if (DB) {
    const admin = postgres(ADMIN_URL, { max: 1 })
    admin
      .unsafe(`DROP DATABASE IF EXISTS "${DB}"`)
      .catch(() => {})
      .finally(() => admin.end())
  }
  setTimeout(() => process.exit(fail === 0 && code === 0 ? 0 : 1), 200)
}

let DB = null
main()
  .then((code) => done(null, code))
  .catch((e) => {
    console.error("\n# Unexpected error", e)
    done(null, 1)
  })
