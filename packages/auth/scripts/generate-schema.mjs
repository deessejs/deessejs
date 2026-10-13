#!/usr/bin/env node
/**
 * Generate `packages/database/src/schema/auth.ts` from the Better Auth
 * server config and reconcile the application-specific additions that
 * the upstream `auth` CLI does not own.
 *
 * Why this exists:
 *
 *   The `auth generate` CLI (versions 1.4.22, 1.6.23, and 1.7.7)
 *   emits a Drizzle schema file from the plugin stack configured in
 *   `packages/auth/src/auth.ts`. The committed
 *   `packages/database/src/schema/auth.ts` is the same file with the
 *   application-specific additions the CLI does not know about:
 *
 *     • unique constraint on the deviceCode table's `device_code`
 *       and `user_code` columns
 *     • foreign key from the deviceCode table's `user_id` to the
 *       `user` table, with cascade delete
 *     • indexes on the deviceCode table's `user_id` and `expires_at`
 *     • `status` default of `'pending'`
 *     • `polling_interval` declared as `bigint` with `mode: "number"`
 *       to match the plugin's `z.number()` expectation
 *     • `created_at` and `updated_at` columns
 *     • the table name itself (`device_code` instead of the CLI's
 *       `device_code` literal — they currently match, but the
 *       split between export name and SQL identifier is documented)
 *
 *   A previous revision replaced the script with `echo && exit 1` so
 *   a regenerated schema would silently diverge from the committed
 *   file. This script restores a deterministic workflow:
 *
 *     1. Run `auth generate` into a scratch file.
 *     2. Apply the application-specific additions listed above on
 *        the deviceCode block. The shape is the documented
 *        application-side decoration, mirrored from
 *        `0001_magenta_firebrand.sql`.
 *     3. Compare the result against the committed file. If they
 *        differ, copy the result into place and exit 1 with the
 *        diff. The reviewer inspects, adjusts if needed, and reruns
 *        to confirm determinism.
 *
 *   On a successful second run, step 3 is a no-op (exit 0) and the
 *   diff is empty.
 *
 * Failure modes:
 *
 *   - Missing CLI binary, non-zero CLI exit, missing scratch file,
 *     or unexpected CLI output structure → exit 1 with an
 *     actionable explanation.
 *   - Drift → exit 1 with the diff inlined. The reviewer inspects
 *     `git diff packages/database/src/schema/auth.ts`, applies any
 *     legitimate additions, and reruns.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const target = resolve(repoRoot, "packages/database/src/schema/auth.ts");
const scratch = resolve(pkgRoot, ".auth.generated.ts");

function fail(msg, exit = 1) {
  console.error(`auth:generate: ${msg}`);
  process.exit(exit);
}

// Best-effort build of the workspace deps the auth config imports.
// The `auth generate` CLI uses `jiti` to load source files, so it
// does not require `dist/` to exist. If `tsc` is failing (for
// example, due to the upstream `auth@1.7.x` TS2883 inference issue
// that PR #214 addresses in `packages/auth/src/auth.ts`), the
// script continues to invoke the CLI; only an actual CLI failure
// aborts generation.
function buildDeps() {
  try {
    // `shell: true` is required on Windows because `node`'s spawn
    // does not see the user's PATH; the command is a fixed string
    // with no interpolation, so the SonarQube no-os-command-from-path
    // warning is a false positive.
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    execFileSync("pnpm turbo build --filter=@workspace/auth --force", {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
  } catch {
    /* best-effort */
  }
}

