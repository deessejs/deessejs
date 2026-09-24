/**
 * Minimal structured JSON logger for the API package.
 *
 * Outputs one JSON object per line on stdout (info) or stderr (error/warn).
 * Compatible with any JSON-line log aggregator (Vercel, Datadog, Honeycomb).
 *
 * No external dependency: V1 stays stdlib-only. If we need levels, sampling,
 * or transports later, this is the surface to replace.
 */
type LogContext = Record<string, unknown>;
export declare const logger: {
    info(msg: string, ctx?: LogContext): void;
    warn(msg: string, ctx?: LogContext): void;
    error(msg: string, err?: unknown, ctx?: LogContext): void;
};
export {};
//# sourceMappingURL=logger.d.ts.map