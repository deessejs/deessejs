export declare const auth: import("better-auth").Auth<{
    baseURL: {
        allowedHosts: ("deessejs.com" | "*.deessejs.com" | "*.vercel.app" | "localhost:*")[];
        protocol: "http" | "https";
        fallback: string;
    };
    basePath: string;
    secret: string | undefined;
    trustedOrigins: string[];
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    emailAndPassword: {
        enabled: true;
        requireEmailVerification: true;
        sendResetPassword: ({ user, url }: {
            user: import("better-auth").User;
            url: string;
            token: string;
        }) => Promise<void>;
    };
    emailVerification: {
        sendOnSignUp: true;
        sendOnSignIn: true;
        sendVerificationEmail: ({ user, url }: {
            user: import("better-auth").User;
            url: string;
            token: string;
        }) => Promise<void>;
    };
    session: {
        expiresIn: number;
        updateAge: number;
    };
    advanced: {
        crossSubDomainCookies?: {
            enabled: true;
            domain: string;
        };
        defaultCookieAttributes?: {
            sameSite: "none";
        };
        useSecureCookies: boolean;
    };
    experimental: {
        joins: true;
    };
    socialProviders: {
        github: {
            clientId: string;
            clientSecret: string;
        };
    };
    account: {
        accountLinking: {
            enabled: true;
            trustedProviders: "github"[];
            allowDifferentEmails: false;
            updateUserInfoOnLink: true;
        };
    };
    plugins: [{
        id: "device-authorization";
        version: string;
        schema: {
            deviceCode: {
                fields: {
                    deviceCode: {
                        type: "string";
                        required: true;
                    };
                    userCode: {
                        type: "string";
                        required: true;
                    };
                    userId: {
                        type: "string";
                        required: false;
                    };
                    expiresAt: {
                        type: "date";
                        required: true;
                    };
                    status: {
                        type: "string";
                        required: true;
                    };
                    lastPolledAt: {
                        type: "date";
                        required: false;
                    };
                    pollingInterval: {
                        type: "number";
                        required: false;
                    };
                    clientId: {
                        type: "string";
                        required: false;
                    };
                    scope: {
                        type: "string";
                        required: false;
                    };
                };
            };
        };
        endpoints: {
            deviceCode: import("better-auth").StrictEndpoint<"/device/code", {
                method: "POST";
                body: import("zod").ZodObject<{
                    client_id: import("zod").ZodString;
                    user_id: import("zod").ZodOptional<import("zod").ZodString>;
                    scope: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("zod/v4/core").$strip>;
                error: import("zod").ZodObject<{
                    error: import("zod").ZodEnum<{
                        invalid_request: "invalid_request";
                        invalid_client: "invalid_client";
                    }>;
                    error_description: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                device_code: {
                                                    type: string;
                                                    description: string;
                                                };
                                                user_code: {
                                                    type: string;
                                                    description: string;
                                                };
                                                verification_uri: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                                verification_uri_complete: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                                expires_in: {
                                                    type: string;
                                                    description: string;
                                                };
                                                interval: {
                                                    type: string;
                                                    description: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            400: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                    enum: string[];
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                device_code: string;
                user_code: string;
                verification_uri: string;
                verification_uri_complete: string;
                expires_in: number;
                interval: number;
            }>;
            deviceToken: import("better-auth").StrictEndpoint<"/device/token", {
                method: "POST";
                body: import("zod").ZodObject<{
                    grant_type: import("zod").ZodLiteral<"urn:ietf:params:oauth:grant-type:device_code">;
                    device_code: import("zod").ZodString;
                    client_id: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("zod").ZodObject<{
                    error: import("zod").ZodEnum<{
                        invalid_request: "invalid_request";
                        authorization_pending: "authorization_pending";
                        slow_down: "slow_down";
                        expired_token: "expired_token";
                        access_denied: "access_denied";
                        invalid_grant: "invalid_grant";
                    }>;
                    error_description: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                session: {
                                                    $ref: string;
                                                };
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            400: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                    enum: string[];
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                access_token: string;
                token_type: string;
                expires_in: number;
                scope: string;
            }>;
            deviceVerify: import("better-auth").StrictEndpoint<"/device", {
                method: "GET";
                query: import("zod").ZodObject<{
                    user_code: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("zod").ZodObject<{
                    error: import("zod").ZodEnum<{
                        invalid_request: "invalid_request";
                    }>;
                    error_description: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user_code: {
                                                    type: string;
                                                    description: string;
                                                };
                                                status: {
                                                    type: string;
                                                    enum: string[];
                                                    description: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                user_code: string;
                status: string;
            }>;
            deviceApprove: import("better-auth").StrictEndpoint<"/device/approve", {
                method: "POST";
                body: import("zod").ZodObject<{
                    userCode: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("zod").ZodObject<{
                    error: import("zod").ZodEnum<{
                        invalid_request: "invalid_request";
                        expired_token: "expired_token";
                        access_denied: "access_denied";
                        device_code_already_processed: "device_code_already_processed";
                        unauthorized: "unauthorized";
                    }>;
                    error_description: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                requireHeaders: true;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
            deviceDeny: import("better-auth").StrictEndpoint<"/device/deny", {
                method: "POST";
                body: import("zod").ZodObject<{
                    userCode: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("zod").ZodObject<{
                    error: import("zod").ZodEnum<{
                        invalid_request: "invalid_request";
                        expired_token: "expired_token";
                        access_denied: "access_denied";
                        unauthorized: "unauthorized";
                    }>;
                    error_description: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                requireHeaders: true;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
        };
        $ERROR_CODES: {
            USER_NOT_FOUND: import("better-auth").RawError<"USER_NOT_FOUND">;
            FAILED_TO_CREATE_SESSION: import("better-auth").RawError<"FAILED_TO_CREATE_SESSION">;
            INVALID_DEVICE_CODE: import("better-auth").RawError<"INVALID_DEVICE_CODE">;
            EXPIRED_DEVICE_CODE: import("better-auth").RawError<"EXPIRED_DEVICE_CODE">;
            EXPIRED_USER_CODE: import("better-auth").RawError<"EXPIRED_USER_CODE">;
            AUTHORIZATION_PENDING: import("better-auth").RawError<"AUTHORIZATION_PENDING">;
            ACCESS_DENIED: import("better-auth").RawError<"ACCESS_DENIED">;
            INVALID_USER_CODE: import("better-auth").RawError<"INVALID_USER_CODE">;
            DEVICE_CODE_ALREADY_PROCESSED: import("better-auth").RawError<"DEVICE_CODE_ALREADY_PROCESSED">;
            DEVICE_CODE_NOT_CLAIMED: import("better-auth").RawError<"DEVICE_CODE_NOT_CLAIMED">;
            POLLING_TOO_FREQUENTLY: import("better-auth").RawError<"POLLING_TOO_FREQUENTLY">;
            INVALID_DEVICE_CODE_STATUS: import("better-auth").RawError<"INVALID_DEVICE_CODE_STATUS">;
            AUTHENTICATION_REQUIRED: import("better-auth").RawError<"AUTHENTICATION_REQUIRED">;
        };
        options: Partial<{
            expiresIn: import("better-auth/plugins").TimeString;
            interval: import("better-auth/plugins").TimeString;
            deviceCodeLength: number;
            userCodeLength: number;
            generateDeviceCode?: (() => string | Promise<string>) | undefined;
            generateUserCode?: (() => string | Promise<string>) | undefined;
            validateClient?: ((clientId: string) => boolean | Promise<boolean>) | undefined;
            onDeviceAuthRequest?: ((clientId: string, scope: string | undefined) => void | Promise<void>) | undefined;
            verificationUri?: string | undefined;
            schema?: {
                deviceCode?: {
                    modelName?: string | undefined;
                    fields?: {
                        deviceCode?: string | undefined;
                        userCode?: string | undefined;
                        userId?: string | undefined;
                        expiresAt?: string | undefined;
                        status?: string | undefined;
                        lastPolledAt?: string | undefined;
                        pollingInterval?: string | undefined;
                        clientId?: string | undefined;
                        scope?: string | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
        }>;
    }, {
        id: "bearer";
        version: string;
        hooks: {
            before: {
                matcher(context: import("better-auth").HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<{
                    context: {
                        headers: Headers;
                    };
                } | undefined>;
            }[];
            after: {
                matcher(context: import("better-auth").HookEndpointContext): true;
                handler: (inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<void>;
            }[];
        };
        options: import("better-auth/plugins").BearerOptions | undefined;
    }, {
        id: "next-cookies";
        version: string;
        hooks: {
            before: {
                matcher(ctx: import("better-auth").HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<void>;
            }[];
            after: {
                matcher(ctx: import("better-auth").HookEndpointContext): true;
                handler: (inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<void>;
            }[];
        };
    }];
}>;
export type AuthInstance = typeof auth;
export type { Session, User } from "better-auth";
//# sourceMappingURL=auth.d.ts.map