import { z } from "zod";
/**
 * TemplateV1 — single source of truth for the templates registry payload.
 *
 * Consumed by:
 *   - packages/api  (server, builds the response from the hand-curated list)
 *   - apps/cli      (validates `/api/v1/templates` responses)
 *   - apps/web      (renders /templates and /templates/[template_slug])
 *
 * Wire format is the JSON shape returned by GET /api/v1/templates. Adding a
 * required field here is a breaking change for any installed CLI V1 client
 * that has not been updated to read the new version. The CLI's `parse()`
 * call will throw on the new shape, surfacing as a `parse_error` to the user.
 *
 * Optional fields (e.g. `image`, `cloneUrl`) keep the response shape backward
 * compatible: existing clients that don't know about them continue to parse
 * the response without change.
 */
export declare const TemplateV1: z.ZodObject<{
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    owner: z.ZodString;
    repo: z.ZodString;
    license: z.ZodString;
    category: z.ZodString;
    labels: z.ZodArray<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    cloneUrl: z.ZodOptional<z.ZodString>;
    readme: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
    stars: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type TemplateV1 = z.infer<typeof TemplateV1>;
//# sourceMappingURL=template.d.ts.map