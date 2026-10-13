import { redirect } from "next/navigation"

/**
 * Per-organization settings hub. The hub page is gone (RFC-001 §8):
 * any direct navigation lands on the Organization profile pane.
 */
export default async function OrganizationSettingsIndex() {
	redirect("./organization")
}
