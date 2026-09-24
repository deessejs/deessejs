export declare const appRouter: {
    templates: {
        list: import("@orpc/server").DecoratedProcedure<import("../base-context.js").BaseContext & Record<never, never>, import("../base-context.js").BaseContext, import("@orpc/server").Schema<unknown, unknown>, import("@orpc/server").Schema<{
            templates: {
                slug: string;
                name: string;
                description: string;
                owner: string;
                repo: string;
                license: string;
                category: string;
                labels: string[];
                image?: string | undefined;
                cloneUrl?: string | undefined;
                readme?: string | undefined;
                updatedAt?: string | undefined;
                stars?: number | undefined;
            }[];
        }, {
            templates: {
                slug: string;
                name: string;
                description: string;
                owner: string;
                repo: string;
                license: string;
                category: string;
                labels: string[];
                image?: string | undefined;
                cloneUrl?: string | undefined;
                readme?: string | undefined;
                updatedAt?: string | undefined;
                stars?: number | undefined;
            }[];
        }>, import("@orpc/server").MergedErrorMap<Record<never, never>, {
            TEMPLATES_FETCH_FAILED: {
                message: string;
            };
        }>, Record<never, never>>;
    };
};
export type AppRouter = typeof appRouter;
//# sourceMappingURL=app-router.d.ts.map