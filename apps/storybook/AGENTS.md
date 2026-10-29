# Storybook app conventions

- This app documents shared primitives exported from `packages/ui` and selected page sections from `apps/web`.
- Keep primitive examples in `stories/components/<component>.stories.tsx` and page-section examples under `stories/web/<area>/<page>/<section>.stories.tsx`. Add page-section stories for active, self-contained sections that can render without server data or app-level runtime behavior.
- Keep Storybook-specific presentation here rather than adding catalogue files to the UI package or changing the production page components just to support stories.
- The `@` Vite and TypeScript aliases point to `apps/web/src` for page-section stories. Prefer sections that do not require additional aliases, framework shims, or application providers.
- `api/mcp.ts` is the public remote MCP endpoint. Keep it unauthenticated and restrict it to Storybook's documentation tools and generated manifests.
- Keep the `Mode` toolbar synchronized with the `.dark` class used by `packages/ui` design tokens.
- Vercel preview selection requires the `VERCEL_STORYBOOK_PROJECT_ID` Actions variable after the Vercel project has been created and linked to `apps/storybook`.
