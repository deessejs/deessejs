import { createDeesse, type DatabaseAdapter } from "deesse"
import { admin } from "deesse/plugins/admin"
import { AdminPage } from "deesse/plugins/admin/next"
import { blogAdminPages } from "deesse/plugins/blog/admin"
import { blogPlugin } from "deesse/plugins/blog"

declare const database: DatabaseAdapter

const adminPlugin = admin({ pages: [...blogAdminPages] })
const runtime = createDeesse({
  database,
  auth: {
    baseURL: "https://example.test",
    secret: "consumer-test-secret-that-is-long-enough",
  },
  plugins: [blogPlugin(), adminPlugin],
})

const page = <AdminPage runtime={runtime} path="/" signInPath="/login" />
void page
