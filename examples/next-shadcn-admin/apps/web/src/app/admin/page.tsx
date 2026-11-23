import { AdminPage } from "@deessejs/admin/next"
import { deesse } from "@deesse-config"

export default function AdminRootPage() {
  return <AdminPage runtime={deesse} signInPath="/" />
}
