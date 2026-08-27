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
        // Code blocks — the pre element carries the outer chrome
        // (border + bg + scroll + padding). rehype-pretty-code emits
        // <pre><code><span>…</span><span>…</span></code></pre> with
        // no classes on the line spans, so we cannot target them via
        // [data-line]. All padding lives on the pre itself, plus a
        // tiny inner padding on the code so the first/last line has
        // breathing room before the border.
        "[&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-muted/30 [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:p-4 [&_pre]:text-copy-14 [&_pre]:font-mono",
        "[&_pre_code]:block [&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_pre_code]:py-0",
        // Forward-compatible selectors. rehype-pretty-code only emits
        // [data-highlighted-line] / [data-highlighted-chars] when
        // the matching shiki transformers are added to safe-readme's
        // options (transformerNotationFocus / transformerNotationDiff).
        // They are not enabled today; the selectors activate as soon
        // as a contributor adds the plugin.
        "[&_[data-highlighted-line]]:bg-foreground/5 [&_[data-highlighted-line]]:relative",
        "[&_[data-highlighted-chars]]:bg-foreground/10 [&_[data-highlighted-chars]]:rounded",
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
