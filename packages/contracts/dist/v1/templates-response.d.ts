import { z } from "zod";
/**
 * TemplatesListResponseV1 — the response shape of GET /api/v1/templates.
 *
 * Wrapper around the array so future fields (`meta`, `pagination`, `error`)
 * can be added without breaking the array-of-templates contract that the CLI
 * and apps/web already consume.
 */
export declare const TemplatesListResponseV1: z.ZodObject<{
    templates: z.ZodArray<z.ZodObject<{
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
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TemplatesListResponseV1 = z.infer<typeof TemplatesListResponseV1>;
//# sourceMappingURL=templates-response.d.ts.map