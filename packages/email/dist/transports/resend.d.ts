import type { MailerTransport, SendArgs } from "../types.js";
export declare class ResendTransport implements MailerTransport {
    private readonly client;
    private readonly from;
    constructor(opts: {
        apiKey: string;
        from: string;
    });
    send(args: SendArgs): Promise<{
        id: string;
    } | {
        error: string;
    }>;
}
//# sourceMappingURL=resend.d.ts.map