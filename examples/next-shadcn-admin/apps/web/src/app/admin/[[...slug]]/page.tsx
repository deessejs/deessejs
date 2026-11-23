import { AdminPage } from "@deessejs/admin/next"
import { adminConfig, deesse } from "@deesse-config"

export default async function AdminRoute({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  return <AdminPage runtime={deesse} config={adminConfig} path={slug?.join("/") ?? "/"} signInPath="/" />
}
