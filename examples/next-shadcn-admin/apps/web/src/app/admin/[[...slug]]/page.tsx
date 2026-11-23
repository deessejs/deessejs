import { AdminPage } from "@deessejs/admin/next"
import { deesse } from "@deesse-config"

export default async function AdminRoute({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  return <AdminPage runtime={deesse} path={slug?.join("/") ?? "/"} signInPath="/" />
}
