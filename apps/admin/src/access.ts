export type AdminAccess = "allowed" | "unauthenticated" | "forbidden"

export function resolveAdminAccess(
  user: { role?: unknown } | null
): AdminAccess {
  if (!user) return "unauthenticated"
  // Better Auth persists roles as an exact comma-separated string. Keep the
  // same parsing semantics as its admin plugin: whitespace is part of a role
  // token, so malformed values such as " user, admin " must not grant access.
  const roles = typeof user.role === "string" ? user.role.split(",") : []
  return roles.includes("admin") ? "allowed" : "forbidden"
}
