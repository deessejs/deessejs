#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { ensureNodeRuntime } from "./processes.mjs"
import {
  createEnvironmentStore,
  localRuntimeEnvironment,
  testDatabaseIdentity,
} from "./environment.mjs"
import { createPostgresManager } from "./postgres.mjs"
import { createDevelopmentServer } from "./server.mjs"
import { formatFixtureCredentials, redactTestOutput } from "./output.mjs"

const root = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
)
const [, , requestedCommand = "start", ...args] = process.argv
await ensureNodeRuntime({
  root,
  localDir: path.join(root, ".local"),
  argv: process.argv.slice(2),
  environment: process.env,
})
const command = requestedCommand === "--" ? "start" : requestedCommand
const worktreeId = createHash("sha256").update(root).digest("hex").slice(0, 12)
const databaseName = `deesse_dev_${worktreeId}`
const databaseRole = `deesse_${worktreeId}`
const localDir = path.join(root, ".local")
const envFile = path.join(root, ".env.development.local")
const environmentStore = createEnvironmentStore({
  root,
  worktreeId,
  databaseName,
  databaseRole,
  localDir,
  envFile,
})
const {
  readLocalEnv,
  writeLocalEnv,
  isOwnedPrivateFile,
  ensurePrivateRuntimeHome,
  persistPort,
} = environmentStore

const fail = (message) => {
  process.stderr.write(`dev:agent: ${message}\n`)
  process.exit(1)
}

function localEnv(values = {}) {
  ensurePrivateRuntimeHome()
  return localRuntimeEnvironment(process.env, values, {
    root,
    appDir: path.join(root, "apps/app"),
    localDir,
  })
}

function postgres(values) {
  return createPostgresManager({
    databaseName,
    databaseRole,
    databaseUrl: values.DATABASE_URL,
    adminUrl: process.env.DEV_AGENT_PG_ADMIN_URL,
    environment: localEnv(values),
  })
}

function runCaptured(commandName, commandArgs, env, secretValues) {
  const result = spawnSync(commandName, commandArgs, {
    cwd: root,
    env,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
  const output = redactTestOutput(
    `${result.stdout ?? ""}${result.stderr ?? ""}`,
    secretValues
  )
  if (output) process.stdout.write(output)
  if (result.error || result.status !== 0) {
    throw new Error(
      `${commandName} ${commandArgs.join(" ")} failed${result.status === null ? `: ${result.error?.message ?? "unknown error"}` : ` with exit code ${result.status}`}. Output above was redacted.`
    )
  }
}

function runDisposableTests() {
  const values = readLocalEnv()
  if (!values) fail("Run pnpm dev:agent prepare before running isolated tests.")

  const runId = randomBytes(6).toString("hex")
  const identity = testDatabaseIdentity(worktreeId, runId)
  const manager = postgres(values)
  const testDatabase = manager.createDisposableTestDatabase(identity, values)
  const testValues = {
    ...localEnv(values),
    DATABASE_URL: testDatabase.url,
    TEST_DATABASE_URL: testDatabase.url,
    NODE_ENV: "test",
  }
  const secrets = [
    values.DEV_AGENT_USER_PASSWORD,
    values.DEV_AGENT_ADMIN_PASSWORD,
    values.DEV_AGENT_MEMBER_PASSWORD,
    values.BETTER_AUTH_SECRET,
    testDatabase.url,
  ]

  process.stdout.write(`Disposable test database: ${identity.database}\n`)
  try {
    runCaptured("pnpm", ["db:migrate"], testValues, secrets)
    runCaptured("pnpm", ["exec", "turbo", "run", "test"], testValues, secrets)
  } finally {
    manager.removeDisposableTestDatabase(identity, testDatabase.owner)
    process.stdout.write("Disposable test database and role removed.\n")
  }
}

function run(command, commandArgs, env = localEnv(readLocalEnv() ?? {})) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env,
    stdio: "inherit",
  })
  if (result.error || result.status !== 0) {
    fail(
      `${command} ${commandArgs.join(" ")} failed${result.status === null ? `: ${result.error?.message ?? "unknown error"}` : ` with exit code ${result.status}`}.`
    )
  }
}

