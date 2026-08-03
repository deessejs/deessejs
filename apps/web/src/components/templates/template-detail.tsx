import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { Template } from "@/lib/templates-api"
import { TemplateLabels } from "./template-labels"

export type TemplateDetailProps = {
  template: Template
  className?: string
}

/**
 * Single-template detail view, used at /templates/[template_slug].
 *
 * Layout:
 *   - Title + category badge in the header row.
 *   - Description (full text, no line clamp).
 *   - Labels (all of them, not collapsed).
 *   - Owner / repo / license as a metadata row.
 *   - Primary CTA: "Install with deessejs init <slug>" (copies the
 *     install command to the user's terminal context — it's just
 *     copyable text, we don't run anything client-side).
 */
export const TemplateDetail = ({ template, className }: TemplateDetailProps) => {
  const installCommand = `deessejs init ${template.slug}`

  return (
    <article className={cn("mx-auto flex max-w-3xl flex-col gap-8", className)}>
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{template.category}</Badge>
          <Badge variant="secondary">{template.license}</Badge>
        </div>
        <h1 className="text-heading-32 tracking-tight">{template.name}</h1>
      </header>

      <Card className="p-6">
        <p className="text-copy-16 text-foreground">{template.description}</p>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-label-14 text-muted-foreground">Labels</h2>
        <TemplateLabels labels={template.labels} max={template.labels.length} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label-14 text-muted-foreground">Source</h2>
        <p className="text-copy-14">
          <a
            href={`https://github.com/${template.owner}/${template.repo}`}
            target="_blank"
            rel="noreferrer noopener"
            className="underline-offset-4 hover:underline"
          >
            github.com/{template.owner}/{template.repo}
          </a>
        </p>
      </section>

      <Card className="flex items-center justify-between gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-label-14 text-muted-foreground">Install</h2>
          <code className="text-copy-14-mono">{installCommand}</code>
        </div>
        <Button asChild>
          <Link href="/templates">All templates</Link>
        </Button>
      </Card>
    </article>
  )
}
