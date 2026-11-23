#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  closeSync,
  mkdirSync,
  openSync,
  readdirSync,
  lstatSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import net from "node:net"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  appUrlEnvironment,
  replaceEnvironmentLines,
  testDatabaseIdentity,
  validateTestDatabaseUrl,
} from "./dev-agent-env.mjs"
import {
  formatFixtureCredentials,
  redactTestOutput,
} from "./dev-agent-output.mjs"

const root = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
)
const [, , requestedCommand = "start", ...args] = process.argv
const command = requestedCommand === "--" ? "start" : requestedCommand
const worktreeId = createHash("sha256").update(root).digest("hex").slice(0, 12)
const databaseName = `deesse_dev_${worktreeId}`
const databaseRole = `deesse_${worktreeId}`
const localDir = path.join(root, ".local")
const envFile = path.join(root, ".env.development.local")
const node24Version = "24.22.3"
const node24Sha256 =
  "4f2b175a6d53a5c617a80dba2676238a0688cef28c6da4eba35c7d844e66fcfb"
const localNodeDir = path.join(localDir, `node-v${node24Version}-linux-x64`)
const localNodePath = path.join(localNodeDir, "bin", "node")

const fail = (message) => {
  process.stderr.write(`dev:agent: ${message}\n`)
  process.exit(1)
}

