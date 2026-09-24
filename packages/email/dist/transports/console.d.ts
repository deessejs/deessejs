import type { MailerTransport, SendArgs } from "../types.js";
export declare class ConsoleTransport implements MailerTransport {
    private readonly opts;
    constructor(opts: {
        from: string;
    });
    send(args: SendArgs): Promise<{
        id: string;
    }>;
}
//# sourceMappingURL=console.d.ts.map