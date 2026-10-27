import type { Author } from "@/lib/blog/types"

export function AuthorBio({
  authors,
  author,
}: {
  authors?: Author[]
  author?: Author
}) {
  // Hidden: the article page already shows the author via <PostMeta>
  // (date + author handle + reading time + tags) in the page header.
  // The "Written by" card below the body duplicates that information.
  // The component, the import, and the export all stay in place so
  // uncommenting this guard reactives the block for any future caller
  // that genuinely needs a longer-form bio card.
  void authors
  void author
  return null
}
