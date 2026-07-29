import { type ReactNode } from "react"

const AuthContainerRoot = ({ children }: { children: ReactNode }) => (
	<div className="flex flex-1 flex-col justify-center gap-6">
		{children}
	</div>
)

const AuthContainerHeader = ({
	title,
	description,
	children,
}: {
	title: string
	description?: string
	children?: ReactNode
}) => (
	<div className="flex flex-col gap-1">
		<h1 className="text-2xl font-bold">{title}</h1>
		{description && (
			<p className="text-sm text-muted-foreground">{description}</p>
		)}
		{children}
	</div>
)

const AuthContainerTitle = ({ children }: { children: ReactNode }) => (
	<h1 className="text-2xl font-bold">{children}</h1>
)

const AuthContainerDescription = ({ children }: { children: ReactNode }) => (
	<p className="text-sm text-muted-foreground">{children}</p>
)

const AuthContainerContent = ({ children }: { children: ReactNode }) => (
	<>{children}</>
)

const AuthContainer = {
	Root: AuthContainerRoot,
	Header: AuthContainerHeader,
	Title: AuthContainerTitle,
	Description: AuthContainerDescription,
	Content: AuthContainerContent,
}

export { AuthContainer }
