"use client"

import { useState, useTransition } from "react"
import { Button } from "@workspace/ui/components/button"
import { SettingsCard } from "./settings-card"
import {
	changeMemberRole,
	removeMember,
} from "@/lib/organization-members"

interface MemberRow {
	id: string
	userId: string
	role: string
	createdAt: string
	name: string
	email: string
}

interface MembersTableProps {
	organizationId: string
	organizationSlug: string
	canManageAll: boolean
	currentUserId: string
	members: MemberRow[]
}

/**
 * Per-organization members table. Owners can change anyone's
 * role; admins can change members but not other owners. The
 * "remove" button is hidden for the current user (you can't
 * remove yourself from a page) and for any owner if the
 * caller is not an owner.
 */
export function MembersTable({
	organizationSlug,
	canManageAll,
	currentUserId,
	members,
}: MembersTableProps) {
	const [rows, setRows] = useState<MemberRow[]>(members)
	const [error, setError] = useState<string | null>(null)
	const [pending, startTransition] = useTransition()
	const [removingId, setRemovingId] = useState<string | null>(null)

	function onRoleChange(memberId: string, newRole: string) {
		setError(null)
		startTransition(async () => {
			const result = await changeMemberRole({
				organizationSlug,
				memberId,
				newRole,
			})
			if (!result.ok) {
				setError(result.error)
				return
			}
			setRows((prev) =>
				prev.map((m) =>
					m.id === memberId ? { ...m, role: newRole } : m,
				),
			)
		})
	}

	function onRemove(memberId: string) {
		setError(null)
		setRemovingId(memberId)
		void (async () => {
			const result = await removeMember({
				organizationSlug,
				memberId,
			})
			setRemovingId(null)
			if (!result.ok) {
				setError(result.error)
				return
			}
			setRows((prev) => prev.filter((m) => m.id !== memberId))
		})()
	}

	return (
		<SettingsCard
			title="Members"
			description="Each row shows the user's display name, email, role, and join date."
		>
			{rows.length === 0 ? (
				<p className="text-sm text-muted-foreground">No members.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{rows.map((m) => {
						const isSelf = m.userId === currentUserId
						const isOwner = m.role.includes("owner")
						const canChangeRole =
							canManageAll ||
							(!isOwner && m.role !== "owner")
						const canRemove =
							!isSelf && (canManageAll || !isOwner)
						return (
							<li
								key={m.id}
								className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
							>
								<div className="flex flex-col">
									<span className="font-medium">
										{m.name}
										{isSelf ? " (you)" : ""}
									</span>
									<span className="text-xs text-muted-foreground">
										{m.email}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<select
										value={m.role}
										onChange={(e) =>
											onRoleChange(m.id, e.target.value)
										}
										disabled={!canChangeRole || pending}
										className="rounded-md border border-input bg-background px-2 py-1 text-sm"
									>
										<option value="member">Member</option>
										<option value="admin">Admin</option>
										<option value="owner">Owner</option>
									</select>
									<Button
										variant="outline"
										size="sm"
										onClick={() => onRemove(m.id)}
										disabled={!canRemove || removingId === m.id}
									>
										{removingId === m.id
											? "Removing…"
											: "Remove"}
									</Button>
								</div>
							</li>
						)
					})}
				</ul>
			)}
			{error && (
				<p className="mt-2 text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
		</SettingsCard>
	)
}
