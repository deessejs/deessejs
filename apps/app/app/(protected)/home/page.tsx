import { redirect } from "next/navigation"

/**
 * Legacy /home. RFC-001 §8: bare /home is not a workspace screen
 * anymore. The root page (`app/page.tsx`) routes the user to their
 * default organization home. Bookmarks to /home land on the root,
 * which then sends them to the right place.
 */
export default function LegacyHomePage() {
	redirect("/")
}
