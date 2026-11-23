import { randomBytes } from "node:crypto"
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

const APP_URL_KEYS = [
  "APP_URL",
  "API_BASE_URL",
  "BETTER_AUTH_URL",
  "WEB_URL",
  "DOCS_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_WEB_URL",
  "NEXT_PUBLIC_DOCS_URL",
  "ALLOWED_ORIGINS",
]

const CHILD_PROCESS_KEYS = [
  "PATH",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
  "TMPDIR",
  "TMP",
  "TEMP",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "TZ",
  "TERM",
  "COLORTERM",
  "NO_COLOR",
  "FORCE_COLOR",
  "CI",
]

const LOCAL_VALUE_KEYS = [
  "DEV_AGENT_WORKTREE_ID",
  "DEV_AGENT_WORKTREE_ROOT",
  "DEV_AGENT_MAILBOX_FILE",
  "DEV_AGENT_DB_NAME",
  "DEV_AGENT_DB_ROLE",
  "DEV_AGENT_PORT",
  "DEV_AGENT_USER_EMAIL",
  "DEV_AGENT_USER_PASSWORD",
  "DEV_AGENT_ADMIN_EMAIL",
  "DEV_AGENT_ADMIN_PASSWORD",
  "DEV_AGENT_MEMBER_EMAIL",
  "DEV_AGENT_MEMBER_PASSWORD",
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "BETTER_AUTH_SECRET",
]

// These schema-backed options can activate authenticated integrations or
// authorize a remote service endpoint. Set them before Next's dotenv loader
// starts so root .env files cannot fill them from the development process.
export const DISABLED_REMOTE_SCHEMA_KEYS = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_FROM_NAME",
  "RESEND_PLAYBOOK_TOPIC_ID",
  "GITHUB_TOKEN",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_APP_CLIENT_ID",
  "GITHUB_APP_CLIENT_SECRET",
  "GITHUB_APP_SLUG",
  "GITHUB_APP_TOKEN_ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_AVATARS_BUCKET",
  "R2_ENDPOINT",
  "R2_REGION",
  "CRON_SECRET",
]

function dotenvKeys(directories) {
  const keys = new Set()
  for (const directory of directories) {
    for (const filename of dotenvFiles(directory)) {
      for (const key of dotenvFileKeys(filename)) keys.add(key)
    }
  }
  return keys
}

function dotenvFiles(directory) {
  try {
    return readdirSync(directory)
      .filter((file) => file === ".env" || file.startsWith(".env."))
      .map((file) => path.join(directory, file))
  } catch {
    return []
  }
}

function dotenvFileKeys(filename) {
  try {
    if (!lstatSync(filename).isFile()) return []
    return readFileSync(filename, "utf8")
      .split(/\r?\n/)
      .map(dotenvAssignmentKey)
      .filter(Boolean)
  } catch {
    // Unreadable dotenv files cannot provide a child environment value.
    return []
  }
}

function dotenvAssignmentKey(line) {
  const assignment = line.trim().replace(/^export\s+/, "")
  const delimiter = assignment.indexOf("=")
  if (delimiter < 1) return null
  const key = assignment.slice(0, delimiter).trim()
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : null
}

export function appUrlEnvironment(port) {
  const appUrl = `http://localhost:${port}`
  return Object.fromEntries(APP_URL_KEYS.map((key) => [key, appUrl]))
}

export function createEnvironmentStore({
  root,
  worktreeId,
  databaseName,
  databaseRole,
  localDir,
  envFile,
}) {
  function readLocalEnv() {
    if (!existsSync(envFile)) return null
    const values = {}
    for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line)
      if (match) values[match[1]] = match[2]
    }
    if (values.DEV_AGENT_WORKTREE_ID !== worktreeId) {
      throw new Error(
        `${envFile} exists but is not owned by this worktree. Move it aside or remove it manually after inspecting its contents.`
      )
    }
    if (
      values.DEV_AGENT_DB_NAME !== databaseName ||
      values.DEV_AGENT_DB_ROLE !== databaseRole
    ) {
      throw new Error(
        "Local environment database identity does not match this worktree. Refusing database operations."
      )
    }
    return values
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

  function writeLocalEnv() {
    mkdirSync(localDir, { recursive: true, mode: 0o700 })
    try {
      chmodSync(localDir, 0o700)
    } catch {
      // The subsequent private-file creation will fail if permissions remain unsafe.
    }

    const values = readLocalEnv()
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

  function isOwnedPrivateFile(fileStat) {
    return [
      fileStat.isFile(),
      !fileStat.isSymbolicLink(),
      (fileStat.mode & 0o777) === 0o600,
      typeof process.getuid !== "function" || fileStat.uid === process.getuid(),
    ].every(Boolean)
  }

  function ensurePrivateRuntimeHome() {
    mkdirSync(path.join(localDir, "runtime-home"), {
      recursive: true,
      mode: 0o700,
    })
    chmodSync(path.join(localDir, "runtime-home"), 0o700)
  }

  function persistPort(port) {
    const lines = readFileSync(envFile, "utf8").split(/\r?\n/)
    const updated = replaceEnvironmentLines(lines, {
      DEV_AGENT_PORT: String(port),
      ...appUrlEnvironment(port),
    })
    const temporary = `${envFile}.${process.pid}.tmp`
    writeFileSync(temporary, updated.join("\n"), {
      mode: 0o600,
      flag: "wx",
    })
    chmodSync(temporary, 0o600)
    renameSync(temporary, envFile)
  }

  return {
    readLocalEnv,
    writeLocalEnv,
    isOwnedPrivateFile,
    ensurePrivateRuntimeHome,
    persistPort,
    persistEnvironment,
  }
}

