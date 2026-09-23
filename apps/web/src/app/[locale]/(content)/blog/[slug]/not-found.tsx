import { NotFoundPanel } from "@/components/not-found/not-found-panel"

export default function BlogPostNotFound() {
  return (
    <NotFoundPanel
      title="Post not found"
      body="The post you requested is not in the blog. It may have been unpublished."
      action={{ label: "Browse all posts", href: "/blog" }}
    />
  )
}
