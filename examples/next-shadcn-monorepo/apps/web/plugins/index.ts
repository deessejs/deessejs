import { postsPlugin } from "./posts.ts"

export const plugins = [postsPlugin()] as const
