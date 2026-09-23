import { redirect } from "next/navigation"

// The settings hub was removed in ADR-030: the tabs row in the
// authenticated chrome replaces it. Any link or bookmark to /settings
// lands on the Profile tab.
export default function SettingsIndex() {
  redirect("/settings/profile")
}
