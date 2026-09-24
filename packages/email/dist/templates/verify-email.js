import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { BaseLayout } from "./layout.js";
export function VerifyEmail({ url, userEmail }) {
    return (_jsxs(BaseLayout, { preview: "Click the link to confirm your address and activate your account.", children: [_jsx(Heading, { className: "text-xl font-semibold text-gray-900", children: "Verify your email" }), _jsxs(Text, { className: "text-gray-700", children: ["Thanks for signing up. Please confirm that ", _jsx("strong", { children: userEmail }), " is your email address."] }), _jsx(Section, { className: "my-6 text-center", children: _jsx(Button, { href: url, className: "rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText", children: "Verify email" }) }), _jsxs(Text, { className: "text-sm text-gray-600", children: ["Or copy and paste this link into your browser:", _jsx("br", {}), _jsx(Link, { href: url, className: "text-brand underline", children: url })] })] }));
}
