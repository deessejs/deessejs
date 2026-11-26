import assert from "node:assert/strict"
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import {
  loadOrCreateLocalR2State,
  localR2Endpoint,
  localR2RuntimeEnvironment,
  localR2Directory,
  validateLocalR2State,
  validateLocalS3Endpoint,
  writeLocalR2WranglerConfig,
} from "./dev-agent/local-r2.mjs"

const WORKTREE_ID = "0123456789ab"

function makeLocalRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "dev-agent-local-r2-"))
  const localDir = path.join(root, ".local")
  chmodSync(root, 0o700)
  return { root, localDir }
}

function safeRuntime(root, localDir) {
  return {
    NODE_ENV: "development",
    DEV_AGENT_LOCAL_RUNTIME: "true",
    DEV_AGENT_WORKTREE_ID: WORKTREE_ID,
    DEV_AGENT_WORKTREE_ROOT: root,
    DEV_AGENT_DB_NAME: `deesse_dev_${WORKTREE_ID}`,
    DEV_AGENT_DB_ROLE: `deesse_${WORKTREE_ID}`,
    DATABASE_URL: `postgresql://deesse_${WORKTREE_ID}:dummy@127.0.0.1:5432/deesse_dev_${WORKTREE_ID}`,
    R2_ACCOUNT_ID: "",
    R2_ACCESS_KEY_ID: "",
    R2_SECRET_ACCESS_KEY: "",
    R2_AVATARS_BUCKET: "",
    R2_TEMPLATE_RELEASES_BUCKET: "",
    R2_TEMPLATE_RELEASES_STAGING_BUCKET: "",
    R2_ENDPOINT: "",
    R2_REGION: "",
    TEST_DATABASE_URL: "",
    HOME: path.join(localDir, "runtime-home"),
  }
}

test("local S3 endpoint validation accepts only loopback Wrangler endpoints", () => {
  for (const endpoint of [
    "http://localhost:8787/cdn-cgi/local/r2/s3",
    "http://127.0.0.1:51001/cdn-cgi/local/r2/s3",
    "http://[::1]:8787/cdn-cgi/local/r2/s3",
  ]) {
    assert.equal(validateLocalS3Endpoint(endpoint).port > 0, true)
  }

  for (const endpoint of [
    "https://localhost:8787/cdn-cgi/local/r2/s3",
    "http://192.0.2.2:8787/cdn-cgi/local/r2/s3",
    "http://example.com:8787/cdn-cgi/local/r2/s3",
    "http://user:secret@localhost:8787/cdn-cgi/local/r2/s3",
    "http://localhost:8787/cdn-cgi/local/r2/s3?remote=true",
    "http://localhost:8787/other",
  ]) {
    assert.throws(() => validateLocalS3Endpoint(endpoint))
  }
  assert.throws(() => localR2Endpoint(8787), /reserved worktree range/)
})

test("credentials and Wrangler config are generated under private worktree state", () => {
  const { root, localDir } = makeLocalRoot()
  try {
    const first = loadOrCreateLocalR2State({ localDir, worktreeId: WORKTREE_ID })
    const second = loadOrCreateLocalR2State({ localDir, worktreeId: WORKTREE_ID })
    assert.deepEqual(first, second)
    assert.equal(first.accountId, `djs-local-${WORKTREE_ID}`)
    assert.equal(first.buckets.staging, `djs-staging-${WORKTREE_ID}`)
    assert.equal(first.buckets.sealed, `djs-sealed-${WORKTREE_ID}`)
    const statePath = path.join(
      localR2Directory(localDir, WORKTREE_ID),
      "credentials.json"
    )
    assert.equal(lstatSync(statePath).mode & 0o777, 0o600)
    assert.equal(lstatSync(path.dirname(statePath)).mode & 0o777, 0o700)

    const generated = writeLocalR2WranglerConfig({
      localDir,
      worktreeId: WORKTREE_ID,
      state: first,
      port: first.port,
    })
    assert.equal(lstatSync(generated.configPath).mode & 0o777, 0o600)
    const config = JSON.parse(readFileSync(generated.configPath, "utf8"))
    assert.equal(config.r2_buckets.length, 2)
    assert.ok(
      config.r2_buckets.every(
        (bucket) => bucket.local_dev.experimental_s3_credentials
      )
    )
    assert.ok(config.r2_buckets.every((bucket) => !bucket.remote))
    assert.match(generated.endpoint, /^http:\/\/127\.0\.0\.1:/)
    assert.equal(path.resolve(localDir), path.join(root, ".local"))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("local R2 runtime overlay requires persisted dummy credentials and isolated DB", () => {
  const { root, localDir } = makeLocalRoot()
  try {
    const state = loadOrCreateLocalR2State({ localDir, worktreeId: WORKTREE_ID })
    const base = safeRuntime(root, localDir)
    const overlay = localR2RuntimeEnvironment(base, state, WORKTREE_ID, localDir)
    assert.equal(overlay.R2_ACCOUNT_ID, `djs-local-${WORKTREE_ID}`)
    assert.equal(overlay.R2_TEMPLATE_RELEASES_BUCKET, state.buckets.sealed)
    assert.equal(
      overlay.R2_TEMPLATE_RELEASES_STAGING_BUCKET,
      state.buckets.staging
    )
    assert.equal(overlay.R2_AVATARS_BUCKET, "")
    assert.equal(overlay.DEV_AGENT_LOCAL_R2, "true")
    assert.equal(base.R2_ACCOUNT_ID, "")
    assert.equal(base.R2_TEMPLATE_RELEASES_BUCKET, "")

    for (const invalid of [
      { ...base, NODE_ENV: "production" },
      { ...base, DEV_AGENT_WORKTREE_ID: "aaaaaaaaaaaa" },
      { ...base, DATABASE_URL: "postgresql://real@remote.example/db" },
      { ...base, R2_SECRET_ACCESS_KEY: "remote-secret" },
    ]) {
      assert.throws(() =>
        localR2RuntimeEnvironment(invalid, state, WORKTREE_ID, localDir)
      )
    }
    assert.throws(() =>
      localR2RuntimeEnvironment(base, state, WORKTREE_ID, root)
    )
    assert.throws(() =>
      validateLocalR2State(
        { ...state, buckets: { staging: "remote", sealed: state.buckets.sealed } },
        WORKTREE_ID
      )
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
