import { orpc, type ORPCClient } from "@/lib/orpc"
import { BrowseBlocksPage } from "@/components/organizations/catalogues/browse-blocks-page"

type PublicBlock = Awaited<
  ReturnType<ORPCClient["blocks"]["list"]>
>["blocks"][number]

export default async function BrowseBlocksRoute() {
  let blocks: PublicBlock[] = []
  let error: string | null = null
  try {
    blocks = (await orpc.blocks.list()).blocks
  } catch {
    error = "Public blocks could not be loaded. Refresh this page to try again."
  }
  return <BrowseBlocksPage blocks={blocks} error={error} />
}
