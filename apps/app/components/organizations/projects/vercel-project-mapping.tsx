"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { client } from "@/lib/client"

type Mapping = {
  vercelProjectId: string
  vercelProjectName: string
} | null

type VercelProject = {
  id: string
  name: string
}

export function VercelProjectMapping({
  slug,
  projectId,
  mapping,
  canManage,
}: {
  slug: string
  projectId: string
  mapping: Mapping
  canManage: boolean
}) {
  const router = useRouter()
  const [projects, setProjects] = useState<VercelProject[] | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState(
    mapping?.vercelProjectId ?? ""
  )
  const [pending, setPending] = useState(false)

  async function loadProjects() {
    setPending(true)
    try {
      const result = await client.rpc.vercel.listProjects({ slug })
      setProjects(result.projects)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load Vercel projects"
      )
    } finally {
      setPending(false)
    }
  }

  async function save(vercelProjectId: string | null) {
    setPending(true)
    try {
      await client.rpc.vercel.setMapping({ slug, projectId, vercelProjectId })
      setSelectedProjectId(vercelProjectId ?? "")
      toast.success(
        vercelProjectId ? "Vercel project linked" : "Vercel project unlinked"
      )
      setProjects(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save Vercel project mapping"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <MappingSummary mapping={mapping} />
      {canManage ? (
        <MappingControls
          mapping={mapping}
          projects={projects}
          selectedProjectId={selectedProjectId}
          pending={pending}
          onLoad={() => void loadProjects()}
          onSave={(vercelProjectId) => void save(vercelProjectId)}
          onSelect={setSelectedProjectId}
        />
      ) : null}
    </div>
  )
}

function MappingSummary({ mapping }: { mapping: Mapping }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">Vercel project</span>
      <span className="font-medium">
        {mapping?.vercelProjectName ?? "Not linked"}
      </span>
    </div>
  )
}

function MappingControls({
  mapping,
  projects,
  selectedProjectId,
  pending,
  onLoad,
  onSave,
  onSelect,
}: {
  mapping: Mapping
  projects: VercelProject[] | null
  selectedProjectId: string
  pending: boolean
  onLoad: () => void
  onSave: (vercelProjectId: string | null) => void
  onSelect: (vercelProjectId: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {projects === null ? (
        <Button variant="outline" onClick={onLoad} disabled={pending}>
          {pending ? "Loading…" : mapping ? "Change project" : "Choose project"}
        </Button>
      ) : (
        <ProjectSelect
          projects={projects}
          selectedProjectId={selectedProjectId}
          pending={pending}
          onSave={onSave}
          onSelect={onSelect}
        />
      )}
      {projects?.length === 0 ? <NoProjectsMessage /> : null}
      {mapping ? (
        <Button variant="ghost" onClick={() => onSave(null)} disabled={pending}>
          Unlink
        </Button>
      ) : null}
    </div>
  )
}

function ProjectSelect({
  projects,
  selectedProjectId,
  pending,
  onSave,
  onSelect,
}: {
  projects: VercelProject[]
  selectedProjectId: string
  pending: boolean
  onSave: (vercelProjectId: string | null) => void
  onSelect: (vercelProjectId: string) => void
}) {
  return (
    <Select
      value={selectedProjectId}
      disabled={pending}
      onValueChange={(value) => {
        onSelect(value)
        if (value) onSave(value)
      }}
    >
      <SelectTrigger aria-label="Vercel project">
        <SelectValue placeholder="Choose a Vercel project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function NoProjectsMessage() {
  return (
    <p className="text-sm text-muted-foreground">
      No Vercel projects are visible. Check this integration&apos;s project access
      in Vercel.
    </p>
  )
}
