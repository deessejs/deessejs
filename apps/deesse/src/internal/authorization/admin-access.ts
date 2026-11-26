export type AdminAccess = "allowed" | "unauthenticated" | "forbidden"

/** Resolves the exact Better Auth administrator role policy used by admin surfaces. */
export function resolveAdminAccess(user: { role?: unknown } | null): AdminAccess {
  if (!user) return "unauthenticated"
  // Match Better Auth's exact comma-separated role parsing. Whitespace is part
  // of a token, so malformed values such as "user, admin" never grant access.
  const roles = typeof user.role === "string" ? user.role.split(",") : []
  return roles.includes("admin") ? "allowed" : "forbidden"
}
