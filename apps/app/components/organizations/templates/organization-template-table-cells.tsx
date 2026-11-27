import Image from "next/image"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  ArchiveXIcon,
  BoxesIcon,
  CalendarClockIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  Clock3Icon,
  EllipsisIcon,
  HistoryIcon,
  LockKeyholeIcon,
  Undo2Icon,
} from "lucide-react"
import {
  getTemplateStatuses,
  type OrganizationTemplate,
  type TemplateStatusFilter,
} from "./template-table-model"
import {
  formatCategory,
  formatFetchedDate,
  formatLabel,
} from "./template-table-format"

export function TemplateIdentity({
  template,
}: {
  template: OrganizationTemplate
}) {
  const imageUrl = template.previewImageUrl ?? template.imageUrl
  const repository =
    template.sourceType === "managed"
      ? "Managed archive"
      : [template.owner, template.repo].filter(Boolean).join("/")

  return (
    <div className="flex min-w-0 items-start gap-3">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={48}
          height={48}
          sizes="48px"
          unoptimized
          className="size-12 shrink-0 rounded-md border bg-muted object-cover"
        />
      ) : (
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground"
          aria-hidden
        >
          <BoxesIcon className="size-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {template.canonicalUrl ? (
          <Link
            className="block truncate font-medium underline-offset-4 hover:underline focus-visible:underline"
            href={template.canonicalUrl}
            target="_blank"
            rel="noreferrer"
          >
            {template.name}
          </Link>
        ) : (
          <p className="truncate font-medium">{template.name}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-mono">{template.slug}</span>
          {repository ? <span> · {repository}</span> : null}
          {template.sourceType === "managed" && !template.installable ? (
            <span> · First release not published</span>
          ) : null}
        </p>
        {template.fetchedAt ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClockIcon className="size-3 shrink-0" aria-hidden />
            <time dateTime={template.fetchedAt}>
              Last fetched {formatFetchedDate(template.fetchedAt)}
            </time>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function TemplateClassification({
  template,
}: {
  template: OrganizationTemplate
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        variant="outline"
        className={categoryStyles[template.category] ?? categoryStyles.default}
      >
        {formatCategory(template.category)}
      </Badge>
      {template.labels.slice(0, 4).map((label) => (
        <Badge
          key={label}
          variant="outline"
          title={formatLabel(label)}
          className={labelStyle(label)}
        >
          {formatLabel(label)}
        </Badge>
      ))}
      {template.labels.length > 4 ? (
        <span
          className="text-xs text-muted-foreground"
          title={template.labels.slice(4).map(formatLabel).join(", ")}
        >
          +{template.labels.length - 4} more
        </span>
      ) : null}
    </div>
  )
}

export function TemplateStatus({
  template,
}: {
  template: OrganizationTemplate
}) {
  const statuses = getTemplateStatuses(template)
  const primary = statuses.includes("published")
    ? "published"
    : (statuses[0] ?? "private")
  const secondary = statuses.filter((status) => status !== primary)

  return (
    <div className="flex min-w-36 flex-col items-start gap-1.5">
      <StatusBadge status={primary} />
      {secondary.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
      {template.publication?.reviewStatus === "rejected" &&
      template.publication.reviewReason ? (
        <p
          className="max-w-48 truncate text-xs text-muted-foreground"
          title={template.publication.reviewReason}
        >
          {template.publication.reviewReason}
        </p>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: TemplateStatusFilter }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      title={config.label}
      className={`gap-1.5 ${config.className}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {config.label}
    </Badge>
  )
}

export function TemplateActions({
  template,
  canManage,
  onRequestPublication,
  onWithdrawPublication,
}: {
  template: OrganizationTemplate
  canManage: boolean
  onRequestPublication: (template: OrganizationTemplate) => void
  onWithdrawPublication: (templateId: string) => void
}) {
  if (!canManage) {
    return <span className="sr-only">No management actions available</span>
  }

  const isPending = template.publication?.reviewStatus === "pending"
  const actionLabel = isPending
    ? "Withdraw publication request"
    : template.currentlyPublished
      ? "Submit template update"
      : "Request template publication"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${template.name}`}
          className="size-9"
        >
          <EllipsisIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="max-w-56 truncate">
          {template.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            isPending
              ? onWithdrawPublication(template.id)
              : onRequestPublication(template)
          }
          className={isPending ? "text-destructive focus:text-destructive" : ""}
        >
          {isPending ? (
            <Undo2Icon aria-hidden />
          ) : template.currentlyPublished ? (
            <HistoryIcon aria-hidden />
          ) : (
            <CircleCheckIcon aria-hidden />
          )}
          {actionLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function labelStyle(label: string) {
  let hash = 0
  for (const character of label.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return labelPalettes[hash % labelPalettes.length]
}

const categoryStyles: Record<string, string> = {
  default: "border-border bg-muted text-foreground",
  saas: "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  ai: "border-violet-500/20 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  landing:
    "border-orange-500/20 bg-orange-500/10 text-orange-800 dark:text-orange-200",
  desktop: "border-cyan-500/20 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200",
  docs: "border-indigo-500/20 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200",
  marketing:
    "border-pink-500/20 bg-pink-500/10 text-pink-800 dark:text-pink-200",
  content:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  library:
    "border-slate-500/20 bg-slate-500/10 text-slate-800 dark:text-slate-200",
  "ai-agent":
    "border-purple-500/20 bg-purple-500/10 text-purple-800 dark:text-purple-200",
}

const labelPalettes = [
  "border-blue-500/20 bg-blue-500/5 text-blue-800 dark:text-blue-200",
  "border-violet-500/20 bg-violet-500/5 text-violet-800 dark:text-violet-200",
  "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
  "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200",
  "border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-200",
  "border-cyan-500/20 bg-cyan-500/5 text-cyan-800 dark:text-cyan-200",
]

const statusLabels: Record<TemplateStatusFilter, string> = {
  published: "Published",
  "update-in-review": "Update in review",
  "in-review": "Awaiting review",
  "changes-requested": "Changes requested",
  private: "Private",
  removed: "Removed from catalog",
  "previously-published": "Previously published",
  withdrawn: "Withdrawn",
}

const statusConfig: Record<
  TemplateStatusFilter,
  { label: string; icon: typeof CircleCheckIcon; className: string }
> = {
  published: {
    label: statusLabels.published,
    icon: CircleCheckIcon,
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  "update-in-review": {
    label: statusLabels["update-in-review"],
    icon: Clock3Icon,
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  },
  "in-review": {
    label: statusLabels["in-review"],
    icon: Clock3Icon,
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  },
  "changes-requested": {
    label: statusLabels["changes-requested"],
    icon: CircleAlertIcon,
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  },
  private: {
    label: statusLabels.private,
    icon: LockKeyholeIcon,
    className: "border-border bg-muted text-foreground",
  },
  removed: {
    label: statusLabels.removed,
    icon: ArchiveXIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
  "previously-published": {
    label: statusLabels["previously-published"],
    icon: HistoryIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
  withdrawn: {
    label: statusLabels.withdrawn,
    icon: Undo2Icon,
    className: "border-border bg-muted text-muted-foreground",
  },
}
