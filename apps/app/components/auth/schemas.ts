import { z } from "zod"

export const loginSchema = z.object({
	email: z.email("Enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	remember: z.boolean().optional(),
})

export const signupSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.email("Enter a valid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})

export const forgotPasswordSchema = z.object({
	email: z.email("Enter a valid email address"),
})

export const resetPasswordSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})

/**
 * Device-flow user code (ADR-020). The Better Auth device
 * authorization plugin issues 8-character codes drawn from a
 * 32-symbol base32 alphabet that excludes I, O, 0, 1 to avoid
 * visual ambiguity (RFC 4648 base32 sans ambiguities). The
 * page validates the URL `user_code` query param against this
 * schema before rendering the claim panel; an invalid or
 * missing code is treated as the same case as an expired
 * code (the user sees the "Expired" panel and runs
 * `deesse auth login` again).
 */
export const userCodeSchema = z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/, {
	message:
		"Invalid device code format. Run `deesse auth login` again to get a new code.",
})
