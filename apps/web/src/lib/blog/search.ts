import { allPosts, allReleases } from "content-collections"

export type SearchItem = {
  title: string
  description: string
  url: string
  type: "post" | "release"
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
]
