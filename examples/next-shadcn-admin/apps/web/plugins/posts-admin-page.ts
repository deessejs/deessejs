import { createElement } from "react"

export function PostsAdminPage() {
  return createElement(
    "div",
    { className: "grid max-w-2xl gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm" },
    createElement("p", { className: "text-sm font-medium text-muted-foreground" }, "Content"),
    createElement("h2", { className: "text-xl font-semibold tracking-tight" }, "Posts administration"),
    createElement(
      "p",
      { className: "text-sm leading-6 text-muted-foreground" },
      "This page was statically registered by the posts plugin in the Deesse runtime.",
    ),
  )
}
