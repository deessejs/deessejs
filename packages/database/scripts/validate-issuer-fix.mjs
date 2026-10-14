// One-off validation script. Run with:
//
//   cd packages/database && node scripts/validate-issuer-fix.mjs
//
// Drives the local `t3-pg-test` Postgres (already running on 127.0.0.1:5444)
// to validate the corrective 0003 migration against two scenarios:
//   (A) drifted DB — the production state (a 4th migration that added
//       `account.issuer NOT NULL` and the unique index was applied
//       out-of-band). This is the path that the production migration
//       will actually walk. We assert signup fails with 23502 BEFORE
//       the corrective migration, and succeeds AFTER.
//   (B) fresh DB — only the in-repo migrations 0000/0001/0002 were
//       applied. This is the path a new staging environment would
//       walk. We assert the corrective migration is a no-op (no
//       error, no schema change).
//
// What this script DOES NOT do:
//   - It does not invoke Better Auth. The signup-path coverage is
//     limited to reproducing the exact `INSERT` Better Auth 1.6.23
//     issues on a successful signup (without the `issuer` column),
//     against the same `public.account` and `public.user` tables
//     the application uses.
//   - It does not send email, click magic links, or run the
//     onboarding Server Action. Those require the full app server,
//     a real Neon branch, and working email plumbing — the test
//     surface for the 1-line repair is the database constraint.
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
  // drizzle-kit separates statements with `--> statement-breakpoint`.
  // Inside a `DO $$ … $$` block, a `-->`-style comment in the middle
  // would break parsing — we keep the original Drizzle convention
  // (one breakpoint at the top of the file, then the rest is one
  // statement). The split below respects dollar-quoting boundaries
  // naively because our migration has a single `DO` block after the
  // `DROP INDEX`, with no breakpoints inside the block.
  const statements = text
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)
  for (const stmt of statements) {
    await sql.unsafe(stmt)
  }
}

async function freshDatabase(adminUrl, dbName) {
  const admin = postgres(adminUrl, { max: 1 })
  await admin.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`)
  await admin.unsafe(`CREATE DATABASE "${dbName}"`)
  await admin.end()
  return postgres(
    `postgresql://test:test@127.0.0.1:5444/${dbName}`,
    { max: 1 },
  )
}

async function applyInRepoMigrations(sql) {
  for (const f of [
    "0000_boring_steel_serpent.sql",
    "0001_magenta_firebrand.sql",
    "0002_admin_plugin_columns.sql",
  ]) {
    await execFile(sql, resolve(drizzleDir, f))
  }
}

// Simulate the production drift: the unknown 4th migration that
// Better Auth 1.7.0–1.7.2 applied. We use a DEFAULT for the ADD COLUMN
// so the ALTER TABLE does not fail on the pre-existing rows from
// 0000..0002 (which already have data in `account` in production).
// The DEFAULT is then dropped, matching the production state where
// `issuer` is `NOT NULL` with no default.
async function simulateBetterAuth17xDrift(sql) {
  await sql.unsafe(
    `ALTER TABLE "account" ADD COLUMN "issuer" text NOT NULL DEFAULT 'https://example.test'`,
  )
  await sql.unsafe(`ALTER TABLE "account" ALTER COLUMN "issuer" DROP DEFAULT`)
  await sql.unsafe(
    `CREATE UNIQUE INDEX "account_issuer_accountId_uidx"
       ON "account" ("issuer", "account_id")`,
  )
}

