"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  ListTree,
  Radio,
  Sigma,
  type LucideIcon,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

/**
 * Tabbed view of the four ecosystem tools: Errors, FP, DRPC,
 * Collections. Mirrors `<SurfacesTabs>` but mirrored horizontally —
 * the placeholder mockup sits on the LEFT (wider column) and the four
 * product cards stack on the RIGHT.
 *
 * Layout:
 *   • On lg+, the panel is a 2-col grid with the placeholder on the
 *     left (1.32fr) and the cards on the right (0.68fr). Below lg, the
 *     panel stacks vertically: placeholder on top, cards beneath.
 *   • The placeholder is anchored to the bottom-right and translated
 *     25% right + 25% down so the visible portion sits in the
 *     bottom-right corner with margin in the upper-left — the same
 *     margin-break pattern as SurfacesTabs.
 *
 * Per-product cards on the right are tab triggers (all visible). The
 * active card picks up `bg-accent/40`.
 */

type EcosystemTab = {
  slug: string
  name: string
  description: string
  href: string
  icon: LucideIcon
}

const ECOSYSTEM_TABS: ReadonlyArray<EcosystemTab> = [
  {
    slug: "errors",
    name: "Errors",
    description:
      "Structured error tracking with full TypeScript context. Stack traces, breadcrumbs, and source maps wired into the same contracts your templates use.",
    href: "https://errors.deessejs.com",
    icon: AlertTriangle,
  },
  {
    slug: "fp",
    name: "FP",
    description:
      "Functional primitives for TypeScript. Pipes, options, results, and tasks, designed to keep the contracts readable under load.",
    href: "https://fp.deessejs.com",
    icon: Sigma,
  },
  {
    slug: "drpc",
    name: "DRPC",
    description:
      "Durable RPC for agent workflows. Long-running calls that survive restarts, with retries and replay built in.",
    href: "https://drpc.deessejs.com",
    icon: Radio,
  },
  {
    slug: "collections",
    name: "Collections",
    description:
      "Type-safe data access with end-to-end inference. The schema is the source of truth, from the database to the client component.",
    href: "https://collections.deessejs.com",
    icon: ListTree,
  },
]

