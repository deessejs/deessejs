import { PageSkeleton } from "@/components/loading/page-skeleton"

export default function ProjectImportLoading() {
  return (
    <PageSkeleton label="Loading project import" variant="table" count={5} />
  )
}