function runCli() {
  const cliName = process.platform === "win32" ? "auth.CMD" : "auth";
  const cliBin = resolve(pkgRoot, "node_modules", ".bin", cliName);
  const args = [
    "generate",
    "--config",
    resolve(pkgRoot, "src/auth.ts"),
    "--output",
    scratch,
    "--y",
  ];
  try {
    execFileSync(cliBin, args, {
      cwd: pkgRoot,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
  } catch (err) {
    const stderrText =
      err && err.stderr ? err.stderr.toString().trim() : String(err);
    fail(
      `auth CLI exited non-zero. Run \`pnpm exec auth ${args.join(
        " ",
      )}\` from packages/auth/ to inspect:\n${stderrText}`,
    );
  }
}

// Application-specific additions. Mirror the constraints and
// columns declared in `0001_magenta_firebrand.sql`. Keep the
// column order matching the upstream CLI where possible (the CLI
// orders fields by their declaration order in the plugin schema).
// `pollingInterval` is `bigint({ mode: "number" })` rather than
// `integer` so the SQL column matches the original 0001 migration
// (`bigint` column) while the JS value matches the plugin's
// `z.number()` expectation. The `unique(...)` and `foreignKey(...)`
// calls name the constraints explicitly so drizzle-kit does not
// rename them on every regeneration. The index callback restores
// the `deviceCode_userId_idx` and `deviceCode_expiresAt_idx`
// indexes the CLI does not emit.
const reconciledDeviceCodeBlock =
  `export const deviceCode = pgTable(
  "device_code",
  {
    id: text("id").primaryKey(),
    deviceCode: text("device_code").notNull(),
    userCode: text("user_code").notNull(),
    userId: text("user_id"),
    expiresAt: timestamp("expires_at").notNull(),
    status: text("status").notNull().default("pending"),
    lastPolledAt: timestamp("last_polled_at"),
    pollingInterval: bigint("polling_interval", { mode: "number" }),
    clientId: text("client_id"),
    scope: text("scope"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique("deviceCode_device_code_unique").on(table.deviceCode),
    unique("deviceCode_user_code_unique").on(table.userCode),
    foreignKey({
      name: "deviceCode_user_id_user_id_fk",
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    index("deviceCode_userId_idx").on(table.userId),
    index("deviceCode_expiresAt_idx").on(table.expiresAt),
  ],
);`;

// Header block prepended after the import lines. Documents the
// migration history and the application-specific additions. Kept
// short so the file does not drift from the generator output on
// every run.
const headerBlock = `
// Auth schema. Runtime source of truth for the tables the Better
// Auth server reads and writes. Stay in lock-step with the
// migration history under ./drizzle/:
//
//   - 0000_boring_steel_serpent.sql (account, session, user, verification)
//   - 0001_magenta_firebrand.sql  (deviceCode + 0000 indexes/FKs)
//   - 0002_rename_device_code.sql (deviceCode -> device_code; metadata-only)
//
// The TypeScript export keeps its PascalCase name (deviceCode) but
// the SQL identifier is device_code. The export name is the stable
// API surface; the SQL identifier is what the database sees and
// what drizzle-kit diffs. The application-specific additions
// (named unique constraints, named FK with cascade delete, status
// default of 'pending', bigint polling_interval with mode: "number",
// created_at and updated_at columns) are reconciled by
// packages/auth/scripts/generate-schema.mjs after each
// auth:generate run. Re-run pnpm --filter @workspace/auth
// auth:generate after a Better Auth upgrade to confirm the
// committed file still matches the generator output.
//
// The admin plugin (admin() in packages/auth/src/auth.ts) adds the
// four columns on user and the impersonated_by column on session
// in a later migration.
`;

function reconcileDeviceTableIndexes(content) {
  // The CLI emits `integer` (not `bigint`) for `pollingInterval`; the
  // original 0001 migration declares `polling_interval` as `bigint`,
  // and the plugin's `z.number()` expectation maps to `bigint({ mode:
  // "number" })` per Drizzle's docs. The CLI does not emit named
  // `unique(...)` or `foreignKey(...)` calls — we use explicit names
  // so drizzle-kit does not rename the constraints on every
  // regeneration. Add the missing imports to the
  // `drizzle-orm/pg-core` import list so the reconciled file
  // references real imports.
  const importRegex =
    /import\s*\{([^}]+)\}\s*from\s*"drizzle-orm\/pg-core";?/;
  const existing = content.match(importRegex);
  if (!existing) {
    fail(
      `Generated file is missing the drizzle-orm/pg-core import.`,
    );
  }
  const names = new Set(
    existing[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const extra of ["bigint", "foreignKey", "unique"]) {
    names.add(extra);
  }
  // The schema uses `bigint({ mode: "number" })` for the
  // deviceCode polling_interval column, so `integer` is unused
  // once the curated block is in place. Drop it so the import
  // list does not flag as unused.
  names.delete("integer");
  const reordered = Array.from(names).sort((a, b) => {
    const order = [
      "bigint",
      "boolean",
      "foreignKey",
      "index",
      "pgTable",
      "text",
      "timestamp",
      "unique",
    ];
    return order.indexOf(a) - order.indexOf(b);
  });
  const newImport = `import {\n  ${reordered.join(",\n  ")},\n} from "drizzle-orm/pg-core";`;
  let out = content.replace(importRegex, newImport + headerBlock);

  // The CLI does not emit the index callback, unique constraints,
  // FK references, status default, bigint pollingInterval, or
  // created_at / updated_at columns; we replace the deviceCode
  // block with the curated one that mirrors 0001_magenta_firebrand.sql.
  const block = reconciledDeviceCodeBlock + "\n";
  const regex =
    /export const deviceCode = pgTable\("device_code", \{[\s\S]*?\n\}\);/;
  if (!regex.test(out)) {
    fail(
      `Could not find deviceCode pgTable block in generated output. The Better Auth CLI may have changed its output shape; update packages/auth/scripts/generate-schema.mjs.`,
    );
  }
  out = out.replace(regex, block);
  return out;
}

function diffLines(a, b) {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const max = Math.max(aLines.length, bLines.length);
  const out = [];
  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) {
      out.push(
        `@@ line ${i + 1} @@\n - ${aLines[i] ?? ""}\n + ${bLines[i] ?? ""}`,
      );
    }
  }
  return out.join("\n");
}

function main() {
  if (!existsSync(resolve(pkgRoot, "src/auth.ts"))) {
    fail(`Could not find ${resolve(pkgRoot, "src/auth.ts")}`);
  }
  if (!existsSync(target)) {
    fail(`Could not find ${target}`);
  }
  buildDeps();
  runCli();
  if (!existsSync(scratch)) {
    fail(`auth CLI did not produce ${scratch}`);
  }
  const generated = readFileSync(scratch, "utf8");
  const reconciled = reconcileDeviceTableIndexes(generated);
  const committed = readFileSync(target, "utf8");
  if (reconciled === committed) {
    rmSync(scratch, { force: true });
    console.log("auth:generate: schema is up to date.");
    process.exit(0);
  }
  writeFileSync(target, reconciled);
  const diff = diffLines(committed, reconciled);
  console.error(
    `auth:generate: regenerated schema differs from the committed file. The proposed content has been written to ${target}; review the diff and re-run to confirm.`,
  );
  console.error(diff);
  rmSync(scratch, { force: true });
  process.exit(1);
}

main();