// Mirror Better Auth 1.6.23's credentialed signup: insert a `user`
// row, then an `account` row WITHOUT an `issuer` value. Returns the
// postgres error if the insert fails, or null on success.
async function tryBetterAuth1623Signup(sql, userId, accountId, email) {
  try {
    await sql.unsafe(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
       VALUES ('${userId}', 'Tester', '${email}', false, now(), now())`,
    )
    await sql.unsafe(
      `INSERT INTO "account"
         (id, account_id, provider_id, user_id, password, created_at, updated_at)
       VALUES ('${accountId}', '${email}', 'credential', '${userId}', 'hash', now(), now())`,
    )
    return null
  } catch (e) {
    return e
  } finally {
    // Defensive: the user insert succeeded but the account one
    // failed, so the user row may still be there. Clean it up so
    // the next step starts from a known state.
    await sql.unsafe(`DELETE FROM "user" WHERE id = '${userId}'`)
  }
}

async function scenarioDrifted(dbName) {
  console.log(`\n## Scenario A — drifted DB (production state)`)
  const sql = await freshDatabase(ADMIN_URL, dbName)
  try {
    await applyInRepoMigrations(sql)
    ok("applied 0000/0001/0002")
    await simulateBetterAuth17xDrift(sql)
    ok("simulated Better Auth 1.7.x drift (issuer NOT NULL + uidx)")

    // Insert a pre-existing OAuth row BEFORE the corrective
    // migration — the migration must preserve it.
    await sql.unsafe(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
       VALUES ('pre-existing', 'Pre-existing', 'pre@e.test', true, now(), now())`,
    )
    await sql.unsafe(
      `INSERT INTO "account"
         (id, account_id, provider_id, user_id, issuer, created_at, updated_at)
       VALUES ('pre-existing-acct', 'github|1', 'github', 'pre-existing',
               'https://github.com', now(), now())`,
    )
    ok("inserted pre-existing OAuth row (with issuer value)")

    const beforeErr = await tryBetterAuth1623Signup(
      sql,
      "u-before",
      "a-before",
      "u-before@e.test",
    )
    if (beforeErr && beforeErr.code === "23502" && /issuer/.test(String(beforeErr.message))) {
      ok("Better Auth 1.6.23 insert FAILS with 23502 not_null_violation on issuer (incident reproduced)")
    } else {
      bad(
        "expected 23502 not_null_violation on issuer before corrective migration",
        beforeErr?.message ?? beforeErr ?? "no error",
      )
      return
    }

    // Apply the corrective migration.
    await execFile(sql, resolve(drizzleDir, "0003_drop_account_issuer_unique.sql"))
    ok("applied 0003_drop_account_issuer_unique.sql")

    // Post-migration invariants.
    const col = await sql.unsafe(
      `SELECT is_nullable FROM information_schema.columns
        WHERE table_schema='public' AND table_name='account' AND column_name='issuer'`,
    )
    if (col[0]?.is_nullable === "YES") {
      ok("account.issuer is now NULL-able")
    } else {
      bad(`account.issuer is_nullable expected YES, got ${col[0]?.is_nullable}`)
    }

    const idx = await sql.unsafe(
      `SELECT 1 AS hit FROM pg_indexes
        WHERE schemaname='public' AND tablename='account'
          AND indexname='account_issuer_accountId_uidx'`,
    )
    if (idx.length === 0) {
      ok("account_issuer_accountId_uidx no longer exists")
    } else {
      bad("account_issuer_accountId_uidx still exists")
    }

    // Better Auth 1.6.23 signup must now succeed.
    const afterErr = await tryBetterAuth1623Signup(
      sql,
      "u-after",
      "a-after",
      "u-after@e.test",
    )
    if (afterErr === null) {
      ok("Better Auth 1.6.23 insert SUCCEEDS after corrective migration")
    } else {
      bad("expected 23502 to clear, but insert still failed", afterErr.message)
    }

    // The pre-existing OAuth row must still be there with its issuer
    // value intact.
    const r = await sql.unsafe(
      `SELECT issuer FROM "account" WHERE id = 'pre-existing-acct'`,
    )
    if (r[0]?.issuer === "https://github.com") {
      ok("pre-existing OAuth row preserved (issuer value intact)")
    } else {
      bad(
        `pre-existing OAuth row NOT preserved: ${JSON.stringify(r[0])}`,
      )
    }

    // Idempotency: re-apply the corrective migration. The
    // `DROP INDEX IF EXISTS` will emit a NOTICE (the index is
    // already gone) and the DO block is a no-op because the
    // column is already nullable. Both are expected.
    await execFile(sql, resolve(drizzleDir, "0003_drop_account_issuer_unique.sql"))
    ok("re-apply of 0003 succeeded (idempotent)")
  } finally {
    await sql.end()
  }
}

async function scenarioFresh(dbName) {
  console.log(`\n## Scenario B — fresh DB (new staging environment)`)
  const sql = await freshDatabase(ADMIN_URL, dbName)
  try {
    await applyInRepoMigrations(sql)
    ok("applied 0000/0001/0002 only")

    // Sanity check: the column and index must NOT exist on a fresh DB.
    const colBefore = await sql.unsafe(
      `SELECT 1 AS hit FROM information_schema.columns
        WHERE table_schema='public' AND table_name='account' AND column_name='issuer'`,
    )
    if (colBefore.length === 0) {
      ok("account.issuer does not exist (fresh DB)")
    } else {
      bad("account.issuer unexpectedly exists on fresh DB")
    }

    const idxBefore = await sql.unsafe(
      `SELECT 1 AS hit FROM pg_indexes
        WHERE schemaname='public' AND tablename='account'
          AND indexname='account_issuer_accountId_uidx'`,
    )
    if (idxBefore.length === 0) {
      ok("account_issuer_accountId_uidx does not exist (fresh DB)")
    } else {
      bad("account_issuer_accountId_uidx unexpectedly exists on fresh DB")
    }

    // Apply the corrective migration. The DO block must short-circuit
    // because there is no `issuer` column.
    await execFile(sql, resolve(drizzleDir, "0003_drop_account_issuer_unique.sql"))
    ok("applied 0003_drop_account_issuer_unique.sql (no-op on fresh DB)")

    // The schema must be unchanged: still no `issuer` column, no
    // extra index.
    const colAfter = await sql.unsafe(
      `SELECT 1 AS hit FROM information_schema.columns
        WHERE table_schema='public' AND table_name='account' AND column_name='issuer'`,
    )
    if (colAfter.length === 0) {
      ok("account.issuer still does not exist (no spurious column added)")
    } else {
      bad("account.issuer was added by the corrective migration on a fresh DB")
    }

    const idxAfter = await sql.unsafe(
      `SELECT 1 AS hit FROM pg_indexes
        WHERE schemaname='public' AND tablename='account'
          AND indexname='account_issuer_accountId_uidx'`,
    )
    if (idxAfter.length === 0) {
      ok("account_issuer_accountId_uidx still does not exist (no spurious index)")
    } else {
      bad("account_issuer_accountId_uidx was added by the corrective migration on a fresh DB")
    }

    // Better Auth 1.6.23 signup must work on a fresh DB without
    // the corrective migration having been run (it was a no-op).
    const err = await tryBetterAuth1623Signup(
      sql,
      "u-fresh",
      "a-fresh",
      "u-fresh@e.test",
    )
    if (err === null) {
      ok("Better Auth 1.6.23 insert SUCCEEDS on fresh DB")
    } else {
      bad("expected signup to succeed on fresh DB", err.message)
    }
  } finally {
    await sql.end()
  }
}

async function main() {
  const stamp = Date.now().toString(36)
  const driftedDb = `deessejs_issuer_fix_drifted_${stamp}`
  const freshDb = `deessejs_issuer_fix_fresh_${stamp}`

  console.log(`# Validation harness for 0003_drop_account_issuer_unique`)
  console.log(`# Throwaway databases: ${driftedDb}, ${freshDb}`)

  let code = 0
  try {
    await scenarioDrifted(driftedDb)
  } catch (e) {
    bad("scenario A threw unexpectedly", e)
    code = 1
  }

  try {
    await scenarioFresh(freshDb)
  } catch (e) {
    bad("scenario B threw unexpectedly", e)
    code = 1
  }

  // Best-effort cleanup of the throwaway databases. We close the
  // pool and reuse a fresh `postgres` client to avoid any "database
  // in use" error.
  const admin = postgres(ADMIN_URL, { max: 1 })
  await admin
    .unsafe(`DROP DATABASE IF EXISTS "${driftedDb}"`)
    .catch(() => {})
  await admin
    .unsafe(`DROP DATABASE IF EXISTS "${freshDb}"`)
    .catch(() => {})
  await admin.end()

  console.log(`\n# Summary: ${pass} passed, ${fail} failed`)
  process.exit(fail === 0 && code === 0 ? 0 : 1)
}

main()
