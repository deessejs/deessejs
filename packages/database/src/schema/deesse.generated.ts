import { pgTable, uuid, text, timestamp, date, jsonb, integer, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const posts = pgTable("posts", {
    id: uuid("id").defaultRandom().primaryKey(),
    "title": text("title").notNull().unique(),
    "status": text("status").notNull(),
    "publishedAt": timestamp("publishedAt", { withTimezone: true, mode: "date" }),
    "publishedOn": date("publishedOn", { mode: "string" }),
    "details": jsonb("details"),
    "views": integer("views").notNull().default(sql.raw("0")),
    "live": boolean("live").notNull().default(sql.raw("false")),
},
  (table) => [
    index("posts_status_idx").on(table["status"]),
  ])
