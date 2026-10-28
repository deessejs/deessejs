# Storybook app conventions

- This app documents only shared primitives exported from `packages/ui`.
- Keep component examples in `stories/components/<component>.stories.tsx` and keep storybook-specific presentation here rather than adding catalogue files to the UI package.
- `api/mcp.ts` is the public remote MCP endpoint. Keep it unauthenticated and restrict it to Storybook's documentation tools and generated manifests.
- Keep the `Mode` toolbar synchronized with the `.dark` class used by `packages/ui` design tokens.
- Vercel preview selection requires the `VERCEL_STORYBOOK_PROJECT_ID` Actions variable after the Vercel project has been created and linked to `apps/storybook`.
