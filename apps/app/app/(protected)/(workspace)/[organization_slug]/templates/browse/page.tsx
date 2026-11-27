import { orpc } from "@/lib/orpc"
import { BrowseTemplatesPage } from "@/components/organizations/catalogues/browse-templates-page"
import type {
  CommunityTemplateSummaryV1Type,
  TemplateSummaryV1Type,
} from "@workspace/contracts/v1"

type CatalogTemplate = TemplateSummaryV1Type | CommunityTemplateSummaryV1Type

export default async function BrowseTemplatesRoute() {
  let templates: CatalogTemplate[] = []
  let error: string | null = null
  try {
    const [platform, community] = await Promise.all([
      orpc.templates.list(undefined),
      orpc.templates.community.list(undefined),
    ])
    templates = [...platform.templates, ...community.templates]
  } catch {
    error =
      "Public templates could not be loaded. Refresh this page to try again."
  }
  return <BrowseTemplatesPage templates={templates} error={error} />
}
