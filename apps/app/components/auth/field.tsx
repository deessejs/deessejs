import type { ReactNode } from "react"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "./password-input"

type FieldProps = {
	// Loose typing — all auth forms use string-only fields, so this is safe.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	form: any
	name: string
	label: string
	type?: "text" | "email"
	autoComplete?: string
	autoFocus?: boolean
}

export function Field({ form, name, label, type = "text", autoComplete, autoFocus }: FieldProps) {
	return (
		<form.Field name={name}>
			{
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(field: any) => (
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
						{field.state.meta.errors.map(
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							(err: any) => (
								<p key={err?.message} className="text-sm text-destructive" role="alert">
									{err?.message}
								</p>
							),
						)}
					</div>
				)
			}
		</form.Field>
	)
}

type PasswordFieldProps = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	form: any
	name: string
	label: string
	autoComplete?: string
	labelAside?: ReactNode
	children?: (value: string) => ReactNode
}

export function PasswordField({ form, name, label, autoComplete, labelAside, children }: PasswordFieldProps) {
	return (
		<form.Field name={name}>
			{
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(field: any) => (
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
						{field.state.meta.errors.map(
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							(err: any) => (
								<p key={err?.message} className="text-sm text-destructive" role="alert">
									{err?.message}
								</p>
							),
						)}
					</div>
				)
			}
		</form.Field>
	)
}