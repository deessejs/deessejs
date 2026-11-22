export function formatFixtureCredentialHandoff(values, worktreeId) {
  return [
    `Normal user: ${values.DEV_AGENT_USER_EMAIL}`,
    `Global admin: ${values.DEV_AGENT_ADMIN_EMAIL}`,
    `Organization member: ${values.DEV_AGENT_MEMBER_EMAIL}`,
    `Organization: agent-org-${worktreeId}`,
    "Passwords are stored only in the ignored .env.development.local file.",
    "For browser login, a human must enter a password from a private local editor.",
    "The T3 preview input tool records literal text and cannot accept a secret reference.",
  ].join("\n") + "\n"
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
