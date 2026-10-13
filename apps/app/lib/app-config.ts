// apps/app configuration. Local to `apps/app` — does not live in
// `@workspace/ui` (UI primitives stay pure) nor in `@workspace/env`
// (env stays narrow and Zod-validated).
//
// URL values come from `@workspace/env/client` via the ergonomic
// helpers (`webURL()`, `appURL()`) so the role-to-env-var mapping is
// single-sourced. `apps/app` self-references via `appURL()` and
// links back to marketing via `webURL()`.
//
// RFC-001 §8: `home` and `settings` were the previous flat
// navigation entries; the new per-organization chrome scopes
// every page under `/[organization_slug]/*`. The flat links are
// kept as legacy redirects (handled by the page-level Server
// Components), but the canonical references in the chrome are
// the helper functions `orgHome(slug)` and `orgSettings(slug)`.

import { appURL, webURL } from "@workspace/env/client"

export const APP_CONFIG = {
	name: "DeesseJS",
	description:
		"SaaS application built with Next.js and shared UI components",
	appURL: appURL(),
	webURL: webURL(),
	links: {
		login: "/login",
		signup: "/signup",
		device: "/device",
	},
} as const

export const APP_NAME = APP_CONFIG.name
export const APP_URL = APP_CONFIG.appURL
export const WEB_URL = APP_CONFIG.webURL

/**
 * Per-organization home helper. The route is
 * `/[organization_slug]/home` (RFC-001 §8).
 */
export function orgHome(organizationSlug: string): string {
	return `/${organizationSlug}/home`
}

/**
 * Per-organization settings hub. The hub page itself redirects to
 * the Organization profile pane; consumers should link directly
 * to the leaf for the section they want.
 */
export function orgSettings(organizationSlug: string): string {
	return `/${organizationSlug}/settings/organization`
}

/**
 * Account-scoped settings hub. Lives under `/account/settings/*`
 * and is never nested under an organization slug (RFC-001 §8).
 */
export const accountSettings = {
	root: "/account/settings",
	profile: "/account/settings/profile",
	sessions: "/account/settings/sessions",
	connections: "/account/settings/connections",
	account: "/account/settings/account",
} as const

export type AppConfig = typeof APP_CONFIG
