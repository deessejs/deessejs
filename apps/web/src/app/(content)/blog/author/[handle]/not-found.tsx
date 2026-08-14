import { NotFoundPanel } from "@/components/not-found/not-found-panel"

export default function BlogAuthorNotFound() {
  return (
    <NotFoundPanel
      title="Author not found"
      body="We couldn't find an author with that handle."
      action={{ label: "Browse all posts", href: "/blog" }}
    />
  )
}
