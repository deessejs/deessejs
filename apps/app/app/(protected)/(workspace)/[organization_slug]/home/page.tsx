import type { TemplateV1 } from "@workspace/contracts/v1"

import { orpc } from "@/lib/orpc"
import Link from "next/link"
import { ArrowRightIcon, BlocksIcon, FolderGit2Icon, LibraryBigIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { workspaceBlocksPath, workspaceProjectsPath, workspaceTemplatesPath } from "@/lib/workspace-paths"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

/**
 * The workspace home.
 *
 * The page belongs to the organization in its URL, and it says so:
 * the organization's name is the heading. The catalogue stays what it
 * was, because a workspace with no content of its own is not a
 * workspace.
 */
export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params
  const organization = await readWorkspaceOrganization(organization_slug)

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
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b pb-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{organization.name}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Build with templates, reusable blocks, and projects connected to this organization.</p>
        </div>
        <Button asChild><Link href={workspaceTemplatesPath(organization_slug)}>Browse templates<ArrowRightIcon aria-hidden /></Link></Button>
      </header>
      <nav aria-label="Workspace sections" className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Templates", description: "Explore the catalog and organization templates.", href: workspaceTemplatesPath(organization_slug), icon: LibraryBigIcon },
          { title: "Blocks", description: "Manage reusable capabilities and revisions.", href: workspaceBlocksPath(organization_slug), icon: BlocksIcon },
          { title: "Projects", description: "Review repositories connected through GitHub.", href: workspaceProjectsPath(organization_slug), icon: FolderGit2Icon },
        ].map(({ title, description, href, icon: Icon }) => (
          <Link key={title} href={href} className="group flex min-h-32 flex-col justify-between rounded-md border bg-card p-5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex items-center justify-between"><Icon className="size-4 text-muted-foreground" aria-hidden /><ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            <span><span className="block font-medium">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span>
          </Link>
        ))}
      </nav>
      <section aria-labelledby="available-templates-heading" className="flex flex-col gap-5">
        <div className="flex items-end justify-between border-b pb-3">
          <div><h2 id="available-templates-heading" className="text-lg font-semibold tracking-tight">Available templates</h2><p className="mt-1 text-sm text-muted-foreground">Install a starter with <code className="rounded bg-muted px-1 py-0.5 text-xs">deessejs init &lt;slug&gt;</code>.</p></div>
          <span className="text-sm tabular-nums text-muted-foreground">{templates.length}</span>
        </div>
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
      </section>
    </div>
  )
}
