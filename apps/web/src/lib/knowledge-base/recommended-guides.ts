export function validateRecommendedGuideSlugs(
  topicSlug: string,
  recommendedSlugs: readonly string[],
  knownGuideSlugs: ReadonlySet<string>
): void {
  for (const guideSlug of recommendedSlugs) {
    if (!knownGuideSlugs.has(guideSlug)) {
      throw new Error(
        `Topic "${topicSlug}" recommends unknown guide "${guideSlug}". ` +
          `Add content/knowledge-base/guides/${guideSlug}.mdx or fix recommendedGuides.`
      )
    }
  }
}
