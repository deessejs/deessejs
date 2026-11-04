"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { orpcBrowser } from "@/lib/orpc-browser"

export function OrganizationBlocksPage({ organizationSlug, blocks, canManage, error }: { organizationSlug: string; blocks: Array<{ id: string; slug: string; name: string; reviewStatus: string; sourceCommit: string }>; canManage: boolean; error: string | null }) {
  const router = useRouter()
  const [repo, setRepo] = useState(""); const [slug, setSlug] = useState(""); const [name, setName] = useState(""); const [category, setCategory] = useState("integration"); const [message, setMessage] = useState("")
  async function importBlock(event: React.FormEvent) { event.preventDefault(); setMessage(""); try { await orpcBrowser.organization.blocks.create({ organizationSlug, slug, name, category, repositoryUrl: repo, subdirectory: "", description: "" }); setMessage("Imported privately."); router.refresh() } catch { setMessage("Import failed. Check the GitHub repository and deesse-block.json.") } }
  async function submit(id: string) { try { await orpcBrowser.organization.blocks.submit({ organizationSlug, blockId: id, ref: "HEAD" }); router.refresh() } catch { setMessage("Submission failed. Try again.") } }
  return <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6"><header><h1 className="text-3xl font-bold">Blocks</h1><p className="text-muted-foreground">Private capability blocks owned by this organization.</p></header>{error && <p role="alert">{error}</p>}{canManage && <form onSubmit={importBlock} className="flex flex-wrap gap-3"><Input required placeholder="GitHub repository URL" value={repo} onChange={e=>setRepo(e.target.value)} /><Input required placeholder="Block slug" value={slug} onChange={e=>setSlug(e.target.value)} /><Input required placeholder="Name" value={name} onChange={e=>setName(e.target.value)} /><Input required placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} /><Button>Import block</Button></form>}{message && <p role="status">{message}</p>}{blocks.length ? <ul className="divide-y">{blocks.map(block=><li key={block.id} className="flex items-center justify-between py-4"><div><h2 className="font-semibold">{block.name}</h2><p className="text-sm text-muted-foreground">{block.slug} · {block.reviewStatus} · {block.sourceCommit.slice(0,7)}</p></div>{canManage && block.reviewStatus !== "pending" && <Button variant="outline" onClick={()=>void submit(block.id)}>Submit revision</Button>}</li>)}</ul> : <p>No blocks yet. Import a GitHub repository containing deesse-block.json.</p>}</main>
}
