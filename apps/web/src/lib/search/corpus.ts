import { allPosts, allReleases, allKbTopics, allKbGuides } from "content-collections"

export type SearchItem = {
  title: string
  description: string
  url: string
  type: "post" | "release" | "kb-topic" | "kb-guide"
  tags?: string[]
}

export const searchData: SearchItem[] = [
  ...allPosts.map((post) => ({
    title: post.title,
    description: post.description,
    url: post.url,
    type: "post" as const,
  })),
  ...allReleases.map((release) => ({
    title: `${release.version} — ${release.title}`,
    description: release.description,
    url: release.url,
    type: "release" as const,
  })),
  ...allKbTopics.map((topic) => ({
    title: topic.title,
    description: topic.description,
    url: topic.url,
    type: "kb-topic" as const,
    tags: topic.tags,
  })),
  ...allKbGuides.map((guide) => ({
    title: guide.title,
    description: guide.description,
    url: guide.url,
    type: "kb-guide" as const,
    tags: guide.products,
  })),
]
