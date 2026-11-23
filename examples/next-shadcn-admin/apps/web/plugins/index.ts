import { admin } from "@deessejs/admin"
import { postsPlugin } from "./posts.ts"

export const plugins = [admin(), postsPlugin()] as const