async function setupWorktree({ reset = false } = {}) {
  const values = writeLocalEnv()
  const manager = postgres(values)
  process.stdout.write(
    `Worktree: ${root}\nDatabase: ${databaseName} (local PostgreSQL)\n`
  )
  manager.ensureLocalPostgres(reset)
  if (!existsSync(path.join(root, "node_modules"))) {
    process.stdout.write("Installing locked workspace dependencies...\n")
    run("pnpm", ["install", "--frozen-lockfile"], localEnv(values))
  }
  process.stdout.write("Building database runtime dependencies...\n")
  run(
    "pnpm",
    ["exec", "turbo", "run", "build", "--filter=@workspace/database^..."],
    localEnv(values)
  )
  process.stdout.write(
    reset
      ? "Reapplying migrations to the reset worktree database...\n"
      : "Applying pending migrations...\n"
  )
  run("pnpm", ["db:migrate"], localEnv(values))
  process.stdout.write("Building app dependencies...\n")
  run(
    "pnpm",
    ["exec", "turbo", "run", "build", "--filter=app^..."],
    localEnv(values)
  )
  return values
}

const developmentServer = createDevelopmentServer({
  root,
  localDir,
  worktreeId,
  fail,
  prepare: setupWorktree,
  localEnv,
  run,
  spawnChild: spawn,
  persistPort,
})

async function setupCommand() {
  await setupWorktree({ reset: false })
  process.stdout.write("Prepared. Start with pnpm dev:agent start.\n")
}

async function resetCommand() {
  if (!args.includes("--yes")) {
    fail(
      `Reset is destructive for this worktree database. Repeat with: pnpm dev:agent reset --yes (target ${databaseName}).`
    )
  }
  await setupWorktree({ reset: true })
  process.stdout.write(`Reset complete for ${databaseName}.\n`)
}

function cleanCommand() {
  if (!args.includes("--yes")) {
    fail(
      `Cleanup removes this worktree database and role. Repeat with: pnpm dev:agent clean --yes (target ${databaseName}).`
    )
  }
  const values = readLocalEnv()
  if (!values) {
    fail(
      `No local worktree config at ${envFile}; refusing to infer a database to remove.`
    )
  }
  postgres(values).removeWorktreeDatabase()
  process.stdout.write(
    `Removed only ${databaseName} and ${databaseRole}. Local credentials were kept at ${envFile}.\n`
  )
}

function statusCommand() {
  const values = readLocalEnv()
  if (!values) fail("No local config exists. Run pnpm dev:agent prepare first.")
  const owner = postgres(values).databaseOwner()
  process.stdout.write(
    `Worktree: ${root}\nIdentity: ${worktreeId}\nDatabase: ${databaseName} (${owner ?? "missing"})\nApp URL: http://localhost:${values.DEV_AGENT_PORT}\n`
  )
}

function credentialsCommand() {
  let credentialFile
  try {
    credentialFile = lstatSync(envFile)
  } catch {
    fail("Run pnpm dev:agent prepare first.")
  }
  if (!isOwnedPrivateFile(credentialFile)) {
    fail(
      "Fixture credentials require an owned, mode-0600 local environment file."
    )
  }
  const values = readLocalEnv()
  if (!values) fail("Run pnpm dev:agent prepare first.")
  const databaseManager = postgres(values)
  databaseManager.assertLoopbackServer()
  if (databaseManager.databaseOwner() !== databaseRole) {
    fail("Fixture credentials require this worktree's database and owner.")
  }
  process.stdout.write(
    formatFixtureCredentials(values, {
      worktreeId,
      root,
      databaseName,
      databaseRole,
    })
  )
}

function cliCommand() {
  const values = readLocalEnv()
  if (!values) fail("Run pnpm dev:agent prepare before invoking the local CLI.")
  const appUrl = `http://localhost:${values.DEV_AGENT_PORT}`
  const home = path.join(localDir, "cli-home")
  mkdirSync(home, { recursive: true, mode: 0o700 })
  run(
    "pnpm",
    ["exec", "turbo", "run", "build", "--filter=@deessejs/cli..."],
    localEnv(values)
  )
  const cliArgs = args.filter((arg) => arg !== "--")
  const child = spawn(process.execPath, ["./dist/index.js", ...cliArgs], {
    cwd: path.join(root, "apps/cli"),
    env: {
      ...localEnv(values),
      HOME: home,
      USERPROFILE: home,
      DEESSEJS_API_URL: appUrl,
    },
    stdio: "inherit",
  })
  child.once("exit", (code) => process.exit(code ?? 1))
}

const commandHandlers = {
  prepare: setupCommand,
  start: () => developmentServer.start(args),
  reset: resetCommand,
  clean: cleanCommand,
  status: statusCommand,
  credentials: credentialsCommand,
  cli: cliCommand,
}

async function main() {
  const handler = commandHandlers[command]
  if (!handler && command !== "test") {
    fail(
      `Unknown command '${command}'. Use start [--r2-local], prepare, status, credentials, test, reset --yes, clean --yes, or cli -- <command>.`
    )
  }
  if (command === "test") return runDisposableTests()
  return handler()
}

main().catch((error) =>
  fail(error instanceof Error ? error.message : String(error))
)
