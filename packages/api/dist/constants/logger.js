/**
 * Minimal structured JSON logger for the API package.
 *
 * Outputs one JSON object per line on stdout (info) or stderr (error/warn).
 * Compatible with any JSON-line log aggregator (Vercel, Datadog, Honeycomb).
 *
 * No external dependency: V1 stays stdlib-only. If we need levels, sampling,
 * or transports later, this is the surface to replace.
 */
const emit = (stream, fields) => {
    // stderr in Vercel is captured separately from stdout; routing by level
    // makes it possible to filter errors in the log UI without parsing JSON.
    stream.write(JSON.stringify(fields) + "\n");
};
const log = (level, msg, ctx) => {
    const fields = {
        level,
        msg,
        ts: new Date().toISOString(),
        ...ctx,
    };
    if (fields.requestId === undefined)
        delete fields.requestId;
    if (fields.err === undefined)
        delete fields.err;
    emit(level === "info" ? process.stdout : process.stderr, fields);
};
const serializeError = (err) => {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message,
            ...(err.stack ? { stack: err.stack } : {}),
        };
    }
    return { message: String(err) };
};
export const logger = {
    info(msg, ctx) {
        log("info", msg, ctx);
    },
    warn(msg, ctx) {
        log("warn", msg, ctx);
    },
    error(msg, err, ctx) {
        log("error", msg, { ...ctx, err: serializeError(err) });
    },
};
