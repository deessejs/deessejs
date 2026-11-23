import assert from "node:assert/strict"
import test from "node:test"
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
