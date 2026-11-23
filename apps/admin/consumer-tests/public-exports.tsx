import { createDeesse, type DatabaseAdapter } from "deesse"
import { admin } from "@deessejs/admin"
import { AdminPage } from "@deessejs/admin/next"

declare const database: DatabaseAdapter

const runtime = createDeesse({
  database,
  auth: {
    baseURL: "https://example.test",
    secret: "consumer-test-secret-that-is-long-enough",
  },
  plugins: [admin()],
})

const page = <AdminPage runtime={runtime} path="/" signInPath="/login" />
void page
