# packages/cookies

You own the cookie consent: the banner, the preferences panel, the stored decision and the policy page that explains it. A visitor has to be able to change their mind at any time.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/store/cookie-consent.ts` | The Zustand store, persisted in the browser. |
| `src/types.ts` | The consent shape and the store contract. |
| `src/components/consent-script.tsx` | The script that applies the decision before the first paint. |
| `src/components/cookie-consent.tsx` | The banner. |
| `src/components/preferences-button.tsx` | The entry point to the preferences, for a visitor who already decided. |
| `src/content/cookie-policy.tsx` | The policy page content. |
| `src/index.ts` | The barrel. |

The exports map exposes `.`, `./store`, `./types`, `./components/*` and `./content/*`.

## Conventions

- **The default is functional only.** Analytics and marketing are off until the visitor says otherwise. The default is `functional: true`, `analytics: false`, `marketing: false`.
- **The decision is stored under `cookie_consent`,** with a `CONSENT_VERSION`. When the shape of the stored data changes, bump the version so the old entry is not read as if it were current.
- **The store is persisted in the local storage,** through the Zustand `persist` middleware. The store knows it has not hydrated yet, so the UI does not flash the banner at a visitor who already decided.
- **The policy content lives in `src/content/`,** not in the component. The legal copy is content, and it changes without a component change.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/ui](../ui/AGENTS.md)
- [apps/web](../../apps/web/AGENTS.md)
