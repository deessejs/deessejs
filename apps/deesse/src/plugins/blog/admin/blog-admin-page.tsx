"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { createClient, deesseServer } from "../../../react.js"
import type { blogRouter } from "../api.js"

type BlogServer = {
  readonly api: { readonly router: { readonly blog: typeof blogRouter } }
}

const client = createClient({ server: deesseServer<BlogServer>() })
const PAGE_SIZE = 50
type BlogListPage = Awaited<ReturnType<typeof client.api.blog.management.list>>
type BlogPost = BlogListPage["posts"][number]
type PostDraft = { title: string; slug: string; excerpt: string; content: string }
const emptyDraft: PostDraft = { title: "", slug: "", excerpt: "", content: "" }

export function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [draft, setDraft] = useState<PostDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [message, setMessage] = useState("Loading posts…")
  const [busy, setBusy] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [offset, setOffset] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)

  const loadPosts = useCallback(async (requestedOffset = 0) => {
    setLoadingPosts(true)
    try {
      const page = await client.api.blog.management.list({ limit: PAGE_SIZE, offset: requestedOffset })
      setPosts(page.posts)
      setOffset(page.offset)
      setNextOffset(page.nextOffset)
      setMessage(`${page.posts.length} post${page.posts.length === 1 ? "" : "s"} on page ${Math.floor(page.offset / PAGE_SIZE) + 1}.`)
    } catch {
      setMessage("Could not load posts. Check the database migration and your administrator access.")
    } finally {
      setLoadingPosts(false)
    }
  }, [])

  useEffect(() => {
    loadPosts(0).then(() => undefined, () => undefined)
  }, [loadPosts])

  function beginEdit(post: BlogPost) {
    setEditingId(post.id)
    setDraft({ title: post.title, slug: post.slug, excerpt: post.excerpt ?? "", content: post.content })
  }

  function resetForm() {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const input = {
        title: draft.title,
        ...(draft.slug.trim() ? { slug: draft.slug } : {}),
        excerpt: draft.excerpt.trim() || null,
        content: draft.content,
      }
      if (editingId) await client.api.blog.management.update({ id: editingId, ...input })
      else await client.api.blog.management.create(input)
      resetForm()
      setMessage("Post saved.")
      await loadPosts(0)
    } catch {
      setMessage("Could not save the post. Check the fields and whether the slug is already in use.")
    } finally {
      setBusy(false)
    }
  }

  async function changePublication(post: BlogPost) {
    try {
      if (post.status === "published") await client.api.blog.management.unpublish({ id: post.id })
      else await client.api.blog.management.publish({ id: post.id })
      await loadPosts(0)
    } catch {
      setMessage("Could not update the post publication status.")
    }
  }

  async function removePost(post: BlogPost) {
    if (pendingDelete !== post.id) {
      setPendingDelete(post.id)
      return
    }
    try {
      await client.api.blog.management.delete({ id: post.id })
      if (editingId === post.id) resetForm()
      setPendingDelete(null)
      await loadPosts(0)
    } catch {
      setMessage("Could not delete the post.")
    }
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-4" aria-labelledby="blog-posts-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="blog-posts-heading" className="text-lg font-semibold">Posts</h2>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={resetForm} type="button">New post</button>
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40"><tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {posts.map((post) => (
                <tr className="border-b last:border-0" key={post.id}>
                  <td className="p-3"><span className="font-medium">{post.title}</span><span className="block text-muted-foreground">/{post.slug}</span></td>
                  <td className="p-3">{post.status}</td>
                  <td className="p-3">{new Date(String(post.updatedAt)).toLocaleDateString("en-GB", { timeZone: "UTC" })}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-2">
                    <button className="underline" onClick={() => beginEdit(post)} type="button">Edit</button>
                    <button className="underline" onClick={() => void changePublication(post)} type="button">{post.status === "published" ? "Unpublish" : "Publish"}</button>
                    {pendingDelete === post.id ? <>
                      <span>Delete permanently?</span>
                      <button className="underline" onClick={() => void removePost(post)} type="button">Confirm</button>
                      <button className="underline" onClick={() => setPendingDelete(null)} type="button">Cancel</button>
                    </> : <button className="underline" onClick={() => void removePost(post)} type="button">Delete</button>}
                  </div></td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td className="p-4 text-muted-foreground" colSpan={4}>{offset === 0 ? "No posts yet." : "No posts on this page."}</td></tr>}
            </tbody>
          </table>
        </div>
        <nav className="flex items-center justify-end gap-3" aria-label="Post list pagination">
          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            disabled={loadingPosts || offset === 0}
            onClick={() => loadPosts(Math.max(0, offset - PAGE_SIZE)).then(() => undefined, () => undefined)}
            type="button"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            disabled={loadingPosts || nextOffset === null}
            onClick={() => { if (nextOffset !== null) loadPosts(nextOffset).then(() => undefined, () => undefined) }}
            type="button"
          >
            Next
          </button>
        </nav>
      </section>

      <section className="grid gap-4" aria-labelledby="blog-editor-heading">
        <h2 id="blog-editor-heading" className="text-lg font-semibold">{editingId ? "Edit post" : "Create post"}</h2>
        <form className="grid max-w-3xl gap-4" onSubmit={savePost}>
          <label className="grid gap-2 text-sm">Title<input className="rounded-md border bg-background px-3 py-2" maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required value={draft.title} /></label>
          <label className="grid gap-2 text-sm">Slug<input className="rounded-md border bg-background px-3 py-2" maxLength={160} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="Generated from title when empty" value={draft.slug} /></label>
          <label className="grid gap-2 text-sm">Excerpt<input className="rounded-md border bg-background px-3 py-2" maxLength={280} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} value={draft.excerpt} /></label>
          <label className="grid gap-2 text-sm">Markdown content<textarea className="min-h-72 rounded-md border bg-background px-3 py-2 font-mono" maxLength={100_000} onChange={(event) => setDraft({ ...draft, content: event.target.value })} required value={draft.content} /></label>
          <div className="flex gap-3">
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" disabled={busy} type="submit">{busy ? "Saving…" : "Save draft"}</button>
            {editingId && <button className="rounded-md border px-4 py-2" onClick={resetForm} type="button">Cancel</button>}
          </div>
        </form>
      </section>
    </div>
  )
}
