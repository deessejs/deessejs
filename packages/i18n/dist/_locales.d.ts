/**
 * Internal: locale parsing and typed accessors.
 *
 * Extracted from `index.ts` so `routing.ts` can import the same
 * accessors without forming a cycle (`index.ts` exports `routing`,
 * `routing.ts` needs `locales()` and `defaultLocale()`). The two
 * files form a DAG: `_locales.ts` -> `@workspace/env/*`; `routing.ts`
 * -> `_locales.ts`; `index.ts` -> `_locales.ts` + `routing.ts`.
 *
 * This file is internal: not exported via the package's `exports`
 * map. Consumers always import from `@workspace/i18n` (universal)
 * or `@workspace/i18n/routing` (universal).
 */
export declare function isBcp47(value: string): value is Bcp47;
export declare const LOCALES: ReadonlyArray<Bcp47>;
export declare const DEFAULT: Bcp47;
export type Bcp47 = "en" | "fr";
export declare function locales(): readonly Bcp47[];
export declare function defaultLocale(): Bcp47;
export declare function isSupportedLocale(candidate: string): candidate is Bcp47;
export declare function openGraphLocale(locale: Bcp47): "en_US" | "fr_FR";
export declare function availableLanguageLabel(locale: Bcp47): string;
export declare const LOCALE_LABELS: Readonly<Record<Bcp47, string>>;
//# sourceMappingURL=_locales.d.ts.map