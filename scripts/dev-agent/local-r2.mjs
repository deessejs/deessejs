import { randomBytes, randomUUID } from "node:crypto"
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

export const LOCAL_R2_PORT_RANGE = { start: 51000, end: 60999 }
export const LOCAL_R2_S3_PATH = "/cdn-cgi/local/r2/s3"

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])
const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_AVATARS_BUCKET",
  "R2_TEMPLATE_RELEASES_BUCKET",
  "R2_TEMPLATE_RELEASES_STAGING_BUCKET",
  "R2_ENDPOINT",
  "R2_REGION",
]

function assertWorktreeId(worktreeId) {
  if (!/^[a-f0-9]{12}$/.test(worktreeId)) {
    throw new Error("Invalid local R2 worktree identity.")
  }
}

function privateDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const info = lstatSync(directory)
  const invalid = [
    !info.isDirectory(),
    info.isSymbolicLink(),
    (info.mode & 0o777) !== 0o700,
    typeof process.getuid === "function" && info.uid !== process.getuid(),
  ].some(Boolean)
  if (invalid) {
    throw new Error("Local R2 state requires an owned, mode-0700 directory.")
  }
}

function privateFile(file) {
  const info = lstatSync(file)
  const invalid = [
    !info.isFile(),
    info.isSymbolicLink(),
    (info.mode & 0o777) !== 0o600,
    typeof process.getuid === "function" && info.uid !== process.getuid(),
  ].some(Boolean)
  if (invalid) {
    throw new Error("Local R2 state requires an owned, mode-0600 file.")
  }
}

function writePrivateFile(file, contents) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(temporary, contents, { mode: 0o600, flag: "wx" })
  chmodSync(temporary, 0o600)
  renameSync(temporary, file)
  chmodSync(file, 0o600)
}

export function localR2Directory(localDir, worktreeId) {
  assertWorktreeId(worktreeId)
  return path.join(localDir, "dev-agent-r2", worktreeId)
}

export function preferredLocalR2Port(worktreeId) {
  assertWorktreeId(worktreeId)
  const seed = Number.parseInt(worktreeId.slice(0, 8), 16)
  return LOCAL_R2_PORT_RANGE.start + (seed % 10000)
}

export function localR2Endpoint(port) {
  if (
    !Number.isInteger(port) ||
    port < LOCAL_R2_PORT_RANGE.start ||
    port > LOCAL_R2_PORT_RANGE.end
  ) {
    throw new Error("Local R2 port is outside the reserved worktree range.")
  }
  return `http://127.0.0.1:${port}${LOCAL_R2_S3_PATH}`
}