async function ensureNode24() {
  if (process.versions.node.split(".")[0] === "24") return
  if (process.platform !== "linux" || process.arch !== "x64") {
    fail(
      `Node.js 24.x is required by this repository. Current runtime: ${process.version}. Select Node 24.x for this platform and retry.`
    )
  }

  mkdirSync(localDir, { recursive: true, mode: 0o700 })
  chmodSync(localDir, 0o700)
  if (!existsSync(localNodePath)) {
    const archiveName = `node-v${node24Version}-linux-x64.tar.xz`
    const archivePath = path.join(localDir, `${archiveName}.${process.pid}.tmp`)
    const stagingDir = path.join(
      localDir,
      `node-v${node24Version}-${process.pid}.tmp`
    )
    let response
    try {
      response = await fetch(
        `https://nodejs.org/dist/v${node24Version}/${archiveName}`,
        { signal: AbortSignal.timeout(60_000) }
      )
    } catch (error) {
      fail(
        `Could not download the worktree-local Node.js ${node24Version} runtime: ${error instanceof Error ? error.message : String(error)}. Select Node 24.x manually and retry.`
      )
    }
    if (!response.ok) {
      fail(
        `Node.js download returned HTTP ${response.status}. Select Node 24.x manually and retry.`
      )
    }
    const archive = Buffer.from(await response.arrayBuffer())
    const checksum = createHash("sha256").update(archive).digest("hex")
    if (checksum !== node24Sha256) {
      fail(
        "The Node.js archive checksum did not match the pinned official SHA-256. The archive was not installed."
      )
    }

    writeFileSync(archivePath, archive, { mode: 0o600, flag: "wx" })
    mkdirSync(stagingDir, { mode: 0o700 })
    const extracted = spawnSync(
      "tar",
      ["-xJf", archivePath, "--strip-components=1", "-C", stagingDir],
      { encoding: "utf8" }
    )
    unlinkSync(archivePath)
    if (extracted.error || extracted.status !== 0) {
      rmSync(stagingDir, { recursive: true, force: true })
      fail(
        `Could not extract Node.js ${node24Version}: ${extracted.stderr?.trim() || extracted.error?.message || "tar failed"}. Install xz and tar, or select Node 24.x manually.`
      )
    }
    try {
      renameSync(stagingDir, localNodeDir)
    } catch (error) {
      rmSync(stagingDir, { recursive: true, force: true })
      if (!existsSync(localNodePath)) {
        fail(
          `Could not install worktree-local Node.js: ${error instanceof Error ? error.message : String(error)}.`
        )
      }
    }
    process.stdout.write(
      `Installed checksum-verified Node.js ${node24Version} under .local for this worktree.\n`
    )
  }

  const version = spawnSync(localNodePath, ["--version"], { encoding: "utf8" })
  if (
    version.error ||
    version.status !== 0 ||
    !version.stdout.trim().startsWith("v24.")
  ) {
    fail(
      "The worktree-local Node.js runtime is invalid. Remove .local/node-v24.22.3-linux-x64 after inspecting it, or select Node 24.x manually."
    )
  }
  const child = spawnSync(
    localNodePath,
    [fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${path.dirname(localNodePath)}:${process.env.PATH ?? ""}`,
      },
      stdio: "inherit",
    }
  )
  process.exit(child.status ?? 1)
}

await ensureNode24()

function readLocalEnv() {
  if (!existsSync(envFile)) return null
  const values = {}
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line)
    if (match) values[match[1]] = match[2]
  }
  if (values.DEV_AGENT_WORKTREE_ID !== worktreeId) {
    fail(
      `${envFile} exists but is not owned by this worktree. Move it aside or remove it manually after inspecting its contents.`
    )
  }
  if (
    values.DEV_AGENT_DB_NAME !== databaseName ||
    values.DEV_AGENT_DB_ROLE !== databaseRole
  ) {
    fail(
      "Local environment database identity does not match this worktree. Refusing database operations."
    )
  }
  return values
}

function isOwnedPrivateFile(fileStat) {
  return [
    fileStat.isFile(),
    !fileStat.isSymbolicLink(),
    (fileStat.mode & 0o777) === 0o600,
    typeof process.getuid !== "function" || fileStat.uid === process.getuid(),
  ].every(Boolean)
}

function writeLocalEnv() {
  mkdirSync(localDir, { recursive: true, mode: 0o700 })
  try {
    chmodSync(localDir, 0o700)
  } catch {}

  let values = readLocalEnv()
  if (values) {
    const additions = {
      DEV_AGENT_WORKTREE_ROOT: root,
      DEV_AGENT_MAILBOX_FILE: path.join(localDir, "mailbox.jsonl"),
      DEV_AGENT_USER_EMAIL: `agent-${worktreeId}@example.test`,
      DEV_AGENT_ADMIN_EMAIL: `admin-${worktreeId}@example.test`,
      DEV_AGENT_MEMBER_EMAIL: `member-${worktreeId}@example.test`,
      DEV_AGENT_USER_PASSWORD: randomBytes(24).toString("base64url"),
      DEV_AGENT_ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
      DEV_AGENT_MEMBER_PASSWORD: randomBytes(24).toString("base64url"),
    }
    let changed = false
    for (const [key, value] of Object.entries(additions)) {
      if (!values[key]) {
        values[key] = value
        changed = true
      }
    }
    if (changed) persistEnvironment(values)
    return values
  }

  const password = randomBytes(32).toString("base64url")
  const secret = randomBytes(48).toString("base64url")
  const portSeed = Number.parseInt(worktreeId.slice(0, 8), 16)
  const appPort = 41000 + (portSeed % 10000)
  const appUrl = `http://localhost:${appPort}`
  const databaseUrl = new URL(
    `postgresql://${databaseRole}:${password}@127.0.0.1:5432/${databaseName}`
  )
  const entries = {
    DEV_AGENT_WORKTREE_ID: worktreeId,
    DEV_AGENT_WORKTREE_ROOT: root,
    DEV_AGENT_MAILBOX_FILE: path.join(localDir, "mailbox.jsonl"),
    DEV_AGENT_DB_NAME: databaseName,
    DEV_AGENT_DB_ROLE: databaseRole,
    DEV_AGENT_PORT: String(appPort),
    DEV_AGENT_USER_EMAIL: `agent-${worktreeId}@example.test`,
    DEV_AGENT_ADMIN_EMAIL: `admin-${worktreeId}@example.test`,
    DEV_AGENT_MEMBER_EMAIL: `member-${worktreeId}@example.test`,
    DEV_AGENT_USER_PASSWORD: randomBytes(24).toString("base64url"),
    DEV_AGENT_ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
    DEV_AGENT_MEMBER_PASSWORD: randomBytes(24).toString("base64url"),
    DATABASE_URL: databaseUrl.toString(),
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: appUrl,
    APP_URL: appUrl,
    API_BASE_URL: appUrl,
    WEB_URL: appUrl,
    DOCS_URL: appUrl,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_WEB_URL: appUrl,
    NEXT_PUBLIC_DOCS_URL: appUrl,
    NEXT_PUBLIC_API_BASE_URL: appUrl,
    ALLOWED_ORIGINS: appUrl,
    PARENT_DOMAIN: "",
    MAIL_TRANSPORT: "console",
    NODE_ENV: "development",
  }
  writeFileSync(
    envFile,
    `${Object.entries(entries)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")}\n`,
    { mode: 0o600, flag: "wx" }
  )
  chmodSync(envFile, 0o600)
  return entries
}

function adminPsql(sql, values = {}) {
  const args = [
    "-X",
    "-qAt",
    "-v",
    "ON_ERROR_STOP=1",
    "-d",
    "postgres",
    "-f",
    "-",
  ]
  const input = `${Object.entries(values)
    .map(
      ([key, value]) => `\\set ${key} '${String(value).replaceAll("'", "''")}'`
    )
    .join("\n")}\n${sql}\n`
  const adminUrl = process.env.DEV_AGENT_PG_ADMIN_URL
  let result
  if (adminUrl) {
    let parsed
    try {
      parsed = new URL(adminUrl)
    } catch {
      fail("DEV_AGENT_PG_ADMIN_URL must be a valid PostgreSQL URL.")
    }
    const adminHost = parsed.hostname.replace(/^\[|\]$/g, "")
    if (!["localhost", "127.0.0.1", "::1"].includes(adminHost)) {
      fail("DEV_AGENT_PG_ADMIN_URL must connect to localhost or a loopback IP.")
    }
    result = spawnSync(
      "psql",
      ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-d", "postgres", "-f", "-"],
      {
        input,
        encoding: "utf8",
        env: {
          ...process.env,
          PGHOST: adminHost,
          PGPORT: parsed.port || "5432",
          PGUSER: decodeURIComponent(parsed.username),
          PGPASSWORD: decodeURIComponent(parsed.password),
        },
      }
    )
  } else {
    result = spawnSync("sudo", ["-n", "-u", "postgres", "psql", ...args], {
      input,
      encoding: "utf8",
    })
  }
  if (result.error || result.status !== 0) {
    throw new Error(
      "Could not use a local PostgreSQL administrator. Check DEV_AGENT_PG_ADMIN_URL or non-interactive sudo access to the postgres account."
    )
  }
  return result.stdout.trim()
}

function ensureLocalPostgres(values, reset = false) {
  const server = adminPsql("SELECT current_setting('listen_addresses');")
  const addresses = server.split(",").map((item) => item.trim())
  const loopbackAddresses = new Set(["localhost", "127.0.0.1", "::1"])
  if (
    addresses.length === 0 ||
    addresses.some((address) => !loopbackAddresses.has(address))
  ) {
    fail(
      `PostgreSQL listen_addresses is '${server}'. This bootstrap requires a loopback-only PostgreSQL listener.`
    )
  }

  const existingRole = adminPsql(
    `SELECT 1 FROM pg_roles WHERE rolname = '${databaseRole}';`
  )
  const rolePassword = new URL(values.DATABASE_URL).password
  const escapedPassword = rolePassword.replaceAll("'", "''")
  if (existingRole)
    adminPsql(
      `ALTER ROLE ${databaseRole} WITH LOGIN PASSWORD '${escapedPassword}';`
    )
  else
    adminPsql(
      `CREATE ROLE ${databaseRole} LOGIN PASSWORD '${escapedPassword}';`
    )

  const databaseOwner = adminPsql(
    `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${databaseName}';`
  )
  if (databaseOwner && databaseOwner !== databaseRole) {
    fail(
      `Database ${databaseName} already exists with owner ${databaseOwner}; refusing to use or remove it.`
    )
  }
  if (databaseOwner && reset) {
    adminPsql(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();`
    )
    adminPsql(`DROP DATABASE ${databaseName};`)
  }
  const ownerAfterReset = reset ? "" : databaseOwner
  if (!ownerAfterReset)
    adminPsql(`CREATE DATABASE ${databaseName} OWNER ${databaseRole};`)
}

function createDisposableTestDatabase(identity, baseValues) {
  const server = adminPsql("SELECT current_setting('listen_addresses');")
  const addresses = server.split(",").map((item) => item.trim())
  const loopbackAddresses = new Set(["localhost", "127.0.0.1", "::1"])
  if (
    addresses.length === 0 ||
    addresses.some((address) => !loopbackAddresses.has(address))
  ) {
    fail("PostgreSQL must listen only on loopback for disposable tests.")
  }

  const existingRole = adminPsql(
    `SELECT 1 FROM pg_roles WHERE rolname = '${identity.role}';`
  )
  const existingOwner = adminPsql(
    `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${identity.database}';`
  )
  if (existingRole || existingOwner) {
    fail(
      "Disposable test database identity already exists. Refusing to reuse or remove it."
    )
  }

  const databaseUrl = new URL(baseValues.DATABASE_URL)
  const databaseHost = databaseUrl.hostname.replace(/^\[|\]$/g, "")
  if (!["localhost", "127.0.0.1", "::1"].includes(databaseHost)) {
    fail("The development database URL is not loopback. Refusing test setup.")
  }
  const password = randomBytes(24).toString("base64url")
  databaseUrl.username = identity.role
  databaseUrl.password = password
  databaseUrl.pathname = `/${identity.database}`
  databaseUrl.search = ""
  databaseUrl.hash = ""
  validateTestDatabaseUrl(databaseUrl.toString(), identity)

  let createdRole = false
  let createdDatabase = false
  try {
    adminPsql(`CREATE ROLE ${identity.role} LOGIN PASSWORD '${password}';`)
    createdRole = true
    adminPsql(`CREATE DATABASE ${identity.database} OWNER ${identity.role};`)
    createdDatabase = true
    const createdOwner = adminPsql(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${identity.database}';`
    )
    if (createdOwner !== identity.role) {
      throw new Error("Disposable test database owner verification failed.")
    }
  } catch (error) {
    if (createdDatabase) {
      const owner = adminPsql(
        `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${identity.database}';`
      )
      if (owner === identity.role)
        adminPsql(`DROP DATABASE ${identity.database};`)
    }
    if (createdRole) {
      const owner = adminPsql(
        `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${identity.database}';`
      )
      if (!owner) adminPsql(`DROP ROLE ${identity.role};`)
    }
    throw error
  }

  return {
    url: databaseUrl.toString(),
    owner: identity.role,
  }
}

