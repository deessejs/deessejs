import * as React from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Per-page hero primitives for use-case pages. Each use-case page
 * renders its own hero by composing one of these variants. The shape
 * is shared (badge + breadcrumb + headline + tagline + CTA), but the
 * layout, density, and visual treatment are picked per page.
 *
 * Variants:
 *  - split: copy on the left, visual on the right (default SaaS use-case)
 *  - dark: full-width dark hero with code-centric copy
 *  - self-referential: hero is the page itself (landing-pages case)
 *  - center: copy-only centered hero (lightweight fallback)
 */

type Variant = "split" | "dark" | "self-referential" | "center"

export function UseCaseHero({
  category,
  title,
  tagline,
  variant = "center",
  status,
  visual,
  primaryCta,
  secondaryCta,
}: {
  category: string
  title: string
  tagline: string
  variant?: Variant
  status?: "shipped" | "coming-soon" | "beta"
  visual?: React.ReactNode
  primaryCta: { label: string; href: string; external?: boolean }
  secondaryCta?: { label: string; href: string; external?: boolean }
}) {
  return (
    <section
      className={cn(
        "border-b border-border",
        variant === "dark" && "bg-zinc-950 text-zinc-100",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:px-8 lg:py-24",
          variant === "split" && "lg:grid lg:grid-cols-2 lg:items-center lg:gap-12",
        )}
      >
        <Breadcrumb
          className={cn(
            "[&:not(:first-child)]:mt-0",
            variant === "dark" && "[&_a]:text-zinc-400 [&_a:hover]:text-zinc-100",
          )}
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/use-cases">Use cases</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div
          className={cn(
            "flex flex-col gap-6",
            variant === "split" && "lg:order-1",
          )}
        >
          <div className="flex items-center gap-3">
            <p
              className={cn(
                "text-label-13 uppercase tracking-wider",
                variant === "dark"
                  ? "text-zinc-400"
                  : "text-muted-foreground",
              )}
            >
              Use case · {category}
            </p>
            {status === "coming-soon" ? (
              <span
                className={cn(
                  "rounded-none border px-2 py-0.5 text-label-12",
                  variant === "dark"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                    : "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                )}
              >
                Coming soon
              </span>
            ) : null}
          </div>

          <h1
            className={cn(
              "font-medium tracking-tight text-balance",
              variant === "dark"
                ? "text-heading-32 sm:text-heading-40 lg:text-heading-56 text-zinc-50"
                : "text-heading-32 sm:text-heading-40 lg:text-heading-56 text-foreground",
              "[&:not(:first-child)]:mt-0",
            )}
          >
            {title}
          </h1>

          <p
            className={cn(
              "max-w-2xl text-balance [&:not(:first-child)]:mt-0",
              variant === "dark"
                ? "text-copy-18 text-zinc-300 leading-7"
                : "text-copy-18 text-muted-foreground leading-7",
            )}
          >
            {tagline}
          </p>

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {primaryCta ? (
                <CtaLink
                  {...primaryCta}
                  variant={variant === "dark" ? "dark" : "light"}
                />
              ) : null}
              {secondaryCta ? (
                <CtaLink
                  {...secondaryCta}
                  variant={variant === "dark" ? "outline-dark" : "outline"}
                />
              ) : null}
            </div>
          )}
        </div>

        {visual && variant === "split" ? (
          <div className="lg:order-2">{visual}</div>
        ) : null}
      </div>
    </section>
  )
}

function CtaLink({
  label,
  href,
  external,
  variant,
}: {
  label: string
  href: string
  external?: boolean
  variant: "light" | "outline" | "dark" | "outline-dark"
}) {
  const isDark = variant === "dark"
  const isOutline = variant === "outline" || variant === "outline-dark"
  const className = cn(
    "inline-flex items-center gap-2 px-5 py-2.5 text-copy-14 font-medium transition-colors",
    !isOutline
      ? isDark
        ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
        : "bg-foreground text-background hover:bg-foreground/90"
      : isDark
        ? "border border-zinc-700 text-zinc-100 hover:bg-zinc-900"
        : "border border-border bg-background text-foreground hover:bg-accent/40",
  )

  if (external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </Link>
    )
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}