export function localRuntimeEnvironment(
  parentEnvironment,
  values,
  { root, appDir, localDir }
) {
  const environment = {}
  for (const key of CHILD_PROCESS_KEYS) {
    if (parentEnvironment[key] !== undefined) {
      environment[key] = parentEnvironment[key]
    }
  }
  for (const key of LOCAL_VALUE_KEYS) {
    if (values[key] !== undefined) environment[key] = values[key]
  }
  for (const key of dotenvKeys([root, appDir])) {
    if (environment[key] === undefined) environment[key] = ""
  }

  environment.HOME = path.join(localDir, "runtime-home")
  environment.USERPROFILE = environment.HOME
  environment.NODE_ENV = "development"
  environment.DEV_AGENT_LOCAL_RUNTIME = "true"
  environment.MAIL_TRANSPORT = "console"
  environment.PARENT_DOMAIN = ""
  environment.AWS_EC2_METADATA_DISABLED = "true"
  environment.AWS_SHARED_CREDENTIALS_FILE = path.join(
    environment.HOME,
    ".aws/credentials-disabled"
  )
  environment.AWS_CONFIG_FILE = path.join(
    environment.HOME,
    ".aws/config-disabled"
  )
  environment.NEXT_TELEMETRY_DISABLED = "1"
  Object.assign(environment, appUrlEnvironment(values.DEV_AGENT_PORT ?? "3001"))
  environment.MCP_RESOURCE_URL = `http://localhost:${values.DEV_AGENT_PORT ?? "3001"}/api/v1/mcp`
  for (const key of DISABLED_REMOTE_SCHEMA_KEYS) environment[key] = ""
  return environment
}

export function validateWorktreeDatabaseUrl(
  databaseUrl,
  identity,
  adminUrl = undefined
) {
  let target
  try {
    target = new URL(databaseUrl)
  } catch {
    throw new Error("Invalid worktree development database URL.")
  }

  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"])
  const targetHost = target.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  let targetUser
  try {
    targetUser = decodeURIComponent(target.username)
  } catch {
    throw new Error("Worktree development database URL has an invalid user.")
  }

  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !allowedHosts.has(targetHost) ||
    targetUser !== identity.databaseRole ||
    target.pathname !== `/${identity.databaseName}`
  ) {
    throw new Error(
      "DATABASE_URL must target this worktree's loopback database and role."
    )
  }

  try {
    if (!decodeURIComponent(target.password)) throw new Error()
  } catch {
    throw new Error("DATABASE_URL must contain a valid worktree role password.")
  }

  if (!adminUrl) {
    if ((target.port || "5432") !== "5432") {
      throw new Error(
        "A non-default local PostgreSQL port requires DEV_AGENT_PG_ADMIN_URL for the same endpoint."
      )
    }
    return target
  }

  let administrator
  try {
    administrator = new URL(adminUrl)
  } catch {
    throw new Error("DEV_AGENT_PG_ADMIN_URL must be a valid PostgreSQL URL.")
  }
  const adminHost = administrator.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  const validAdminProtocol = ["postgres:", "postgresql:"].includes(
    administrator.protocol
  )
  const matchingLoopbackHost =
    allowedHosts.has(adminHost) && adminHost === targetHost
  const matchingPort =
    (administrator.port || "5432") === (target.port || "5432")
  if (!validAdminProtocol || !matchingLoopbackHost || !matchingPort) {
    throw new Error(
      "DEV_AGENT_PG_ADMIN_URL must use the same loopback host and port as DATABASE_URL."
    )
  }

  return target
}

export function replaceEnvironmentLines(lines, updates) {
  const updateKeys = new Set(Object.keys(updates))
  const seenKeys = new Set()
  const replaced = lines.map((line) => {
    const delimiter = line.indexOf("=")
    if (delimiter < 1) return line
    const key = line.slice(0, delimiter)
    if (!updateKeys.has(key)) return line
    seenKeys.add(key)
    return `${key}=${updates[key]}`
  })

  for (const [key, value] of Object.entries(updates)) {
    if (!seenKeys.has(key)) replaced.push(`${key}=${value}`)
  }
  return replaced
}

export function testDatabaseIdentity(worktreeId, runId) {
  if (!/^[a-f0-9]{12}$/.test(worktreeId) || !/^[a-f0-9]{12}$/.test(runId)) {
    throw new Error("Invalid disposable test database identity.")
  }

  return {
    database: `deesse_test_${worktreeId}_${runId}`,
    role: `deesse_test_${worktreeId}_${runId}`,
  }
}

export function validateTestDatabaseUrl(
  databaseUrl,
  identity,
  baseDatabaseUrl = undefined
) {
  let url
  try {
    url = new URL(databaseUrl)
  } catch {
    throw new Error("Invalid disposable test database URL.")
  }

  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"])
  const hostname = url.hostname.replace(/^\[|\]$/g, "")
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !allowedHosts.has(hostname) ||
    decodeURIComponent(url.username) !== identity.role ||
    url.pathname !== `/${identity.database}`
  ) {
    throw new Error("Test database URL does not match its isolated identity.")
  }

  if (baseDatabaseUrl) {
    let base
    try {
      base = new URL(baseDatabaseUrl)
    } catch {
      throw new Error("Invalid worktree development database URL.")
    }
    if (
      url.hostname.replace(/^\[|\]$/g, "").toLowerCase() !==
        base.hostname.replace(/^\[|\]$/g, "").toLowerCase() ||
      (url.port || "5432") !== (base.port || "5432")
    ) {
      throw new Error(
        "Test database URL must use the same loopback endpoint as the worktree database."
      )
    }
  }

  return url
}
