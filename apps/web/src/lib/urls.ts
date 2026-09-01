// Marketing canonical URL — re-exported for ergonomic single-import usage
// at consumers that only need the marketing origin (sitemap entries, JSON-LD
// `url`/`mainEntityOfPage`, RSS feed `<link>` element, OG image bottom bar).
//
// ADR-028 forbids aliasing `APP_URL` (apps/app origin) into a marketing role;
// consumers that need the apps/app origin import `APP_URL` directly from
// `@/lib/app-config` in `apps/app`.
export { WEB_URL } from "@/lib/app-config"