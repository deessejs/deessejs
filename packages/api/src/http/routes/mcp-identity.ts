/** Called only with claims returned by Better Auth's verified-token callback. */
export function mapVerifiedMcpClaimsToIdentity(claims: {
  sub?: unknown
  scope?: unknown
}): { userId: string | null; scopes: string[] } {
  return {
    userId:
      typeof claims.sub === "string" && claims.sub.length > 0
        ? claims.sub
        : null,
    scopes:
      typeof claims.scope === "string"
        ? claims.scope.split(/\s+/).filter(Boolean)
        : [],
  }
}
