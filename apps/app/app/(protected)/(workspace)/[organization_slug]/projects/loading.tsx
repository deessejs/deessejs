import { PageSkeleton } from "@/components/loading/page-skeleton"

export default function ProjectsLoading() {
  return <PageSkeleton label="Loading projects" variant="cards" count={3} />
}
