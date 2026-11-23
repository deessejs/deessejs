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
  const [projects, setProjects] = useState<Array<{
    id: string
    name: string
  }> | null>(null)
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
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Vercel project</span>
        <span className="font-medium">
          {mapping?.vercelProjectName ?? "Not linked"}
        </span>
      </div>
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2">
          {projects === null ? (
            <Button variant="outline" onClick={loadProjects} disabled={pending}>
              {pending
                ? "Loading…"
                : mapping
                  ? "Change project"
                  : "Choose project"}
            </Button>
          ) : (
            <Select
              value={selectedProjectId}
              disabled={pending}
              onValueChange={(value) => {
                setSelectedProjectId(value)
                if (value) save(value)
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
          )}
          {projects?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Vercel projects are visible. Check this integration&apos;s
              project access in Vercel.
            </p>
          ) : null}
          {mapping ? (
            <Button
              variant="ghost"
              onClick={() => save(null)}
              disabled={pending}
            >
              Unlink
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
