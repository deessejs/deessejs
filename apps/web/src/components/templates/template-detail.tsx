import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import { TemplateLabels } from "./template-labels"
import { CopyButton } from "./copy-button"
import { TemplateReadme } from "./template-readme"

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
 *   │  Title                  [Install CLI] [VS]  │
 *   │  Description                                │
 *   ├────────────────────────────────────────────┤
 *   │  Preview image 16:9                         │
 *   ├────────────────────────────────────────────┤
 *   │  Body (2 columns on lg):                    │
 *   │   ┌─ main ───────────────┐ ┌─ sidebar ──┐  │
 *   │   │  About              │ │  Quick     │  │
 *   │   │  Overview (README)   │ │  start     │  │
 *   │   │  Install            │ │  Details   │  │
 *   │   │  Source             │ │            │  │
 *   │   │  Labels             │ │            │  │
 *   │   └─────────────────────┘ └────────────┘  │
 *   └────────────────────────────────────────────┘
 *
 * The hero dropped the category/license badges (they live in the
 * sidebar's Details block), and the CTAs moved up next to the
 * title on lg. On smaller viewports `flex-col` keeps the CTAs
 * stacked below the description.
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

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="text-heading-56 tracking-tight">{template.name}</h1>
          <p className="text-copy-18 text-muted-foreground max-w-3xl">
            {template.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
          <Button asChild>
            <a
              href="https://docs.deessejs.com/cli"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install CLI
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              View source
            </a>
          </Button>
        </div>
      </header>

      <div
        aria-hidden
        className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted/40"
      />

      <Separator />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-label-14 text-muted-foreground">About</h2>
            <p className="text-copy-16 text-foreground">
              {template.description}
            </p>
          </section>

          <TemplateReadme readme={template.readme} />

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
              max={template.labels?.length ?? 0}
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
          <section className="flex flex-col gap-3">
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
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-label-13 font-semibold tracking-tight text-foreground">
              Details
            </h3>
            <dl className="flex flex-col gap-3 text-copy-13">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="text-foreground truncate">
                  <a
                    href={`https://github.com/${template.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                  >
                    {template.owner}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Repo</dt>
                <dd className="text-foreground truncate">
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                  >
                    {template.repo}
                  </a>
                </dd>
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
          </section>
        </aside>
      </div>
    </article>
  )
}