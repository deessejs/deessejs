import type { ComponentProps } from "react"

export function Prose({ children, className, ...rest }: ComponentProps<"article">) {
  return (
    <article
      className={[
        "text-base leading-7 text-pretty",
        "[&_h1]:text-3xl [&_h1]:sm:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-balance [&_h1]:mt-0 [&_h1]:mb-6",
        "[&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-2",
        "[&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-semibold [&_h3]:tracking-tight",
        "[&_p]:my-4 [&_p]:text-pretty",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:text-foreground/90",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_code]:text-foreground",
        "[&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-foreground/30 hover:[&_a]:decoration-foreground",
        "[&_img]:rounded-lg [&_img]:border [&_img]:border-border/40 [&_img]:my-4",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
        "[&_hr]:border-border/40 [&_hr]:my-8",
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
