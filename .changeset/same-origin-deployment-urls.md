---
"app": patch
"web": patch
"@workspace/auth": patch
---

Resolve browser authentication against the active app origin and use the
deployment-specific Vercel host for server-side app API calls. Route the
pricing signup CTA through the related-project resolver and align the
Vercel host allowlist with the current project domain suffix.
