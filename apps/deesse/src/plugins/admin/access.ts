export type AdminAccess = "allowed" | "unauthenticated" | "forbidden"

/** Resolves access to the optional Admin plugin from the Better Auth role field. */
export function resolveAdminAccess(user: { role?: unknown } | null): AdminAccess {
  if (!user) return "unauthenticated"
  // Better Auth stores multiple roles as comma-separated tokens. Match an exact
  // token so malformed values such as "user, admin" never grant access.
  const roles = typeof user.role === "string" ? user.role.split(",") : []
  return roles.includes("admin") ? "allowed" : "forbidden"
}
