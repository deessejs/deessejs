import * as React from "react"
import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Tech stack grid for a use-case page. Renders each entry as a cell
 * with its brand logo (when available in `public/logos/<slug>.svg`).
 * Falls back to a text-only chip when the slug is missing.
 *
 * Accepts either strings ("Next.js") or objects ({ name: "Next.js",
 * logo?: "vercel" }). Use strings when the logo-mapper below covers
 * the entry; use objects when the page wants to override or add a
 * slug the mapper doesn't know.
 *
 * Layout: 2 cols on mobile, 3 on md, 4 on lg. Each cell shares borders
 * with siblings through `divide-x divide-y divide-border` on the parent.
 */

type StackItem =
  | string
  | { name: string; logo?: string }

const FALLBACK_LOGOS: Record<string, string> = {
  "Next.js": "vercel",
  "Better Auth": "betterauth",
  Drizzle: "drizzle",
  Stripe: "stripe",
  OpenAI: "openai",
  Postgres: "postgresql",
  "AI SDK": "openai",
  pgvector: "postgresql",
  Resend: "resend",
  Astro: "astro",
  Tailwind: "tailwindcss",
  shadcn: "shadcnui",
  "shadcn blocks": "shadcnui",
  Hono: "cloudflare",
  oRPC: "cloudflare",
  "TanStack Table": "cloudflare",
  "TanStack Query": "cloudflare",
}

function resolveName(item: StackItem): string {
  return typeof item === "string" ? item : item.name
}

function resolveLogo(item: StackItem): string | undefined {
  if (typeof item !== "string" && item.logo) return item.logo
  return FALLBACK_LOGOS[resolveName(item)]
}

export function UseCaseStack({
  items,
  className,
}: {
  items: ReadonlyArray<StackItem>
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-border",
        className,
      )}
    >
      {items.map((item) => {
        const name = resolveName(item)
        const slug = resolveLogo(item)
        return (
          <Link
            key={name}
            href={`/knowledge-base?q=${encodeURIComponent(name)}`}
            className="group flex items-center gap-3 p-5 transition-colors hover:bg-accent/40"
          >
            {slug ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/logos/${slug}.svg`}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 dark:invert"
                aria-hidden
              />
            ) : (
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-[10px] font-medium text-muted-foreground"
              >
                {name.slice(0, 1)}
              </span>
            )}
            <span className="text-copy-14 font-medium text-foreground">
              {name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