export function EcosystemTabs() {
  const firstSlug = ECOSYSTEM_TABS[0]?.slug ?? "errors"

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className="flex flex-col lg:flex-row"
    >
      <TabsList
        aria-label="Ecosystem"
        className="flex flex-col divide-y divide-border border-b border-border lg:border-b-0 lg:border-r bg-transparent p-0 h-auto w-full lg:w-auto lg:min-w-[320px] lg:max-w-md"
      >
        {ECOSYSTEM_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.slug}
              value={tab.slug}
              className="group flex flex-col items-start gap-2 rounded-none bg-transparent p-6 text-left h-auto w-full shadow-none border-0
                text-foreground/60 hover:text-foreground hover:bg-accent/40
                data-[state=active]:bg-accent/40 data-[state=active]:text-foreground
                [&:after]:hidden"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="text-foreground size-4 shrink-0"
                  aria-hidden
                />
                <h3 className="text-heading-20 tracking-tight !m-0">{tab.name}</h3>
              </div>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {tab.description}
              </p>
              <Link
                href={tab.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 pt-1"
                onClick={(event) => event.stopPropagation()}
              >
                Learn more
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {ECOSYSTEM_TABS.map((tab) => (
        <TabsContent
          key={tab.slug}
          value={tab.slug}
          className="relative flex-1 outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
        >
          {/* Right column: placeholder mockup, anchored to the
              bottom-right and translated 25% right + 25% down so the
              visible portion sits in the bottom-right corner with
              margin in the upper-left. Mirrors the SurfacesTabs
              pattern. */}
          <div
            aria-hidden
            className="absolute right-0 bottom-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%] bg-muted/40 border border-border overflow-hidden"
          >
            {/* Fake macOS-style window header — three colored dots
                (red / yellow / green) at the left of the title bar. */}
            <div className="flex items-center justify-start gap-2 px-4 py-3 border-b border-border bg-background/40">
              <span
                aria-hidden
                className="block size-3 rounded-full bg-[#ff5f57]"
              />
              <span
                aria-hidden
                className="block size-3 rounded-full bg-[#febc2e]"
              />
              <span
                aria-hidden
                className="block size-3 rounded-full bg-[#28c840]"
              />
            </div>
            {/* Fake editor tab strip — TS files mirroring the four
                ecosystem tools. Decorative only: the close button is
                visual but not interactive. */}
            <div className="flex items-stretch gap-px bg-border border-b border-border">
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-background min-w-0 w-32 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* TypeScript file icon (official TS logo) */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 512 512"
                    fill="none"
                    aria-hidden
                    className="shrink-0"
                  >
                    <rect width="512" height="512" rx="50" fill="#3178c6" />
                    <path
                      clipRule="evenodd"
                      d="m316.939 407.424v50.061c8.138 4.172 17.763 7.3 28.875 9.386s22.823 3.129 35.135 3.129c11.999 0 23.397-1.147 34.196-3.442 10.799-2.294 20.268-6.075 28.406-11.342 8.138-5.266 14.581-12.15 19.328-20.65s7.121-19.007 7.121-31.522c0-9.074-1.356-17.026-4.069-23.857s-6.625-12.906-11.738-18.225c-5.112-5.319-11.242-10.091-18.389-14.315s-15.207-8.213-24.18-11.967c-6.573-2.712-12.468-5.345-17.685-7.9-5.217-2.556-9.651-5.163-13.303-7.822-3.652-2.66-6.469-5.476-8.451-8.448-1.982-2.973-2.974-6.336-2.974-10.091 0-3.441.887-6.544 2.661-9.308s4.278-5.136 7.512-7.118c3.235-1.981 7.199-3.52 11.894-4.615 4.696-1.095 9.912-1.642 15.651-1.642 4.173 0 8.581.313 13.224.938 4.643.626 9.312 1.591 14.008 2.894 4.695 1.304 9.259 2.947 13.694 4.928 4.434 1.982 8.529 4.276 12.285 6.884v-46.776c-7.616-2.92-15.937-5.084-24.962-6.492s-19.381-2.112-31.066-2.112c-11.895 0-23.163 1.278-33.805 3.833s-20.006 6.544-28.093 11.967c-8.086 5.424-14.476 12.333-19.171 20.729-4.695 8.395-7.043 18.433-7.043 30.114 0 14.914 4.304 27.638 12.912 38.172 8.607 10.533 21.675 19.45 39.204 26.751 6.886 2.816 13.303 5.579 19.25 8.291s11.086 5.528 15.415 8.448c4.33 2.92 7.747 6.101 10.252 9.543 2.504 3.441 3.756 7.352 3.756 11.733 0 3.233-.783 6.231-2.348 8.995s-3.939 5.162-7.121 7.196-7.147 3.624-11.894 4.771c-4.748 1.148-10.303 1.721-16.668 1.721-10.851 0-21.597-1.903-32.24-5.71-10.642-3.806-20.502-9.516-29.579-17.13zm-84.159-123.342h64.22v-41.082h-179v41.082h63.906v182.918h50.874z"
                      fill="#fff"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span className="truncate text-[11px] font-mono text-foreground">
                    errors.ts
                  </span>
                </div>
                <span
                  aria-hidden
                  className="text-foreground/60 text-[10px] leading-none shrink-0"
                >
                  ×
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-muted/40 min-w-0 w-32 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 512 512"
                    fill="none"
                    aria-hidden
                    className="shrink-0"
                  >
                    <rect width="512" height="512" rx="50" fill="#3178c6" />
                    <path
                      clipRule="evenodd"
                      d="m316.939 407.424v50.061c8.138 4.172 17.763 7.3 28.875 9.386s22.823 3.129 35.135 3.129c11.999 0 23.397-1.147 34.196-3.442 10.799-2.294 20.268-6.075 28.406-11.342 8.138-5.266 14.581-12.15 19.328-20.65s7.121-19.007 7.121-31.522c0-9.074-1.356-17.026-4.069-23.857s-6.625-12.906-11.738-18.225c-5.112-5.319-11.242-10.091-18.389-14.315s-15.207-8.213-24.18-11.967c-6.573-2.712-12.468-5.345-17.685-7.9-5.217-2.556-9.651-5.163-13.303-7.822-3.652-2.66-6.469-5.476-8.451-8.448-1.982-2.973-2.974-6.336-2.974-10.091 0-3.441.887-6.544 2.661-9.308s4.278-5.136 7.512-7.118c3.235-1.981 7.199-3.52 11.894-4.615 4.696-1.095 9.912-1.642 15.651-1.642 4.173 0 8.581.313 13.224.938 4.643.626 9.312 1.591 14.008 2.894 4.695 1.304 9.259 2.947 13.694 4.928 4.434 1.982 8.529 4.276 12.285 6.884v-46.776c-7.616-2.92-15.937-5.084-24.962-6.492s-19.381-2.112-31.066-2.112c-11.895 0-23.163 1.278-33.805 3.833s-20.006 6.544-28.093 11.967c-8.086 5.424-14.476 12.333-19.171 20.729-4.695 8.395-7.043 18.433-7.043 30.114 0 14.914 4.304 27.638 12.912 38.172 8.607 10.533 21.675 19.45 39.204 26.751 6.886 2.816 13.303 5.579 19.25 8.291s11.086 5.528 15.415 8.448c4.33 2.92 7.747 6.101 10.252 9.543 2.504 3.441 3.756 7.352 3.756 11.733 0 3.233-.783 6.231-2.348 8.995s-3.939 5.162-7.121 7.196-7.147 3.624-11.894 4.771c-4.748 1.148-10.303 1.721-16.668 1.721-10.851 0-21.597-1.903-32.24-5.71-10.642-3.806-20.502-9.516-29.579-17.13zm-84.159-123.342h64.22v-41.082h-179v41.082h63.906v182.918h50.874z"
                      fill="#fff"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span className="truncate text-[11px] font-mono text-muted-foreground">
                    fp.ts
                  </span>
                </div>
                <span
                  aria-hidden
                  className="text-muted-foreground/60 text-[10px] leading-none shrink-0"
                >
                  ×
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-muted/40 min-w-0 w-32 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 512 512"
                    fill="none"
                    aria-hidden
                    className="shrink-0"
                  >
                    <rect width="512" height="512" rx="50" fill="#3178c6" />
                    <path
                      clipRule="evenodd"
                      d="m316.939 407.424v50.061c8.138 4.172 17.763 7.3 28.875 9.386s22.823 3.129 35.135 3.129c11.999 0 23.397-1.147 34.196-3.442 10.799-2.294 20.268-6.075 28.406-11.342 8.138-5.266 14.581-12.15 19.328-20.65s7.121-19.007 7.121-31.522c0-9.074-1.356-17.026-4.069-23.857s-6.625-12.906-11.738-18.225c-5.112-5.319-11.242-10.091-18.389-14.315s-15.207-8.213-24.18-11.967c-6.573-2.712-12.468-5.345-17.685-7.9-5.217-2.556-9.651-5.163-13.303-7.822-3.652-2.66-6.469-5.476-8.451-8.448-1.982-2.973-2.974-6.336-2.974-10.091 0-3.441.887-6.544 2.661-9.308s4.278-5.136 7.512-7.118c3.235-1.981 7.199-3.52 11.894-4.615 4.696-1.095 9.912-1.642 15.651-1.642 4.173 0 8.581.313 13.224.938 4.643.626 9.312 1.591 14.008 2.894 4.695 1.304 9.259 2.947 13.694 4.928 4.434 1.982 8.529 4.276 12.285 6.884v-46.776c-7.616-2.92-15.937-5.084-24.962-6.492s-19.381-2.112-31.066-2.112c-11.895 0-23.163 1.278-33.805 3.833s-20.006 6.544-28.093 11.967c-8.086 5.424-14.476 12.333-19.171 20.729-4.695 8.395-7.043 18.433-7.043 30.114 0 14.914 4.304 27.638 12.912 38.172 8.607 10.533 21.675 19.45 39.204 26.751 6.886 2.816 13.303 5.579 19.25 8.291s11.086 5.528 15.415 8.448c4.33 2.92 7.747 6.101 10.252 9.543 2.504 3.441 3.756 7.352 3.756 11.733 0 3.233-.783 6.231-2.348 8.995s-3.939 5.162-7.121 7.196-7.147 3.624-11.894 4.771c-4.748 1.148-10.303 1.721-16.668 1.721-10.851 0-21.597-1.903-32.24-5.71-10.642-3.806-20.502-9.516-29.579-17.13zm-84.159-123.342h64.22v-41.082h-179v41.082h63.906v182.918h50.874z"
                      fill="#fff"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span className="truncate text-[11px] font-mono text-muted-foreground">
                    drpc.ts
                  </span>
                </div>
                <span
                  aria-hidden
                  className="text-muted-foreground/60 text-[10px] leading-none shrink-0"
                >
                  ×
                </span>
              </div>
            </div>
            <div className="absolute inset-0 top-[68px] bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
