/** The initials to display for a name, with an optional fallback value. */
export function getInitials(name: string, fallback = ""): string {
  const source = name.trim() || fallback.trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const first = parts.at(0)
  if (!first) return "?"
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const last = parts.at(-1) ?? first
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}