function removeDisposableTestDatabase(identity, expectedOwner) {
  const owner = adminPsql(
    `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${identity.database}';`
  )
  if (owner && owner !== expectedOwner) {
    fail("Disposable test database owner changed. Refusing cleanup.")
  }
  if (owner) {
    adminPsql(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${identity.database}' AND pid <> pg_backend_pid();`
    )
    adminPsql(`DROP DATABASE ${identity.database};`)
  }

  const roleExists = adminPsql(
    `SELECT 1 FROM pg_roles WHERE rolname = '${identity.role}';`
  )
  if (roleExists) {
    const remainingOwner = adminPsql(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${identity.database}';`
    )
    if (remainingOwner) {
      fail("Disposable test database still exists. Refusing role cleanup.")
    }
    adminPsql(`DROP ROLE ${identity.role};`)
  }
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
  const testDatabase = createDisposableTestDatabase(identity, values)
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
    removeDisposableTestDatabase(identity, testDatabase.owner)
    process.stdout.write("Disposable test database and role removed.\n")
  }
}

function localEnv(values) {
  return {
    ...process.env,
    ...values,
    NODE_ENV: "development",
    ...appUrlEnvironment(values.DEV_AGENT_PORT),
    PARENT_DOMAIN: "",
  }
}

function run(command, commandArgs, env = process.env) {
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

async function prepare({ reset = false } = {}) {
  if (!existsSync(path.join(root, "node_modules"))) {
    process.stdout.write("Installing locked workspace dependencies...\n")
    run("pnpm", ["install", "--frozen-lockfile"])
  }
  const values = writeLocalEnv()
  process.stdout.write(
    `Worktree: ${root}\nDatabase: ${databaseName} (local PostgreSQL)\n`
  )
  ensureLocalPostgres(values, reset)
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

function freePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once("error", () => resolve(false))
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)))
  })
}

