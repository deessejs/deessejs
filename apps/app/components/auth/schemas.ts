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
