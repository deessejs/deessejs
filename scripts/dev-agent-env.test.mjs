import assert from "node:assert/strict"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import {
  DISABLED_REMOTE_SCHEMA_KEYS,
  appUrlEnvironment,
  localRuntimeEnvironment,
  replaceEnvironmentLines,
  testDatabaseIdentity,
  validateTestDatabaseUrl,
  validateWorktreeDatabaseUrl,
} from "./dev-agent/environment.mjs"
import { createPostgresManager } from "./dev-agent/postgres.mjs"
import {
  ensureNodeRuntime,
  parseNodeEngine,
  readNodeEngine,
  resolveNodeRuntimeArtifact,
} from "./dev-agent/processes.mjs"

test("Node runtime resolution follows package.json engines.node without a patch map", async () => {
  const calls = []
  const checksum = "a".repeat(64)
  const fetchImpl = async (url) => {
    calls.push(url)
    if (url === "https://nodejs.org/dist/index.json") {
      return {
        ok: true,
        json: async () => [
          { version: "v26.0.0", files: ["linux-x64"] },
          { version: "v26.2.0-rc.1", files: ["linux-x64"] },
          { version: "v26.1.0", files: ["linux-x64"] },
          { version: "v25.9.0", files: ["linux-x64"] },
        ],
      }
    }
    return {
      ok: true,
      text: async () =>
        `${checksum}  node-v26.1.0-linux-x64.tar.xz\n${"b".repeat(64)}  node-v26.0.0-linux-x64.tar.xz\n`,
    }
  }

  const runtime = await resolveNodeRuntimeArtifact(
    "26.x",
    "linux",
    "x64",
    fetchImpl
  )

  assert.deepEqual(runtime, {
    version: "26.1.0",
    sha256: checksum,
    archiveName: "node-v26.1.0-linux-x64.tar.xz",
  })
  assert.deepEqual(calls, [
    "https://nodejs.org/dist/index.json",
    "https://nodejs.org/dist/v26.1.0/SHASUMS256.txt",
  ])
})

