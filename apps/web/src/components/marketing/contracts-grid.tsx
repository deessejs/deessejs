"use client"

import { ArrowUpRight } from "lucide-react"
import * as motion from "motion/react-client"
import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

import { MockupPlaceholder } from "./mockup-placeholder"

type Provider = { name: string; logo: string }

/**
 * The contract's icon is passed as a string identifier from the
 * server-rendered page. Components cannot cross the RSC boundary,
 * so the icons are looked up via `ICON_MAP` here on the client.
 */
type Contract = {
  title: string
  description: string
  icon:
    | "auth"
    | "database"
    | "billing"
    | "jobs"
    | "storage"
    | "observability"
    | "cache"
  providers: ReadonlyArray<Provider>
}

import {
  Boxes,
  CircleDollarSign,
  Database,
  GitBranch,
  Layers,
  LineChart,
  Zap,
} from "lucide-react"

const ICON_MAP = {
  auth: Zap,
  database: Database,
  billing: CircleDollarSign,
  jobs: GitBranch,
  storage: Boxes,
  observability: LineChart,
  cache: Layers,
} as const

// Variant set shared by the parent grid and every cell. Variants are
// inherited via the `variants` prop, so the parent's `staggerChildren`
// runs without per-cell wiring.
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const cell = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

/**
 * Bento span allocation per contract, keyed by `title`. Explicit
 * `lg:col-span-*` + `lg:row-start-*` so re-ordering `CONTRACTS[]` in
 * `home-data.ts` does not break the visual layout.
 */
const BENTO_SPAN: Record<
  Contract["title"],
  {
    col: string
    rowStart: string
    rowSpan?: string
  }
> = {
  Database: { col: "lg:col-span-6", rowSpan: "lg:row-span-2", rowStart: "lg:row-start-1" },
  Auth: { col: "lg:col-span-3", rowStart: "lg:row-start-1" },
  Storage: { col: "lg:col-span-6", rowStart: "lg:row-start-4" },
  Billing: { col: "lg:col-span-12", rowStart: "lg:row-start-3" },
  Jobs: { col: "lg:col-span-3", rowStart: "lg:row-start-1" },
  Observability: { col: "lg:col-span-6", rowStart: "lg:row-start-2" },
  Cache: { col: "lg:col-span-6", rowStart: "lg:row-start-4" },
}

export function ContractsGrid({
  contracts,
}: {
  contracts: ReadonlyArray<Contract>
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-4 lg:auto-rows-min gap-px bg-border"
    >
      {contracts.map((contract) => {
        const Icon = ICON_MAP[contract.icon]
        const span = BENTO_SPAN[contract.title] ?? {
          col: "lg:col-span-3",
          rowStart: "lg:row-start-1",
        }
        return (
          <motion.article
            key={contract.title}
            variants={cell}
            initial="rest"
            whileHover="hover"
            animate="rest"
            className={cn(
              "group relative flex flex-col gap-4 bg-background p-6",
              span.col,
              span.rowStart,
              span.rowSpan,
            )}
          >
            <Link
              href={`/templates?tags=["${contract.title.toLowerCase()}"]`}
              aria-label={`Browse all ${contract.title} templates`}
              className="absolute inset-0 z-0"
            />
            <button
              type="button"
              aria-label={`Open ${contract.title} templates in a new tab`}
              onClick={(e) => {
                e.stopPropagation()
                window.open(
                  `/templates?tags=["${contract.title.toLowerCase()}"]`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }}
              className="absolute top-3 right-3 z-20 flex size-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none"
            >
              <ArrowUpRight className="size-3.5" aria-hidden />
            </button>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40">
                  <Icon className="text-foreground size-4" aria-hidden />
                </span>
                <h3 className="text-heading-20 tracking-tight text-foreground !m-0">
                  {contract.title}
                </h3>
              </div>

              <MockupPlaceholder />

              <p className="text-copy-14 text-muted-foreground leading-6 [&:not(:first-child)]:mt-0">
                {contract.description}
              </p>

              <ul className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
                {contract.providers.map((provider) => (
                  <li
                    key={provider.name}
                    className="inline-flex items-center gap-1.5 text-label-12 text-muted-foreground"
                  >
                    {provider.logo.endsWith("-missing") ? null : (
                      <img
                        src={`/logos/${provider.logo}.svg`}
                        alt=""
                        width={12}
                        height={12}
                        className="size-3 shrink-0 dark:invert"
                        aria-hidden
                      />
                    )}
                    {provider.name}
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Re-export for use by the homepage (kept in this file so the contracts
// data + the grid live together - the homepage only needs to import
// { ContractsGrid }).
// ---------------------------------------------------------------------------
export type { Contract, Provider }
