export type AdminAccess = "allowed" | "unauthenticated" | "forbidden"

export function resolveAdminAccess(
  user: { role?: unknown } | null
): AdminAccess {
  if (!user) return "unauthenticated"
  const roles = Array.isArray(user.role)
    ? user.role
    : typeof user.role === "string"
      ? user.role.split(",").map((role) => role.trim())
      : []
  return roles.includes("admin") ? "allowed" : "forbidden"
}
