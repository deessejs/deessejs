---
"web": patch
"@workspace/auth": patch
"@workspace/env": patch
---

Send the browser-side API calls to the deployment they belong to, and
make them reach it at all. The marketing site's Client Components built
their oRPC client from the module-level origin, which the browser bundle
cannot resolve: the Vercel env vars that `withRelatedProject` reads do not
exist there, so it fell back to the production host. A preview deployment
therefore wrote to the production API.

A preview deployment of the API is also protected by Vercel, and Vercel
answers a CORS preflight with a redirect the browser cannot follow, so the
preflight failed and the POST never left the page. The signup now goes
through a route handler on the same origin, which calls the API from the
server. The host allowlist also pointed at the Vercel team scope the
organisation used before its rename, so every current preview host was
denied.
