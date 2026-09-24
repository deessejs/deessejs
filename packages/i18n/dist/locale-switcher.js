"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Locale switcher (ADR-031 Decision #5 + Decision #9).
 *
 * Renders a small dropdown that lets the user switch between the
 * configured locales. Both apps consume this component from
 * `@workspace/i18n/switcher`; per-app styling is applied via
 * `className` (the marketing header uses a compact chip; the app
 * profile settings wraps it in a settings card).
 *
 * The component is a Client Component (the router hook requires
 * it). The locale change is performed via
 * `router.replace(pathname, { locale: nextLocale })`. The cookie
 * update is an internal side-effect of `router.replace`; there is
 * no separate setter (next-intl has no `setLocale` API).
 *
 * Implementation note: this package lives in `packages/i18n`,
 * not under `apps/`. The project's `use-shadcn` skill bans raw
 * `<input>` / `<button>` / `<select>` only inside `apps/**`; the
 * shadcn `Select` primitive is also not exported by
 * `@workspace/ui`. A plain HTML `<select>` styled with
 * `data-testid="locale-switcher"` and `data-current-locale` is
 * the correct primitive for this internal package. The
 * `use-shadcn` constraint is enforced at the app boundary
 * (the apps wrap this component in a shadcn-styled card).
 */
import { useLocale } from "next-intl";
import { LOCALE_LABELS, } from "./_locales.js";
import { usePathname, useRouter } from "./navigation.js";
export function LocaleSwitcher({ className, label, options, } = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const supported = options ?? Object.keys(LOCALE_LABELS);
    function onSelect(nextLocale) {
        router.replace(pathname, { locale: nextLocale });
    }
    return (_jsxs("div", { className: className, "data-testid": "locale-switcher", "data-current-locale": currentLocale, "aria-label": label, children: [label !== undefined && (_jsx("span", { className: "text-sm text-muted-foreground", children: label })), _jsx("select", { className: "rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring", value: currentLocale, onChange: (event) => onSelect(event.target.value), children: supported.map((locale) => (_jsx("option", { value: locale, children: LOCALE_LABELS[locale] }, locale))) })] }));
}
