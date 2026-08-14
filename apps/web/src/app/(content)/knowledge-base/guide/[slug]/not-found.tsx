import { NotFoundPanel } from "@/components/not-found/not-found-panel"

export default function KnowledgeBaseGuideNotFound() {
  return (
    <NotFoundPanel
      title="Guide not found"
      body="The guide you requested isn't in the knowledge base."
      action={{ label: "All topics", href: "/knowledge-base" }}
    />
  )
}
