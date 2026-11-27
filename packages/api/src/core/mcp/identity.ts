import { eq } from "drizzle-orm"
import { db, user } from "@workspace/database"

/** Resolves a verified OAuth subject to a user that still exists in DeesseJS. */
export async function resolveMcpUserId(
  subject: string | null
): Promise<string | null> {
  if (!subject) return null
  const [currentUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, subject))
    .limit(1)
  return currentUser?.id ?? null
}
