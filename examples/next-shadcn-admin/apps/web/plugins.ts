import { admin } from "@deessejs/admin"
import { blogAdminPages, blogPlugin } from "deesse/plugins/blog"

export const plugins = [blogPlugin(), admin({ pages: [...blogAdminPages] })] as const
