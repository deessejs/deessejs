import type { ReactNode } from "react"

interface SettingsPageProps {
	title: string
	description: string
	children: ReactNode
}

export function SettingsPage({ title, description, children }: SettingsPageProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			{children}
		</div>
	)
}