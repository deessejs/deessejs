interface RoutingShape {
    locales: readonly ["en", "fr"];
    defaultLocale: "en";
    localePrefix: "as-needed";
    localeDetection: true;
}
/**
 * Lazy-loaded routing shape. The first access reads `LOCALES` and
 * `DEFAULT` from `@workspace/env` (via `./_locales.js`); subsequent
 * accesses reuse the cached value. The shape mirrors the shape
 * `defineRouting` would return without the `pathnames` / `domains`
 * shape extensions (V1 does not use them).
 */
export declare const routing: RoutingShape;
export type Routing = RoutingShape;
export {};
//# sourceMappingURL=routing.d.ts.map