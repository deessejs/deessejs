import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { BaseLayout } from "./layout.js";
export function ResetPassword({ url, userEmail }) {
    return (_jsxs(BaseLayout, { preview: "Click the link to set a new password. The link expires in 30 minutes.", children: [_jsx(Heading, { className: "text-xl font-semibold text-gray-900", children: "Reset your password" }), _jsxs(Text, { className: "text-gray-700", children: ["We received a request to reset the password for ", _jsx("strong", { children: userEmail }), "."] }), _jsx(Section, { className: "my-6 text-center", children: _jsx(Button, { href: url, className: "rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText", children: "Reset password" }) }), _jsxs(Text, { className: "text-sm text-gray-600", children: ["If you didn't request this, you can safely ignore this email.", _jsx("br", {}), "Or copy and paste this link:", _jsx("br", {}), _jsx(Link, { href: url, className: "text-brand underline", children: url })] })] }));
}
