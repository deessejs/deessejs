/**
 * Shared message catalogue (ADR-031 Decision #10).
 *
 * Owns four cross-app namespaces:
 *   - `Common` — Cancel, Save, Loading, Continue, Back, Submit,
 *     Discard, Confirm, Close, Open, Yes, No.
 *   - `Error`  — network, unauthorized, forbidden, notFound, serverError,
 *     unknown, tryAgain, contact.
 *   - `Form`   — required, invalid, optional, minLength, maxLength,
 *     passwordStrength (Weak/Fair/Good/Strong), email, placeholder.
 *   - `Confirm`— delete, signOut, revoke, unlink, cancel, unsavedChanges.
 *
 * Per-app catalogues (in `apps/web/messages/` and `apps/app/messages/`)
 * compose with these via `getMessagesForLocale(locale)` (Decision #10).
 * The CI guard rejects any per-app catalogue that re-declares a key
 * from `Common.*`, `Error.*`, `Form.*`, or `Confirm.*`.
 *
 * The re-export here is a typed accessor. Each app's `global.d.ts`
 * extends its own `IntlMessages` interface with `typeof messages` so
 * `useTranslations('Common')` autocompletes on the shared keys.
 */
import en from "./messages/en.json";
import fr from "./messages/fr.json";
export const sharedMessages = {
    en,
    fr,
};