function processStartTime(pid) {
  if (process.platform !== "linux") return null
  try {
    // /proc/<pid>/stat field 22 distinguishes a live original owner from a reused PID.
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8")
    const fields = stat
      .slice(stat.lastIndexOf(")") + 2)
      .trim()
      .split(/\s+/)
    return fields[19]
  } catch {
    return null
  }
}

async function start() {
  const reset = args.includes("--reset-db")
  const values = await prepare({ reset })
  const preferredPort = Number(values.DEV_AGENT_PORT)
  const existingUrl = `http://localhost:${preferredPort}`
  try {
    const response = await fetch(`${existingUrl}/api/v1/ready`, {
      signal: AbortSignal.timeout(1500),
    })
    if (
      response.ok &&
      response.headers.get("x-deesse-worktree") === worktreeId
    ) {
      run(
        "pnpm",
        [
          "--dir",
          "packages/database",
          "exec",
          "node",
          "scripts/dev-agent-seed.mjs",
        ],
        localEnv(values)
      )
      process.stdout.write(
        `Already ready: ${existingUrl}\nBrowser: use T3 preview on environment port ${preferredPort}\n`
      )
      return
    }
  } catch {}

  const port = await reservePort(preferredPort)
  values.DEV_AGENT_PORT = String(port.port)
  persistPort(values.DEV_AGENT_PORT)

  const portNumber = port.port
  const url = `http://localhost:${portNumber}`
  process.stdout.write(`Starting app and API at ${url}\n`)
  const nextCommand = [
    "--filter",
    "app",
    "exec",
    "next",
    "dev",
    "--hostname",
    "0.0.0.0",
    "--port",
    String(portNumber),
  ]
  const nextRetryDirs = [
    path.join(root, "apps/app/.next/cache/next-agentic-upgrade-retries"),
    path.join(root, "apps/app/.next/dev/cache/next-agentic-upgrade-retries"),
  ]
  const readUpgradeRetryFiles = () =>
    new Set(
      nextRetryDirs.flatMap((dir) => {
        try {
          return readdirSync(dir).map((file) => path.join(dir, file))
        } catch {
          return []
        }
      })
    )
  const retryFilesBefore = readUpgradeRetryFiles()
  let child
  let retryUsed = false
  let portReleased = false
  let shutdownSignal = null
  let failureAfterStop = null
  let forceStopTimer = null
  const releasePort = () => {
    if (portReleased) return
    portReleased = true
    closeSync(port.lockFd)
    try {
      unlinkSync(port.lockPath)
    } catch {}
  }
  const launchApp = () => {
    const launched = spawn("pnpm", nextCommand, {
      cwd: root,
      env: localEnv(values),
      stdio: "inherit",
      detached: process.platform !== "win32",
    })
    let settled = false
    const complete = (code, spawnError = null) => {
      if (settled) return
      settled = true
      if (shutdownSignal) {
        releasePort()
        process.exit(shutdownSignal === "SIGINT" ? 130 : 143)
      }
      if (spawnError) {
        releasePort()
        fail(`Could not start Next.js: ${spawnError.message}`)
      }
      if (failureAfterStop) {
        if (forceStopTimer) clearTimeout(forceStopTimer)
        releasePort()
        fail(failureAfterStop)
      }
      const filesAfter = readUpgradeRetryFiles()
      const newUpgradeNotice = [...filesAfter].some(
        (file) => !retryFilesBefore.has(file)
      )
      if (!retryUsed && code === 1 && newUpgradeNotice) {
        retryUsed = true
        process.stdout.write(
          "Next.js printed its security upgrade notice and instructed a retry. Retrying the same command once; no dependency or config upgrade is performed.\n"
        )
        child = launchApp()
        return
      }
      releasePort()
      process.exit(code ?? 1)
    }
    launched.once("error", (error) => complete(null, error))
    launched.once("exit", (code) => complete(code))
    return launched
  }
  child = launchApp()
  const stop = () => {
    try {
      if (child.pid && process.platform !== "win32")
        process.kill(-child.pid, "SIGTERM")
      else child.kill("SIGTERM")
    } catch (error) {
      if (error?.code !== "ESRCH") throw error
    }
  }
  const stopWithFailure = (message) => {
    failureAfterStop = message
    const stoppingChild = child
    stoppingChild.once("exit", () => {
      if (forceStopTimer) clearTimeout(forceStopTimer)
    })
    forceStopTimer = setTimeout(() => {
      if (stoppingChild.exitCode !== null || !stoppingChild.pid) return
      try {
        if (process.platform !== "win32")
          process.kill(-stoppingChild.pid, "SIGKILL")
        else stoppingChild.kill("SIGKILL")
      } catch {}
    }, 5000)
    stop()
  }
  process.on("SIGINT", () => {
    shutdownSignal = "SIGINT"
    stop()
  })
  process.on("SIGTERM", () => {
    shutdownSignal = "SIGTERM"
    stop()
  })

  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/v1/ready`, {
        signal: AbortSignal.timeout(2500),
      })
      if (response.ok) {
        if (response.headers.get("x-deesse-worktree") !== worktreeId) {
          stopWithFailure(
            `Port ${portNumber} answered readiness for a different worktree. The process was stopped.`
          )
          return
        }
        process.stdout.write(
          "Creating verified local accounts and organization fixtures...\n"
        )
        run(
          "pnpm",
          [
            "--dir",
            "packages/database",
            "exec",
            "node",
            "scripts/dev-agent-seed.mjs",
          ],
          localEnv(values)
        )
        process.stdout.write(
          `Ready: ${url}\nBrowser: use T3 preview on environment port ${portNumber}\nAPI: ${url}/api/v1\nCLI: pnpm dev:agent cli -- template list\nCLI login: pnpm dev:agent cli -- auth login --no-open\n`
        )
        return
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  stopWithFailure(
    `Readiness timed out at ${url}/api/v1/ready. Check app output, PostgreSQL, and migrations above.`
  )
}

async function reservePort(preferredPort) {
  const portsDir = path.join(localDir, "ports")
  mkdirSync(portsDir, { recursive: true, mode: 0o700 })
  const span = 10000
  for (let offset = 0; offset < span; offset += 1) {
    const candidate = 41000 + ((preferredPort - 41000 + offset + span) % span)
    const lockPath = path.join(portsDir, `${candidate}.lock`)
    let lockFd
    try {
      lockFd = openSync(lockPath, "wx", 0o600)
    } catch {
      let lock
      try {
        lock = JSON.parse(readFileSync(lockPath, "utf8"))
      } catch {
        fail(
          `Port lock ${lockPath} is unreadable. Inspect it and remove it only if its owning process is gone.`
        )
      }
      if (
        !Number.isSafeInteger(lock.pid) ||
        lock.pid < 2 ||
        typeof lock.worktreeId !== "string" ||
        !/^[a-f0-9]{12}$/.test(lock.worktreeId)
      ) {
        fail(
          `Port lock ${lockPath} has invalid owner metadata. Inspect it and remove it only if its owning process is gone.`
        )
      }
      let ownerAlive = true
      try {
        process.kill(lock.pid, 0)
      } catch (error) {
        if (error?.code === "ESRCH") ownerAlive = false
      }
      if (
        ownerAlive &&
        lock.processStartTime &&
        processStartTime(lock.pid) !== lock.processStartTime
      )
        ownerAlive = false
      if (!ownerAlive) {
        try {
          unlinkSync(lockPath)
        } catch {}
        offset -= 1
        continue
      }
      if (lock.worktreeId === worktreeId) {
        fail(
          `This worktree already has a live startup process (PID ${lock.pid}) reserving port ${candidate}. Check pnpm dev:agent status before starting another.`
        )
      }
      continue
    }
    if (!(await freePort(candidate))) {
      closeSync(lockFd)
      try {
        unlinkSync(lockPath)
      } catch (error) {
        if (error?.code !== "ENOENT") {
          fail(
            `Could not release occupied-port reservation ${lockPath}: ${error.message}`
          )
        }
      }
      continue
    }
    writeFileSync(
      lockFd,
      `${JSON.stringify({ pid: process.pid, processStartTime: processStartTime(process.pid), worktreeId })}\n`
    )
    return { port: candidate, lockFd, lockPath }
  }
  fail(
    "No free development port was found in the worktree port range 41000-50999."
  )
}

function persistPort(port) {
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/)
  const updated = replaceEnvironmentLines(lines, {
    DEV_AGENT_PORT: String(port),
    ...appUrlEnvironment(port),
  })
  const temporary = `${envFile}.${process.pid}.tmp`
  writeFileSync(temporary, updated.join("\n"), { mode: 0o600, flag: "wx" })
  chmodSync(temporary, 0o600)
  renameSync(temporary, envFile)
}

function persistEnvironment(values) {
  const temporary = `${envFile}.${process.pid}.tmp`
  writeFileSync(
    temporary,
    `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")}\n`,
    { mode: 0o600, flag: "wx" }
  )
  chmodSync(temporary, 0o600)
  renameSync(temporary, envFile)
}

