import type { ReactNode } from "react"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "./password-input"

type AuthField = {
	name: string
	state: {
		value: string
		meta: { errors: readonly unknown[] }
	}
	handleChange: (value: string) => void
}

function validationErrorMessage(error: unknown): string | undefined {
	if (typeof error !== "object" || error === null || !("message" in error)) {
		return undefined
	}

	return typeof error.message === "string" ? error.message : undefined
}

type FieldProps = {
	field: AuthField
	label: string
	type?: "text" | "email"
	autoComplete?: string
	autoFocus?: boolean
}

export function Field({
	field,
	label,
	type = "text",
	autoComplete,
	autoFocus,
}: FieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<label htmlFor={field.name} className="text-sm font-medium">
				{label}
			</label>
			<Input
				id={field.name}
				name={field.name}
				type={type}
				autoComplete={autoComplete}
				autoFocus={autoFocus}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={!!field.state.meta.errors.length}
			/>
			{field.state.meta.errors.map((error) => {
				const message = validationErrorMessage(error)
				return message ? (
					<p key={message} className="text-sm text-destructive" role="alert">
						{message}
					</p>
				) : null
			})}
		</div>
	)
}

type PasswordFieldProps = {
	field: AuthField
	label: string
	autoComplete?: string
	labelAside?: ReactNode
	children?: (value: string) => ReactNode
}

export function PasswordField({
	field,
	label,
	autoComplete,
	labelAside,
	children,
}: PasswordFieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<label htmlFor={field.name} className="text-sm font-medium">
					{label}
				</label>
				{labelAside}
			</div>
			<PasswordInput
				id={field.name}
				name={field.name}
				autoComplete={autoComplete}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				error={!!field.state.meta.errors.length}
			/>
			{children?.(field.state.value)}
			{field.state.meta.errors.map((error) => {
				const message = validationErrorMessage(error)
				return message ? (
					<p key={message} className="text-sm text-destructive" role="alert">
						{message}
					</p>
				) : null
			})}
		</div>
	)
}
