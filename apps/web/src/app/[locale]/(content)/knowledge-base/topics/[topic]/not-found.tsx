import { NotFoundPanel } from "@/components/not-found/not-found-panel"

export default function KnowledgeBaseTopicNotFound() {
  return (
    <NotFoundPanel
      title="Topic not found"
      body="This topic isn't in the knowledge base yet."
      action={{ label: "All topics", href: "/knowledge-base" }}
    />
  )
}
