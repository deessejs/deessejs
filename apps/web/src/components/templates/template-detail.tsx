import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import type { Template } from "@/lib/templates-api"
import { TemplateLabels } from "./template-labels"
import { CopyButton } from "./copy-button"

export type TemplateDetailProps = {
  template: Template
  className?: string
}

/**
 * Single-template detail view at /templates/[template_slug].
 *
 * Layout (Vercel-style):
 *
 *   ┌─ Breadcrumb ───────────────────────────────┐
 *   │  Templates  /  {name}                       │
 *   ├────────────────────────────────────────────┤
 *   │  Hero: badges · title · description         │
 *   │  Preview image 16:9                         │
 *   │  CTAs: Install CLI · View source            │
 *   ├────────────────────────────────────────────┤
 *   │  Body (2 columns on lg):                    │
 *   │   ┌─ main ───────────────┐ ┌─ sidebar ──┐  │
 *   │   │  About              │ │  Quick     │  │
 *   │   │  Install            │ │  start     │  │
 *   │   │  Source             │ │  Metadata  │  │
 *   │   │  Labels             │ │            │  │
 *   │   └─────────────────────┘ └────────────┘  │
 *   └────────────────────────────────────────────┘
 */
export const TemplateDetail = ({ template, className }: TemplateDetailProps) => {
  const installCommand = `deessejs init ${template.slug}`
  const sourceUrl = `https://github.com/${template.owner}/${template.repo}`

  return (
    <article className={cn("mx-auto flex max-w-4xl flex-col gap-8", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/templates">Templates</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{template.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{template.category}</Badge>
          <Badge variant="secondary">{template.license}</Badge>
        </div>
        <h1 className="text-heading-56 tracking-tight">{template.name}</h1>
        <p className="text-copy-18 text-muted-foreground max-w-3xl">
          {template.description}
        </p>
      </header>

      <div
        aria-hidden
        className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted/40"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/docs/cli">Install CLI</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            View source
          </a>
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-label-14 text-muted-foreground">About</h2>
            <p className="text-copy-16 text-foreground">
              {template.description}
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-label-14 text-muted-foreground">Install</h2>
            <Card className="flex items-center justify-between gap-3 p-4">
              <code className="text-copy-14-mono text-foreground truncate">
                {installCommand}
              </code>
              <CopyButton value={installCommand} ariaLabel="Copy install command" />
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-label-14 text-muted-foreground">Source</h2>
            <p className="text-copy-14">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                github.com/{template.owner}/{template.repo}
              </a>
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-label-14 text-muted-foreground">Labels</h2>
            <TemplateLabels
              labels={template.labels}
              max={template.labels.length}
            />
          </section>

          <section
            aria-label="Submit your template"
            className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-4"
          >
            <h2 className="text-label-14 font-semibold tracking-tight text-foreground">
              Ship your template to the registry
            </h2>
            <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              {template.name} is in the DeesseJS registry. Open a
              PR to add another — or yours. Slug, category, and
              labels are collected via the issue form.
            </p>
            <Button asChild>
              <a
                href="https://github.com/deessejs/deessejs/issues/new?template=add-template.yml&labels=template"
                target="_blank"
                rel="noopener noreferrer"
              >
                Submit your template
              </a>
            </Button>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-6">
            <h3 className="text-label-13 font-semibold tracking-tight text-foreground">
              Quick start
            </h3>
            <code className="text-copy-14-mono text-foreground break-all bg-muted px-3 py-2 rounded-md">
              {installCommand}
            </code>
            <CopyButton
              value={installCommand}
              className="w-full"
              label="Copy install command"
            />
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <h3 className="text-label-13 font-semibold tracking-tight text-foreground">
              Details
            </h3>
            <dl className="flex flex-col gap-3 text-copy-13">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="text-foreground truncate">{template.owner}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Repo</dt>
                <dd className="text-foreground truncate">{template.repo}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">License</dt>
                <dd className="text-foreground truncate">{template.license}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-foreground truncate">{template.category}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </article>
  )
}