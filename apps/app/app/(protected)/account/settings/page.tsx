import { redirect } from "next/navigation"

// The account settings hub is the entry point that lands on Profile.
// RFC-001 §8: existing user settings move to /account/settings and
// its subroutes; they are never nested under an organization slug.
export default function AccountSettingsIndex() {
	redirect("/account/settings/profile")
}
