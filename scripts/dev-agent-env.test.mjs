import assert from "node:assert/strict"
import test from "node:test"
import {
  appUrlEnvironment,
  replaceEnvironmentLines,
  testDatabaseIdentity,
  validateTestDatabaseUrl,
} from "./dev-agent-env.mjs"
import {
  formatFixtureCredentialHandoff,
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
    assert.ok(result.includes(`${key}=${value}`), `${key} follows selected port`)
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
    () => validateTestDatabaseUrl("postgresql://shared:private@remote/db", identity),
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

test("fixture credential output names accounts without rendering secrets", () => {
  const markerPassword = "fixture-password-marker"
  const markerDeviceCode = "fixture-code-marker"
  const output = formatFixtureCredentialHandoff(
    {
      DEV_AGENT_USER_EMAIL: "owner@example.test",
      DEV_AGENT_ADMIN_EMAIL: "admin@example.test",
      DEV_AGENT_MEMBER_EMAIL: "member@example.test",
      DEV_AGENT_USER_PASSWORD: markerPassword,
      DEV_AGENT_ADMIN_PASSWORD: markerPassword,
      DEV_AGENT_MEMBER_PASSWORD: markerPassword,
      DEV_AGENT_DEVICE_CODE: markerDeviceCode,
    },
    "0123456789ab"
  )

  assert.equal(output.includes(markerPassword), false)
  assert.equal(output.includes(markerDeviceCode), false)
  assert.match(output, /Normal user: owner@example\.test/)
  assert.match(output, /human must enter a password/)
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
