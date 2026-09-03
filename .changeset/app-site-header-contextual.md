---
"app": minor
---

Surface the signed-in user inside `SiteHeader`. Previously the
header showed Login/Sign up buttons on every page under
`(unprotected)`, including the onboarding wizard where the user
is already authenticated. The header now reads the active session
through `authClient.useSession()` and swaps the right-hand buttons
for an avatar dropdown with Dashboard, Settings, and Sign out.
