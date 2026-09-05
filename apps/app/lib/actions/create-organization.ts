"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"

import { onboardingSchema } from "@/components/auth/schemas"

type CreateOrganizationInput = {
	name: string
	slug: string
	/**
	 * Where to send the user after the org is created.
	 *
	 * Pass a string with the literal token "{slug}" to redirect
	 * to the newly-created workspace's home
	 * (e.g. "/{slug}/home"). The server action substitutes the
	 * real slug at redirect time.
	 *
	 * Any other string is treated as a literal redirect target.
	 * Defaults to "/onboarding/complete".
	 */
	next?: string
}

/**
 * Shared server action that creates an organization via the
 * better-auth organization plugin.
 *
 * Why a server action instead of authClient.organization.createOrganization:
 * the client wrapper hits /organization/create-organization (long
 * path) on the wire, but better-auth 1.7.2 registers the route at
 * /organization/create (short path). The server-side
 * `auth.api.createOrganization` call resolves the matching typed
 * endpoint directly, so there is no path mismatch.
 *
 * Validates inputs against `onboardingSchema` so the contract stays
 * consistent with the form-side Zod schema.
 */
export async function createOrganization({
	name,
	slug,
	next,
}: CreateOrganizationInput): Promise<void> {
	const parsed = onboardingSchema.safeParse({ name, slug })
	if (!parsed.success) {
		const first = parsed.error.issues[0]
		redirect(
			`/onboarding/organization?error=${encodeURIComponent(first?.message ?? "invalid")}`,
		)
	}

	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	try {
		const created = await auth.api.createOrganization({
			body: { name: parsed.data.name, slug: parsed.data.slug },
			headers: await headers(),
		})

		// Switch the active org to the newly created workspace so
		// the next request lands on its dashboard, not on whichever
		// org was previously active.
		const createdId = (created as { id?: string } | null)?.id
		if (createdId) {
			await auth.api.setActiveOrganization({
				body: { organizationId: createdId },
				headers: await headers(),
			})
		}

		// Resolve the redirect target. "{slug}" tokens are
		// substituted with the real workspace slug.
		const target = (next ?? "/onboarding/complete").replace(
			"{slug}",
			parsed.data.slug,
		)
		redirect(target)
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not create workspace"
		redirect(
			`/onboarding/organization?error=${encodeURIComponent(message)}`,
		)
	}
}
