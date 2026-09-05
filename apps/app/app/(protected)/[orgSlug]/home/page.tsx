import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"

type Params = Promise<{ orgSlug: string }>

/**
 * Per-organization home page (ADR-030 §"Decision #5"). The slug is
 * rendered as a placeholder; real org-scoped data lands in PR #4 of
 * ADR-030 alongside the better-auth organization plugin. The session
 * gate is defensive — the proxy also enforces auth on the segment.
 */
export default async function OrgHomePage({ params }: { params: Params }) {
	const { orgSlug } = await params

	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-2xl font-bold">Home</h1>
			<p className="text-muted-foreground">
				Welcome back to <span className="font-mono">{orgSlug}</span>.
			</p>
		</div>
	)
}