export function validateLocalS3Endpoint(endpoint) {
  let parsed
  try {
    parsed = new URL(endpoint)
  } catch {
    throw new Error("Local R2 endpoint must be a valid URL.")
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  const invalid = [
    parsed.protocol !== "http:",
    !LOOPBACK_HOSTS.has(hostname),
    !parsed.port,
    Boolean(parsed.username),
    Boolean(parsed.password),
    Boolean(parsed.search),
    Boolean(parsed.hash),
    parsed.pathname !== LOCAL_R2_S3_PATH,
  ].some(Boolean)
  if (invalid) {
    throw new Error(
      "Local R2 endpoint must use HTTP on loopback with the Wrangler S3 path and no credentials, query, or fragment."
    )
  }
  const port = Number(parsed.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Local R2 endpoint has an invalid port.")
  }
  return { hostname, port }
}

export function validateLocalR2State(state, worktreeId) {
  assertWorktreeId(worktreeId)
  if (!state || state.version !== 1 || state.worktreeId !== worktreeId) {
    throw new Error("Local R2 state does not belong to this worktree.")
  }
  if (state.accountId !== `djs-local-${worktreeId}`) {
    throw new Error("Local R2 account ID is not the generated dummy value.")
  }
  if (
    typeof state.accessKeyId !== "string" ||
    !new RegExp(`^djslocal-${worktreeId}-[a-f0-9]{32}$`).test(state.accessKeyId)
  ) {
    throw new Error("Local R2 access key is not a generated local credential.")
  }
  if (
    typeof state.secretAccessKey !== "string" ||
    !/^[a-f0-9]{64}$/.test(state.secretAccessKey)
  ) {
    throw new Error("Local R2 secret is not a generated local credential.")
  }
  if (
    state.buckets?.staging !== `djs-staging-${worktreeId}` ||
    state.buckets?.sealed !== `djs-sealed-${worktreeId}` ||
    state.buckets.staging === state.buckets.sealed
  ) {
    throw new Error("Local R2 buckets are not the dedicated worktree bucket pair.")
  }
  if (
    !Number.isInteger(state.port) ||
    state.port < LOCAL_R2_PORT_RANGE.start ||
    state.port > LOCAL_R2_PORT_RANGE.end
  ) {
    throw new Error("Local R2 state has an invalid service port.")
  }
  validateLocalS3Endpoint(localR2Endpoint(state.port))
  return state
}

export function loadOrCreateLocalR2State({ localDir, worktreeId }) {
  assertWorktreeId(worktreeId)
  const directory = localR2Directory(localDir, worktreeId)
  privateDirectory(directory)
  const statePath = path.join(directory, "credentials.json")
  if (existsSync(statePath)) {
    privateFile(statePath)
    let state
    try {
      state = JSON.parse(readFileSync(statePath, "utf8"))
    } catch {
      throw new Error("Local R2 credentials file is not valid JSON.")
    }
    return validateLocalR2State(state, worktreeId)
  }

  const state = {
    version: 1,
    worktreeId,
    accountId: `djs-local-${worktreeId}`,
    accessKeyId: `djslocal-${worktreeId}-${randomBytes(16).toString("hex")}`,
    secretAccessKey: randomBytes(32).toString("hex"),
    buckets: {
      staging: `djs-staging-${worktreeId}`,
      sealed: `djs-sealed-${worktreeId}`,
    },
    port: preferredLocalR2Port(worktreeId),
  }
  validateLocalR2State(state, worktreeId)
  writePrivateFile(statePath, `${JSON.stringify(state, null, 2)}\n`)
  privateFile(statePath)
  return state
}

export function writeLocalR2WranglerConfig({ localDir, worktreeId, state, port }) {
  const directory = localR2Directory(localDir, worktreeId)
  privateDirectory(directory)
  const config = validateLocalR2State({ ...state, port }, worktreeId)
  const statePath = path.join(directory, "credentials.json")
  privateFile(statePath)
  writePrivateFile(statePath, `${JSON.stringify(config, null, 2)}\n`)

  const entryDirectory = path.join(directory, "src")
  privateDirectory(entryDirectory)
  const entry = path.join(entryDirectory, "index.ts")
  writePrivateFile(
    entry,
    'export default { fetch() { return new Response("dev-agent local R2 is running") } }\n'
  )
  const configPath = path.join(directory, "wrangler.json")
  const wranglerConfig = {
    name: `deessejs-local-r2-${worktreeId}`,
    main: "src/index.ts",
    compatibility_date: "2026-11-26",
    r2_buckets: [
      {
        binding: "MANAGED_RELEASES_STAGING",
        bucket_name: config.buckets.staging,
        local_dev: {
          experimental_s3_credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        },
      },
      {
        binding: "MANAGED_RELEASES_SEALED",
        bucket_name: config.buckets.sealed,
        local_dev: {
          experimental_s3_credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        },
      },
    ],
  }
  writePrivateFile(configPath, `${JSON.stringify(wranglerConfig, null, 2)}\n`)
  const persistencePath = path.join(directory, "state")
  privateDirectory(persistencePath)
  return {
    state: config,
    configPath,
    persistencePath,
    endpoint: localR2Endpoint(config.port),
  }
}

export function localR2RuntimeEnvironment(
  environment,
  state,
  worktreeId,
  localDir
) {
  validateLocalR2State(state, worktreeId)
  const expectedLocalDir = path.join(environment.DEV_AGENT_WORKTREE_ROOT ?? "", ".local")
  if (path.resolve(localDir) !== path.resolve(expectedLocalDir)) {
    throw new Error("Local R2 state must live under this worktree's private .local directory.")
  }
  privateDirectory(localDir)
  const statePath = path.join(localR2Directory(localDir, worktreeId), "credentials.json")
  privateFile(statePath)
  let persistedState
  try {
    persistedState = JSON.parse(readFileSync(statePath, "utf8"))
  } catch {
    throw new Error("Local R2 credentials file is not valid JSON.")
  }
  if (JSON.stringify(persistedState) !== JSON.stringify(state)) {
    throw new Error("Local R2 runtime credentials must match the private worktree state file.")
  }
  const invalidEnvironment = [
    environment.NODE_ENV !== "development",
    environment.DEV_AGENT_LOCAL_RUNTIME !== "true",
    environment.DEV_AGENT_WORKTREE_ID !== worktreeId,
    environment.DEV_AGENT_DB_NAME !== `deesse_dev_${worktreeId}`,
    environment.DEV_AGENT_DB_ROLE !== `deesse_${worktreeId}`,
    environment.DEV_AGENT_WORKTREE_ROOT == null,
  ].some(Boolean)
  if (invalidEnvironment) {
    throw new Error("Local R2 can only be enabled for this dev-agent worktree runtime.")
  }
  let databaseUrl
  try {
    databaseUrl = new URL(environment.DATABASE_URL)
  } catch {
    throw new Error("Local R2 requires this worktree's isolated development database.")
  }
  const databaseHost = databaseUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  if (
    !["localhost", "127.0.0.1", "::1"].includes(databaseHost) ||
    databaseUrl.pathname !== `/deesse_dev_${worktreeId}` ||
    decodeURIComponent(databaseUrl.username) !== `deesse_${worktreeId}`
  ) {
    throw new Error("Local R2 requires this worktree's isolated loopback database.")
  }
  for (const key of R2_ENV_KEYS) {
    if (environment[key] !== "") {
      throw new Error("Local R2 refuses a runtime that already contains R2 configuration.")
    }
  }
  return {
    ...environment,
    DEV_AGENT_LOCAL_R2: "true",
    R2_ACCOUNT_ID: state.accountId,
    R2_ACCESS_KEY_ID: state.accessKeyId,
    R2_SECRET_ACCESS_KEY: state.secretAccessKey,
    R2_AVATARS_BUCKET: "",
    R2_TEMPLATE_RELEASES_BUCKET: state.buckets.sealed,
    R2_TEMPLATE_RELEASES_STAGING_BUCKET: state.buckets.staging,
    R2_ENDPOINT: localR2Endpoint(state.port),
    R2_REGION: "auto",
  }
}
