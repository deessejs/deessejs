import type { ComponentProps } from "react"

export function Prose({ children, className, ...rest }: ComponentProps<"article">) {
  return (
    <article
      className={[
        "text-base leading-7 text-pretty",
        "[&_h1]:text-3xl [&_h1]:sm:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-balance [&_h1]:mt-0 [&_h1]:mb-6",
        "[&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-2 [&_h2]:scroll-mt-20",
        "[&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:scroll-mt-20",
        "[&_p]:my-4 [&_p]:text-pretty",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:text-foreground/90",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1",
        "[&_code]:break-words [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_code]:text-foreground",
        "[&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4",
        "[&_pre_code]:break-normal [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_a]:break-words [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-foreground/30 hover:[&_a]:decoration-foreground",
        "[&_img]:rounded-lg [&_img]:border [&_img]:border-border/40 [&_img]:my-4",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
        "[&_hr]:border-border/40 [&_hr]:my-8",
        // GFM tables — react-markdown emits raw <table>/<th>/<td> with no
        // classes, so without these selectors the browser-default 1990s
        // table look takes over. Mirrors the hand-written table in
        // apps/web/src/app/(marketing)/pricing/page.tsx (the canonical
        // table styling on this site). Header row uses a full-opacity
        // border; body rows use 60% so the header reads as the
        // visual anchor. align-bottom on <th> / align-top on <td>
        // keeps multi-line cells visually rooted.
        "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-copy-14",
        "[&_thead_tr]:border-b [&_thead_tr]:border-border",
        "[&_th]:py-3 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:align-bottom",
        "[&_tbody_tr]:border-b [&_tbody_tr]:border-border/60",
        "[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_td]:text-muted-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </article>
  )
}
