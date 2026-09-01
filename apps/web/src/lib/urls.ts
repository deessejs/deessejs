// Marketing canonical URL — re-exported for ergonomic single-import usage
// at consumers that only need the marketing origin (sitemap entries, JSON-LD
// `url`/`mainEntityOfPage`, RSS feed `<link>` element, OG image bottom bar).
//
// ADR-028 forbids aliasing `APP_URL` (apps/app origin) into a marketing role;
// consumers that need the apps/app origin import `APP_URL` directly from
// `@workspace/ui/lib/config`.
export { WEB_URL } from "@workspace/ui/lib/config"