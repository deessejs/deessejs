import type { ComponentType } from "react"
import { BlogAdminPage } from "./blog-admin-page.js"

export const blogAdminPages = [
  { path: "blog", title: "Blog", component: BlogAdminPage as ComponentType },
] as const