async function main() {
  if (command === "prepare") {
    await prepare({ reset: false })
    process.stdout.write(`Prepared. Start with pnpm dev:agent start.\n`)
    return
  }
  if (command === "start") return start()
  if (command === "reset") {
    if (!args.includes("--yes"))
      fail(
        `Reset is destructive for this worktree database. Repeat with: pnpm dev:agent reset --yes (target ${databaseName}).`
      )
    await prepare({ reset: true })
    process.stdout.write(`Reset complete for ${databaseName}.\n`)
    return
  }
  if (command === "clean") {
    if (!args.includes("--yes"))
      fail(
        `Cleanup removes this worktree database and role. Repeat with: pnpm dev:agent clean --yes (target ${databaseName}).`
      )
    const values = readLocalEnv()
    if (!values)
      fail(
        `No local worktree config at ${envFile}; refusing to infer a database to remove.`
      )
    const owner = adminPsql(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${databaseName}';`
    )
    if (owner && owner !== databaseRole)
      fail(`Database owner mismatch for ${databaseName}; refusing cleanup.`)
    if (owner) {
      adminPsql(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();`
      )
      adminPsql(`DROP DATABASE ${databaseName};`)
    }
    const role = adminPsql(
      `SELECT 1 FROM pg_roles WHERE rolname = '${databaseRole}';`
    )
    if (role) adminPsql(`DROP ROLE ${databaseRole};`)
    process.stdout.write(
      `Removed only ${databaseName} and ${databaseRole}. Local credentials were kept at ${envFile}.\n`
    )
    return
  }
  if (command === "status") {
    const values = readLocalEnv()
    if (!values)
      fail(`No local config exists. Run pnpm dev:agent prepare first.`)
    const owner = adminPsql(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${databaseName}';`
    )
    process.stdout.write(
      `Worktree: ${root}\nIdentity: ${worktreeId}\nDatabase: ${databaseName} (${owner ?? "missing"})\nApp URL: http://localhost:${values.DEV_AGENT_PORT}\n`
    )
    return
  }
  if (command === "credentials") {
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
    const listenAddresses = adminPsql(
      "SELECT current_setting('listen_addresses');"
    )
      .split(",")
      .map((address) => address.trim())
    if (
      listenAddresses.length === 0 ||
      listenAddresses.some(
        (address) => !["localhost", "127.0.0.1", "::1"].includes(address)
      )
    ) {
      fail(
        "Fixture credentials are available only with loopback-only PostgreSQL."
      )
    }
    const databaseOwner = adminPsql(
      `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '${databaseName}';`
    )
    if (databaseOwner !== databaseRole) {
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
    return
  }
  if (command === "cli") {
    const values = readLocalEnv()
    if (!values)
      fail("Run pnpm dev:agent prepare before invoking the local CLI.")
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
    return
  }
  fail(
    `Unknown command '${command}'. Use start, prepare, status, credentials, test, reset --yes, clean --yes, or cli -- <command>.`
  )
}

const running = Promise.resolve().then(() =>
  command === "test" ? runDisposableTests() : main()
)
running.catch((error) =>
  fail(error instanceof Error ? error.message : String(error))
)
