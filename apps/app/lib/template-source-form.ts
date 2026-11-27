export type TemplateSourceType = "github" | "managed"

export function switchTemplateSource<
  T extends { sourceType: TemplateSourceType; repositoryUrl: string },
>(values: T, sourceType: TemplateSourceType): T {
  return { ...values, sourceType }
}

export function repositoryUrlForSource(
  sourceType: TemplateSourceType,
  repositoryUrl: string
): { repositoryUrl?: string } {
  return sourceType === "github" && repositoryUrl ? { repositoryUrl } : {}
}
