import { NotFoundPanel } from "@/components/not-found/not-found-panel"

export default function ChangelogReleaseNotFound() {
  return (
    <NotFoundPanel
      title="Release not found"
      body="The release you requested is not in the changelog."
      action={{ label: "All releases", href: "/changelog" }}
    />
  )
}
