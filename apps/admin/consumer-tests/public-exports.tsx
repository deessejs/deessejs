import { createDeesse, type DatabaseAdapter } from "deesse"
import { admin } from "@deessejs/admin"
import { AdminPage } from "@deessejs/admin/next"

declare const database: DatabaseAdapter

const adminConfig = admin()
const runtime = createDeesse({
  database,
  auth: {
    baseURL: "https://example.test",
    secret: "consumer-test-secret-that-is-long-enough",
  },
  plugins: [adminConfig.plugin],
})

const page = <AdminPage runtime={runtime} config={adminConfig} path="/" signInPath="/login" />
void page
