"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ORPCError } from "@orpc/client"
import { Button } from "@workspace/ui/components/button"
import { PlusIcon } from "lucide-react"
import { CreateOrganizationTemplateDialog } from "./create-organization-template-dialog"
import { RequestTemplatePublicationDialog } from "./request-template-publication-dialog"
import { OrganizationTemplatesTable } from "./organization-templates-table"
import type { OrganizationTemplate } from "./template-table-model"

export function OrganizationTemplatesPage({
  organizationSlug,
  organizationName,
  canManage,
  templates,
  fetchError,
}: {
  organizationSlug: string
  organizationName: string
  canManage: boolean
  templates: OrganizationTemplate[]
  fetchError: string | null
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [publicationDialogOpen, setPublicationDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<OrganizationTemplate | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function withdrawPublication(templateId: string) {
    setActionError(null)
    try {
      await client.rpc.organization.templates.withdraw({
        organizationSlug,
        templateId,
      })
      router.refresh()
    } catch (error) {
      setActionError(
        error instanceof ORPCError
          ? "The request is no longer pending. Refresh and try again."
          : "The request could not be withdrawn. Try again."
      )
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <TemplatesHeader
        organizationName={organizationName}
        canManage={canManage}
        onAdd={() => setDialogOpen(true)}
      />
      <TemplateContent
        templates={templates}
        organizationName={organizationName}
        canManage={canManage}
        fetchError={fetchError}
        onAdd={() => setDialogOpen(true)}
        onRequestPublication={(template) => {
          setSelectedTemplate(template)
          setPublicationDialogOpen(true)
        }}
        onWithdrawPublication={(templateId) =>
          void withdrawPublication(templateId)
        }
        actionError={actionError}
      />
      {canManage && (
        <CreateOrganizationTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          organizationSlug={organizationSlug}
          onCreated={() => router.refresh()}
        />
      )}
      {canManage && selectedTemplate ? (
        <RequestTemplatePublicationDialog
          open={publicationDialogOpen}
          onOpenChange={setPublicationDialogOpen}
          organizationSlug={organizationSlug}
          template={selectedTemplate}
          onSubmitted={() => router.refresh()}
        />
      ) : null}
    </div>
  )
}

function TemplatesHeader({
  organizationName,
  canManage,
  onAdd,
}: {
  organizationName: string
  canManage: boolean
  onAdd: () => void
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Private templates for {organizationName}. Only members of this
          organization can see them.
        </p>
      </div>
      {canManage && (
        <Button onClick={onAdd}>
          <PlusIcon aria-hidden />
          Add template
        </Button>
      )}
    </header>
  )
}

function TemplateContent({
  templates,
  organizationName,
  canManage,
  fetchError,
  onAdd,
  onRequestPublication,
  onWithdrawPublication,
  actionError,
}: {
  templates: OrganizationTemplate[]
  organizationName: string
  canManage: boolean
  fetchError: string | null
  onAdd: () => void
  onRequestPublication: (template: OrganizationTemplate) => void
  onWithdrawPublication: (templateId: string) => void
  actionError: string | null
}) {
  if (fetchError) {
    return (
      <p
        className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
        role="alert"
      >
        {fetchError}
      </p>
    )
  }

  if (templates.length === 0) {
    return <EmptyTemplates canManage={canManage} onAdd={onAdd} />
  }

  return (
    <OrganizationTemplatesTable
      templates={templates}
      organizationName={organizationName}
      canManage={canManage}
      onRequestPublication={onRequestPublication}
      onWithdrawPublication={onWithdrawPublication}
      actionError={actionError}
    />
  )
}

function EmptyTemplates({
  canManage,
  onAdd,
}: {
  canManage: boolean
  onAdd: () => void
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">No templates yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {canManage
          ? "Add a public GitHub repository to create the first private template for this organization."
          : "An organization owner or admin can add the first private template."}
      </p>
      {canManage && (
        <Button onClick={onAdd}>
          <PlusIcon aria-hidden />
          Add your first template
        </Button>
      )}
    </section>
  )
}
