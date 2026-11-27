import { admin } from "deesse/plugins/admin"
import { blogPlugin } from "deesse/plugins/blog"
import { blogAdminPages } from "deesse/plugins/blog/admin"

export const plugins = [blogPlugin(), admin({ pages: [...blogAdminPages] })] as const
