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

/**
 * Onboarding organization form (ADR-030).
 *
 * Dummy schema for the placeholder page. The slug must match
 * the better-auth `organization.slug` constraint once the
 * plugin lands (lowercase, kebab-case, no leading/trailing
 * dashes, 3-32 chars). Validation is permissive here so the
 * dummy page accepts any non-empty input.
 */
export const onboardingSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	slug: z.string().min(2, "Slug must be at least 2 characters"),
})

/**
 * Slugify a free-form organization name into a URL slug.
 *
 * Mirrors the better-auth `organization.slug` constraints:
 * lowercase, kebab-case, no leading or trailing dashes. The
 * caller can still edit the slug after auto-fill; the
 * `<CreateOrganizationForm />` listens to `name` changes and
 * only fills the slug when the user has not touched it.
 */
export const slugify = (input: string): string =>
	input
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[̀-ͯ]/g, "")
		// sonarjs/slow-regex flags any `+` after a character class as
		// potentially backtracking, but `[^a-z0-9]+` has no backtracking:
		// each character either matches the negated set or does not, with
		// no overlap. The flag is a known false positive for negated
		// classes and for anchored alternations like `^-+|-+$`.
		// eslint-disable-next-line sonarjs/slow-regex
		.replace(/[^a-z0-9]+/g, "-")
		// eslint-disable-next-line sonarjs/slow-regex
		.replace(/^-+|-+$/g, "")

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
