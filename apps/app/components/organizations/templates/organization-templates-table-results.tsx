import type { OrganizationTemplate } from "./template-table-model"
import { StarIcon } from "lucide-react"
import {
  TemplateActions,
  TemplateCategory,
  TemplateFetchedAt,
  TemplateIdentity,
  TemplateLabels,
  TemplateStatus,
  TemplateThumbnail,
} from "./organization-template-table-cells"

type ResultsProps = {
  templates: OrganizationTemplate[]
  organizationName: string
  canManage: boolean
  onRequestPublication: (template: OrganizationTemplate) => void
  onWithdrawPublication: (templateId: string) => void
}

export function OrganizationTemplatesTableResults(props: ResultsProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <DesktopTemplateTable {...props} />
      </div>
      <div className="grid gap-3 md:hidden">
        <MobileTemplateCards {...props} />
      </div>
    </>
  )
}

function DesktopTemplateTable({
  templates,
  organizationName,
  ...actionProps
}: ResultsProps) {
  return (
    <table className="w-full min-w-[1200px] caption-bottom text-sm">
      <caption className="sr-only">
        Templates owned by {organizationName}
      </caption>
      <thead className="border-b bg-muted/50 text-left text-muted-foreground">
        <tr>
          <th scope="col" className="h-11 w-40 px-4 text-center font-medium">
            Publication status
          </th>
          <th scope="col" className="h-11 w-20 px-4 font-medium">
            Preview
          </th>
          <th scope="col" className="h-11 min-w-64 px-4 font-medium">
            Template and repository
          </th>
          <th scope="col" className="h-11 w-40 px-4 font-medium">
            Last fetched
          </th>
          <th scope="col" className="h-11 w-36 px-4 font-medium">
            Category
          </th>
          <th scope="col" className="h-11 min-w-48 px-4 font-medium">
            Labels
          </th>
          <th scope="col" className="h-11 w-24 px-4 text-right font-medium">
            Stars
          </th>
          <th scope="col" className="h-11 w-24 px-4 text-right font-medium">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {templates.map((template) => (
          <DesktopTemplateRow
            key={template.id}
            template={template}
            {...actionProps}
          />
        ))}
      </tbody>
    </table>
  )
}

function DesktopTemplateRow({
  template,
  ...actionProps
}: Omit<ResultsProps, "templates" | "organizationName"> & {
  template: OrganizationTemplate
}) {
  return (
    <tr className="align-middle">
      <td className="px-4 py-4 text-center">
        <TemplateStatus template={template} />
      </td>
      <td className="px-4 py-3">
        <TemplateThumbnail template={template} />
      </td>
      <td className="max-w-lg px-4 py-3">
        <TemplateIdentity template={template} />
      </td>
      <td className="px-4 py-3">
        <TemplateFetchedAt template={template} />
      </td>
      <td className="px-4 py-3">
        <TemplateCategory template={template} />
      </td>
      <td className="px-4 py-3">
        <TemplateLabels template={template} />
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        <StarsCount stars={template.stars} />
      </td>
      <td className="px-4 py-3 text-right">
        <TemplateActions template={template} {...actionProps} />
      </td>
    </tr>
  )
}

function MobileTemplateCards({
  templates,
  canManage,
  onRequestPublication,
  onWithdrawPublication,
}: ResultsProps) {
  return templates.map((template) => (
    <article key={template.id} className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <TemplateStatus template={template} />
        <TemplateActions
          template={template}
          canManage={canManage}
          onRequestPublication={onRequestPublication}
          onWithdrawPublication={onWithdrawPublication}
        />
      </div>
      <div className="flex min-w-0 items-start gap-3">
        <TemplateThumbnail template={template} />
        <TemplateIdentity template={template} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <TemplateCategory template={template} />
        <TemplateLabels template={template} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <StarsCount stars={template.stars} emptyLabel="No star data" />
        <span>
          {template.fetchedAt
            ? `Fetched ${formatFetchedDate(template.fetchedAt)}`
            : "Not fetched yet"}
        </span>
      </div>
    </article>
  ))
}

function StarsCount({
  stars,
  emptyLabel = "-",
}: {
  stars: number | null
  emptyLabel?: string
}) {
  return (
    <span className="inline-flex items-center justify-end gap-1.5 text-muted-foreground">
      <StarIcon className="size-3.5" aria-hidden />
      {stars?.toLocaleString("en-US") ?? emptyLabel}
    </span>
  )
}

import { formatFetchedDate } from "./template-table-format"