test("missing or unsupported Node engine pins fail before local runtime setup", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "dev-agent-node-pin-"))
  const localDir = path.join(root, ".local")
  let fetchCount = 0
  try {
    writeFileSync(path.join(root, "package.json"), JSON.stringify({}))
    assert.throws(() => readNodeEngine(root), /must declare engines.node/)
    await assert.rejects(
      ensureNodeRuntime({
        root,
        localDir,
        argv: [],
        environment: {},
        currentVersion: "20.0.0",
        fetchImpl: async () => {
          fetchCount += 1
          throw new Error("unexpected network access")
        },
      }),
      /must declare engines.node/
    )
    assert.equal(fetchCount, 0)
    assert.equal(existsSync(localDir), false)

    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ engines: { node: ">=26" } })
    )
    assert.throws(() => parseNodeEngine(">=26"), /Unsupported.*engines.node/)
    await assert.rejects(
      ensureNodeRuntime({
        root,
        localDir,
        argv: [],
        environment: {},
        currentVersion: "20.0.0",
        fetchImpl: async () => {
          fetchCount += 1
          throw new Error("unexpected network access")
        },
      }),
      /Unsupported.*engines.node/
    )
    assert.equal(fetchCount, 0)
    assert.equal(existsSync(localDir), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
import {
  formatFixtureCredentials,
  redactTestOutput,
} from "./dev-agent/output.mjs"

test("port selection replaces stale worktree URLs and adds missing URL values", () => {
  const lines = [
    "NODE_ENV=development",
    "DEV_AGENT_PORT=48883",
    "APP_URL=http://localhost:48883",
    "API_BASE_URL=http://localhost:48883",
    "BETTER_AUTH_URL=http://localhost:48883",
    "WEB_URL=http://localhost:48883",
    "DOCS_URL=http://localhost:48883",
    "NEXT_PUBLIC_APP_URL=http://localhost:48883",
    "NEXT_PUBLIC_API_BASE_URL=http://localhost:48883",
    "PRIVATE_FIXTURE_VALUE=keep-without-reading",
  ]
  const updates = {
    DEV_AGENT_PORT: "48884",
    ...appUrlEnvironment("48884"),
  }

  const result = replaceEnvironmentLines(lines, updates)

  for (const [key, value] of Object.entries(updates)) {
    assert.ok(
      result.includes(`${key}=${value}`),
      `${key} follows selected port`
    )
  }
  assert.ok(result.includes("PRIVATE_FIXTURE_VALUE=keep-without-reading"))
})

test("test database URLs require the exact worktree-run identity and loopback host", () => {
  const identity = testDatabaseIdentity("0123456789ab", "abcdef012345")
  const parsed = validateTestDatabaseUrl(
    `postgresql://${identity.role}:private@127.0.0.1:5432/${identity.database}`,
    identity
  )

  assert.equal(parsed.hostname, "127.0.0.1")
  assert.equal(
    validateTestDatabaseUrl(
      `postgresql://${identity.role}:private@[::1]:5432/${identity.database}`,
      identity
    ).hostname,
    "[::1]"
  )
  assert.throws(
    () =>
      validateTestDatabaseUrl(
        "postgresql://shared:private@remote/db",
        identity
      ),
    /isolated identity/
  )
  assert.throws(
    () =>
      validateTestDatabaseUrl(
        `postgresql://${identity.role}:private@127.0.0.1:5433/${identity.database}`,
        identity,
        `postgresql://${identity.role}:private@127.0.0.1:5432/${identity.database}`
      ),
    /same loopback endpoint/
  )
  assert.throws(
    () =>
      validateTestDatabaseUrl(
        `postgresql://${identity.role}:private@127.0.0.1:5432/deesse_dev_0123456789ab`,
        identity
      ),
    /isolated identity/
  )
  assert.throws(
    () => testDatabaseIdentity("../../../../", "abcdef012345"),
    /Invalid disposable test database identity/
  )
})

test("development database URL must match this worktree's loopback identity", () => {
  const identity = {
    databaseName: "deesse_dev_0123456789ab",
    databaseRole: "deesse_0123456789ab",
  }
  const databaseUrl = `postgresql://${identity.databaseRole}:private@127.0.0.1:5433/${identity.databaseName}`
  const adminUrl = "postgresql://postgres:private@127.0.0.1:5433/postgres"

  assert.equal(
    validateWorktreeDatabaseUrl(databaseUrl, identity, adminUrl).port,
    "5433"
  )
  assert.throws(
    () =>
      validateWorktreeDatabaseUrl(
        `postgresql://${identity.databaseRole}:private@db.example.com:5433/${identity.databaseName}`,
        identity,
        adminUrl
      ),
    /loopback database and role/
  )
  assert.throws(
    () =>
      validateWorktreeDatabaseUrl(
        `postgresql://shared:private@127.0.0.1:5433/${identity.databaseName}`,
        identity,
        adminUrl
      ),
    /loopback database and role/
  )
  assert.throws(
    () =>
      validateWorktreeDatabaseUrl(
        `postgresql://${identity.databaseRole}:private@127.0.0.1:5433/shared_db`,
        identity,
        adminUrl
      ),
    /loopback database and role/
  )
  assert.throws(
    () =>
      validateWorktreeDatabaseUrl(
        databaseUrl,
        identity,
        "postgresql://postgres:private@127.0.0.1:5434/postgres"
      ),
    /same loopback host and port/
  )
  assert.throws(
    () =>
      validateWorktreeDatabaseUrl(
        databaseUrl,
        identity,
        "postgresql://postgres:private@localhost:5433/postgres"
      ),
    /same loopback host and port/
  )
  assert.throws(
    () => validateWorktreeDatabaseUrl(databaseUrl, identity),
    /non-default local PostgreSQL port/
  )
})

test("invalid database targets fail before any administrator command is spawned", () => {
  const identity = {
    databaseName: "deesse_dev_0123456789ab",
    databaseRole: "deesse_0123456789ab",
  }
  const validUrl = `postgresql://${identity.databaseRole}:private@127.0.0.1:5432/${identity.databaseName}`
  const invalidTargets = [
    "postgresql://shared:private@db.example.com:5432/shared",
    `postgresql://shared:private@127.0.0.1:5432/${identity.databaseName}`,
    `postgresql://${identity.databaseRole}:private@127.0.0.1:5432/shared`,
  ]

  for (const databaseUrl of invalidTargets) {
    let spawnCount = 0
    assert.throws(() =>
      createPostgresManager({
        ...identity,
        databaseUrl,
        environment: {},
        spawnSyncImpl: () => {
          spawnCount += 1
        },
      })
    )
    assert.equal(spawnCount, 0)
  }

  let spawnCount = 0
  assert.throws(
    () =>
      createPostgresManager({
        ...identity,
        databaseUrl: validUrl,
        adminUrl: "postgresql://postgres:private@127.0.0.1:5433/postgres",
        environment: {},
        spawnSyncImpl: () => {
          spawnCount += 1
        },
      }),
    /same loopback host and port/
  )
  assert.equal(spawnCount, 0)
})

test("local app children cannot load host or dotenv remote credentials", () => {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "dev-agent-env-"))
  const root = path.join(temporaryRoot, "repo")
  const appDir = path.join(root, "apps/app")
  const localDir = path.join(root, ".local")
  mkdirSync(appDir, { recursive: true })
  writeFileSync(
    path.join(root, ".env"),
    "R2_SECRET_ACCESS_KEY=root-r2-marker\nFUTURE_REMOTE_API_TOKEN=root-future-marker\nDEV_AGENT_PG_ADMIN_URL=dotenv-admin-marker\n"
  )
  writeFileSync(
    path.join(appDir, ".env.development.local"),
    "GITHUB_TOKEN=app-github-marker\nNEXT_PUBLIC_FUTURE_API_KEY=app-public-marker\n"
  )

  try {
    const environment = localRuntimeEnvironment(
      {
        PATH: "/bin",
        R2_SECRET_ACCESS_KEY: "host-r2-secret-marker",
        STRIPE_SECRET_KEY: "host-stripe-secret-marker",
        GITHUB_TOKEN: "host-github-token-marker",
        DEV_AGENT_PG_ADMIN_URL: "host-postgres-admin-marker",
        AWS_ACCESS_KEY_ID: "host-aws-key-marker",
        UPSTASH_REDIS_REST_TOKEN: "host-redis-token-marker",
      },
      {
        NODE_ENV: "production",
        MAIL_TRANSPORT: "resend",
        R2_SECRET_ACCESS_KEY: "dotenv-r2-secret-marker",
        CRON_SECRET: "dotenv-cron-secret-marker",
        RESEND_API_KEY: "dotenv-resend-key-marker",
        DATABASE_URL: "postgresql://worktree@127.0.0.1/worktree_db",
      },
      { root, appDir, localDir }
    )

    assert.equal(environment.PATH, "/bin")
    assert.equal(environment.NODE_ENV, "development")
    assert.equal(environment.MAIL_TRANSPORT, "console")
    assert.equal(
      environment.DATABASE_URL,
      "postgresql://worktree@127.0.0.1/worktree_db"
    )
    for (const key of [
      "R2_SECRET_ACCESS_KEY",
      "STRIPE_SECRET_KEY",
      "GITHUB_TOKEN",
      "CRON_SECRET",
      "RESEND_API_KEY",
      "FUTURE_REMOTE_API_TOKEN",
      "NEXT_PUBLIC_FUTURE_API_KEY",
    ]) {
      assert.equal(environment[key], "", `${key} is masked for child processes`)
    }
    const hostOnlyEnvironment = localRuntimeEnvironment(
      { DEV_AGENT_PG_ADMIN_URL: "host-postgres-admin-marker" },
      {},
      {
        root: temporaryRoot,
        appDir: path.join(temporaryRoot, "no-app"),
        localDir,
      }
    )
    assert.equal(
      Object.hasOwn(hostOnlyEnvironment, "DEV_AGENT_PG_ADMIN_URL"),
      false,
      "a host-only administrator URL is omitted"
    )
    assert.equal(Object.hasOwn(environment, "AWS_ACCESS_KEY_ID"), false)
    assert.equal(Object.hasOwn(environment, "UPSTASH_REDIS_REST_TOKEN"), false)
    assert.equal(
      environment.DEV_AGENT_PG_ADMIN_URL,
      "",
      "a dotenv administrator URL is masked before Next loads dotenv"
    )
    assert.equal(environment.AWS_EC2_METADATA_DISABLED, "true")
    assert.equal(
      environment.AWS_SHARED_CREDENTIALS_FILE,
      path.join(localDir, "runtime-home/.aws/credentials-disabled")
    )
    assert.equal(
      environment.AWS_CONFIG_FILE,
      path.join(localDir, "runtime-home/.aws/config-disabled")
    )

    const schema = readFileSync(
      new URL("../packages/env/src/schema.ts", import.meta.url),
      "utf8"
    )
    const schemaRemoteKeys = [...schema.matchAll(/^\s{2}([A-Z][A-Z0-9_]+):/gm)]
      .map((match) => match[1])
      .filter((key) => /^(R2_|RESEND_|STRIPE_|GITHUB_)|^CRON_SECRET$/.test(key))
      .sort()
    assert.deepEqual([...DISABLED_REMOTE_SCHEMA_KEYS].sort(), schemaRemoteKeys)
    for (const key of schemaRemoteKeys) {
      assert.equal(
        environment[key],
        "",
        `${key} from app env schema is disabled`
      )
    }

    // Next gives existing process.env entries precedence over dotenv files.
    // The launcher passes these empty strings in the child environment, so
    // values parsed from either temporary dotenv file cannot replace them.
    const dotenvNames = [
      "R2_SECRET_ACCESS_KEY",
      "GITHUB_TOKEN",
      "FUTURE_REMOTE_API_TOKEN",
      "NEXT_PUBLIC_FUTURE_API_KEY",
      "DEV_AGENT_PG_ADMIN_URL",
    ]
    for (const key of dotenvNames) {
      assert.equal(environment[key], "", `${key} is pre-masked for Next`)
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
})

test("fixture credential command output is restricted to local worktree fixtures", () => {
  const identity = {
    worktreeId: "0123456789ab",
    root: "/tmp/deesse-worktree",
    databaseName: "deesse_dev_0123456789ab",
    databaseRole: "deesse_0123456789ab",
  }
  const values = {
    NODE_ENV: "development",
    DEV_AGENT_WORKTREE_ID: identity.worktreeId,
    DEV_AGENT_WORKTREE_ROOT: identity.root,
    DEV_AGENT_DB_NAME: identity.databaseName,
    DEV_AGENT_DB_ROLE: identity.databaseRole,
    DEV_AGENT_PORT: "48888",
    DATABASE_URL: `postgresql://${identity.databaseRole}:db-secret@127.0.0.1:5432/${identity.databaseName}`,
    BETTER_AUTH_URL: "http://localhost:48888",
    APP_URL: "http://localhost:48888",
    API_BASE_URL: "http://localhost:48888",
    WEB_URL: "http://localhost:48888",
    DOCS_URL: "http://localhost:48888",
    NEXT_PUBLIC_APP_URL: "http://localhost:48888",
    NEXT_PUBLIC_WEB_URL: "http://localhost:48888",
    NEXT_PUBLIC_DOCS_URL: "http://localhost:48888",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:48888",
    ALLOWED_ORIGINS: "http://localhost:48888",
    MAIL_TRANSPORT: "console",
    DEV_AGENT_USER_EMAIL: `agent-${identity.worktreeId}@example.test`,
    DEV_AGENT_USER_PASSWORD: "owner-fixture-pass-marker-123456",
    DEV_AGENT_ADMIN_EMAIL: `admin-${identity.worktreeId}@example.test`,
    DEV_AGENT_ADMIN_PASSWORD: "admin-fixture-pass-marker-123456",
    DEV_AGENT_MEMBER_EMAIL: `member-${identity.worktreeId}@example.test`,
    DEV_AGENT_MEMBER_PASSWORD: "member-fixture-pass-marker-12345",
    DEV_AGENT_DEVICE_CODE: "device-code-marker",
    PRODUCTION_API_KEY: "never-print-this",
  }

  const output = formatFixtureCredentials(values, identity)

  for (const key of [
    "DEV_AGENT_USER_EMAIL",
    "DEV_AGENT_USER_PASSWORD",
    "DEV_AGENT_ADMIN_EMAIL",
    "DEV_AGENT_ADMIN_PASSWORD",
    "DEV_AGENT_MEMBER_EMAIL",
    "DEV_AGENT_MEMBER_PASSWORD",
  ]) {
    assert.ok(output.includes(values[key]))
  }
  for (const secret of [
    "db-secret",
    values.DEV_AGENT_DEVICE_CODE,
    values.PRODUCTION_API_KEY,
  ]) {
    assert.equal(output.includes(secret), false)
  }

  for (const [key, invalidValue] of [
    ["NODE_ENV", "production"],
    ["DATABASE_URL", "postgresql://shared:password@db.example.com/shared"],
    ["MAIL_TRANSPORT", "resend"],
    ["DEV_AGENT_DB_NAME", "shared_database"],
    ["DEV_AGENT_WORKTREE_ROOT", "/another/worktree"],
    ["APP_URL", "https://app.example.com"],
  ]) {
    assert.throws(
      () =>
        formatFixtureCredentials({ ...values, [key]: invalidValue }, identity),
      /local development configuration/
    )
  }
})

test("test log redaction removes fixture passwords and device authorization values", () => {
  const markerPassword = "fixture-password-marker"
  const markerDeviceCode = "QWER-TYUI"
  const markerAccessToken = "fixture-access-token-marker"
  const markerBearerToken = "fixture-bearer-token-marker"
  const output = redactTestOutput(
    `fixture=${markerPassword} User code: ${markerDeviceCode} url?user_code=${markerDeviceCode} {"user_code":"${markerDeviceCode}","access_token":"${markerAccessToken}"} Authorization: Bearer ${markerBearerToken}`,
    [markerPassword]
  )

  assert.equal(output.includes(markerPassword), false)
  assert.equal(output.includes(markerDeviceCode), false)
  assert.equal(output.includes(markerAccessToken), false)
  assert.equal(output.includes(markerBearerToken), false)
})
