import type { ReactNode } from "react";
interface BaseLayoutProps {
    /** Inbox preview text (50-90 chars). */
    preview: string;
    /** Email body content. */
    children: ReactNode;
}
export declare function BaseLayout({ preview, children }: BaseLayoutProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=layout.d.ts.map