const APP_URL_KEYS = [
  "APP_URL",
  "API_BASE_URL",
  "BETTER_AUTH_URL",
  "WEB_URL",
  "DOCS_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_WEB_URL",
  "NEXT_PUBLIC_DOCS_URL",
  "ALLOWED_ORIGINS",
]

export function appUrlEnvironment(port) {
  const appUrl = `http://localhost:${port}`
  return Object.fromEntries(APP_URL_KEYS.map((key) => [key, appUrl]))
}

export function replaceEnvironmentLines(lines, updates) {
  const updateKeys = new Set(Object.keys(updates))
  const seenKeys = new Set()
  const replaced = lines.map((line) => {
    const delimiter = line.indexOf("=")
    if (delimiter < 1) return line
    const key = line.slice(0, delimiter)
    if (!updateKeys.has(key)) return line
    seenKeys.add(key)
    return `${key}=${updates[key]}`
  })

  for (const [key, value] of Object.entries(updates)) {
    if (!seenKeys.has(key)) replaced.push(`${key}=${value}`)
  }
  return replaced
}
