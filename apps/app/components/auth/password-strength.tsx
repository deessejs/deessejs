type StrengthLevel = 0 | 1 | 2 | 3 | 4

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const
const STRENGTH_COLORS = [
	"bg-muted",
	"bg-destructive",
	"bg-yellow-500",
	"bg-blue-500",
	"bg-green-500",
] as const satisfies Array<string>

function getPasswordStrength(password: string): StrengthLevel {
	if (!password) return 0
	let score = 0
	if (password.length >= 8) score++
	if (password.length >= 12) score++
	if (/[a-z]/.test(password)) score++
	if (/[A-Z]/.test(password)) score++
	if (/[0-9]/.test(password)) score++
	if (/[^a-zA-Z0-9]/.test(password)) score++
	return Math.min(score, 4) as StrengthLevel
}

export function PasswordStrength({ password }: { password: string }) {
	const strength = getPasswordStrength(password)
	if (!password) return null

	return (
		<div className="flex flex-col gap-1">
			<div className="flex gap-1">
				{[1, 2, 3, 4].map((level) => (
					<div
						key={level}
						className={`h-1 flex-1 rounded-full transition-colors ${
							strength >= level ? STRENGTH_COLORS[strength] : "bg-muted"
						}`}
					/>
				))}
			</div>
			<p
				className={`text-xs ${
					strength <= 1
						? "text-destructive"
						: strength <= 2
							? "text-yellow-600 dark:text-yellow-400"
							: "text-green-600 dark:text-green-400"
				}`}
			>
				{STRENGTH_LABELS[strength]}
			</p>
		</div>
	)
}