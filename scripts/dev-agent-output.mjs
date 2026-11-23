export function formatFixtureCredentials(values, identity) {
  const port = Number(values.DEV_AGENT_PORT)
  const localOrigin = `http://localhost:${port}`
  let databaseUrl
  try {
    databaseUrl = new URL(values.DATABASE_URL)
  } catch {
    throw new Error(
      "Fixture credentials require this worktree's local development configuration."
    )
  }

  const databaseHost = databaseUrl.hostname.replace(/^\[|\]$/g, "")
  const expectedEmails = {
    DEV_AGENT_USER_EMAIL: `agent-${identity.worktreeId}@example.test`,
    DEV_AGENT_ADMIN_EMAIL: `admin-${identity.worktreeId}@example.test`,
    DEV_AGENT_MEMBER_EMAIL: `member-${identity.worktreeId}@example.test`,
  }
  const fixturePasswords = [
    values.DEV_AGENT_USER_PASSWORD,
    values.DEV_AGENT_ADMIN_PASSWORD,
    values.DEV_AGENT_MEMBER_PASSWORD,
  ]
  const localUrlKeys = [
    "APP_URL",
    "BETTER_AUTH_URL",
    "API_BASE_URL",
    "WEB_URL",
    "DOCS_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_WEB_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_API_BASE_URL",
    "ALLOWED_ORIGINS",
  ]
  const validIdentity = [
    values.NODE_ENV === "development",
    values.DEV_AGENT_WORKTREE_ID === identity.worktreeId,
    values.DEV_AGENT_WORKTREE_ROOT === identity.root,
    values.DEV_AGENT_DB_NAME === identity.databaseName,
    values.DEV_AGENT_DB_ROLE === identity.databaseRole,
  ].every(Boolean)
  const validPort = Number.isSafeInteger(port) && port >= 41000 && port <= 50999
  const validDatabase = [
    ["localhost", "127.0.0.1", "::1"].includes(databaseHost),
    ["postgres:", "postgresql:"].includes(databaseUrl.protocol),
    decodeURIComponent(databaseUrl.username) === identity.databaseRole,
    databaseUrl.pathname === `/${identity.databaseName}`,
  ].every(Boolean)
  const validApplicationConfiguration =
    values.MAIL_TRANSPORT === "console" &&
    localUrlKeys.every((key) => values[key] === localOrigin)
  const validFixtures =
    Object.entries(expectedEmails).every(
      ([key, email]) => values[key] === email
    ) &&
    fixturePasswords.every((password) =>
      /^[A-Za-z0-9_-]{32,64}$/.test(password)
    )
  if (
    ![
      validIdentity,
      validPort,
      validDatabase,
      validApplicationConfiguration,
      validFixtures,
    ].every(Boolean)
  ) {
    throw new Error(
      "Fixture credentials require this worktree's local development configuration."
    )
  }

  return (
    [
      `Normal user: ${values.DEV_AGENT_USER_EMAIL}`,
      `Password: ${values.DEV_AGENT_USER_PASSWORD}`,
      `Global admin: ${values.DEV_AGENT_ADMIN_EMAIL}`,
      `Password: ${values.DEV_AGENT_ADMIN_PASSWORD}`,
      `Organization member: ${values.DEV_AGENT_MEMBER_EMAIL}`,
      `Password: ${values.DEV_AGENT_MEMBER_PASSWORD}`,
      `Organization: agent-org-${identity.worktreeId}`,
    ].join("\n") + "\n"
  )
}

export function redactTestOutput(output, secretValues = []) {
  let redacted = output
  for (const secret of secretValues) {
    if (typeof secret === "string" && secret.length > 0) {
      redacted = redacted.replaceAll(secret, "[redacted]")
    }
  }

  const sensitiveFields = [
    "user_code",
    "device_code",
    "access_token",
    "refresh_token",
    "session_token",
    "token",
    "password",
  ]
  for (const field of sensitiveFields) {
    redacted = redacted.replace(
      new RegExp(`("${field}"\\s*:\\s*")[^"]+`, "gi"),
      `$1[redacted]`
    )
  }

  for (const field of ["user_code", "device_code", "code", "token"]) {
    redacted = redacted.replace(
      new RegExp(`([?&]${field}=)[^&\\s"']+`, "gi"),
      "$1[redacted]"
    )
  }

  return redacted
    .replace(/((?:User|Device) code:\s*)\S+/gi, "$1[redacted]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
}
