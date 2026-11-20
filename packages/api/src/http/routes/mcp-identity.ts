/** Called only with claims returned by Better Auth's verified-token callback. */
export interface VerifiedMcpClaims {
  sub?: unknown
  scope?: unknown
}

export interface McpIdentity {
  userId: string | null
  scopes: string[]
}

export function mapVerifiedMcpClaimsToIdentity(
  claims: VerifiedMcpClaims
): McpIdentity {
  const subject = claims.sub
  const scopeClaim = claims.scope
  let userId: string | null = null
  let scopes: string[] = []

  if (typeof subject === "string" && subject.length > 0) userId = subject
  if (typeof scopeClaim === "string") {
    scopes = scopeClaim.split(/\s+/).filter(Boolean)
  }

  return { userId, scopes }
}
