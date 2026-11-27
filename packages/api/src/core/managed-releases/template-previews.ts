import { and, desc, eq, inArray } from "drizzle-orm"
import { db, managedReleases } from "@workspace/database"
import { getManagedReleaseStorage } from "./storage.js"

export type ManagedTemplateReleaseSummary = {
  installable: boolean
  previewImageUrl: string | null
}

/**
 * Resolve each template's latest ready release summary. Preview URLs are
 * scoped to the validated preview object and expire after five minutes.
 */
export async function getManagedTemplateReleaseSummaries(
  templateIds: string[],
  options: { includePreviews?: boolean } = {}
): Promise<Map<string, ManagedTemplateReleaseSummary>> {
  if (templateIds.length === 0) return new Map()

  const releases = await db
    .select({
      templateId: managedReleases.templateId,
      previewKey: managedReleases.previewKey,
      createdAt: managedReleases.createdAt,
    })
    .from(managedReleases)
    .where(
      and(
        inArray(managedReleases.templateId, templateIds),
        eq(managedReleases.kind, "template"),
        eq(managedReleases.status, "ready")
      )
    )
    .orderBy(desc(managedReleases.createdAt))

  const latestByTemplate = new Map<string, (typeof releases)[number]>()
  for (const release of releases) {
    if (release.templateId && !latestByTemplate.has(release.templateId)) {
      latestByTemplate.set(release.templateId, release)
    }
  }

  const previews: Array<{ templateId: string; previewKey: string }> = []
  for (const [templateId, release] of latestByTemplate) {
    if (release.previewKey) {
      previews.push({ templateId, previewKey: release.previewKey })
    }
  }
  const previewUrls = new Map<string, string>()
  if (options.includePreviews !== false && previews.length > 0) {
    const { sealed } = getManagedReleaseStorage()
    const signed = await Promise.all(
      previews.map(
        async ({ templateId, previewKey }) =>
          [
            templateId,
            await sealed.createDownloadUrl({
              key: previewKey,
              expiresInSeconds: 300,
            }),
          ] as const
      )
    )
    for (const [templateId, url] of signed) previewUrls.set(templateId, url)
  }

  return new Map(
    [...latestByTemplate.keys()].map((templateId) => [
      templateId,
      {
        installable: true,
        previewImageUrl: previewUrls.get(templateId) ?? null,
      },
    ])
  )
}
