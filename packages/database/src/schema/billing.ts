import { index, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { organization } from "./auth.js"

/** Last verified Stripe subscription snapshot for an organization. */
export const organizationSubscription = pgTable("organization_subscription", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("organization_subscription_org_idx").on(table.organizationId)])
