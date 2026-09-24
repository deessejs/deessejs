import { type Bcp47 } from "./_locales.js";
export interface LocaleSwitcherProps {
    /** Optional className applied to the root element. */
    className?: string;
    /** Optional label rendered before the trigger. */
    label?: string;
    /** BCP-47 locales rendered as options. Defaults to the configured pair. */
    options?: readonly Bcp47[];
}
export declare function LocaleSwitcher({ className, label, options, }?: LocaleSwitcherProps): React.ReactElement;
//# sourceMappingURL=locale-switcher.d.ts.map