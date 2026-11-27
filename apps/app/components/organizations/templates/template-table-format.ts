const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

const categoryLabels: Record<string, string> = {
  saas: "SaaS",
  ai: "AI",
  landing: "Landing pages",
  desktop: "Desktop apps",
  docs: "Documentation",
  marketing: "Marketing",
  content: "Content",
  library: "Libraries",
  "ai-agent": "AI agents",
}

export function formatFetchedDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatCategory(category: string) {
  return (
    categoryLabels[category] ??
    category
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

export function formatLabel(label: string) {
  const knownLabels: Record<string, string> = {
    nextjs: "Next.js",
    "react-hook-form": "React Hook Form",
    "tanstack-table": "TanStack Table",
    shadcn: "shadcn/ui",
    ai: "AI",
    saas: "SaaS",
    api: "API",
    css: "CSS",
    html: "HTML",
    mdx: "MDX",
    mcp: "MCP",
    npm: "npm",
    orpc: "oRPC",
    sdk: "SDK",
    seo: "SEO",
    ui: "UI",
  }
  return (
    knownLabels[label.toLowerCase()] ??
    label
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  )
}
