import type { TemplateV1 } from "@workspace/contracts/v1"

import { orpc } from "@/lib/orpc"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default async function HomePage() {
  let templates: TemplateV1[] = []
  let fetchError: string | null = null
  try {
    const result = await orpc.templates.list()
    templates = result.templates
  } catch (error) {
    fetchError =
      error instanceof Error ? error.message : "Failed to load templates"
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          All templates you have access to. Pick one to install with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            deessejs init &lt;slug&gt;
          </code>
          .
        </p>
      </header>

      {fetchError && (
        <p className="text-sm text-destructive" role="alert">
          {fetchError}
        </p>
      )}

      {!fetchError && templates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No templates available right now.
        </p>
      )}

      {templates.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <li key={template.slug}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground">
                      {template.category}
                    </span>
                    {template.labels.map((label: string) => (
                      <span
                        key={label}
                        className="rounded bg-muted px-2 py-0.5"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <span>
                    {template.owner}/{template.repo}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
