export declare const authGuard: import("@orpc/server").DecoratedMiddleware<import("./base-context.js").BaseContext & Record<never, never>, {
    user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined;
    };
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
    };
    headers: Headers;
    requestId: string;
}, unknown, any, any, Record<never, never>>;
//# sourceMappingURL=auth-middleware.d.ts.map