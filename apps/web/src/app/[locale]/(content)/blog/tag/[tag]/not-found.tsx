import { NotFoundPanel } from "@/components/not-found/not-found-panel"

export default function BlogTagNotFound() {
  return (
    <NotFoundPanel
      title="No posts tagged"
      body="No blog posts match this tag."
      action={{ label: "Browse all posts", href: "/blog" }}
    />
  )
}
