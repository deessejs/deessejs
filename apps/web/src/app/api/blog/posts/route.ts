import { NextResponse } from "next/server"
import { getAllPosts, getPostsByTag, getPostPage } from "@/lib/blog/posts"
import { isBlogTag } from "@/lib/blog/types"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get("page"))
  const tag = url.searchParams.get("tag")
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 })
  }
  if (tag && !isBlogTag(tag)) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 404 })
  }
  const result = getPostPage(
    tag
      ? getPostsByTag(tag as Parameters<typeof getPostsByTag>[0])
      : getAllPosts(),
    page
  )
  return NextResponse.json(result)
}
