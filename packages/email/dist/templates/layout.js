import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text, } from "@react-email/components";
export function BaseLayout({ preview, children }) {
    return (_jsxs(Html, { lang: "en", children: [_jsx(Head, {}), _jsx(Preview, { children: preview }), _jsx(Tailwind, { config: {
                    theme: {
                        extend: {
                            colors: {
                                brand: "#0070f3",
                                brandText: "#ffffff",
                            },
                        },
                    },
                }, children: _jsx(Body, { className: "bg-gray-50 font-sans", children: _jsxs(Container, { className: "mx-auto my-0 max-w-[600px] bg-white p-8", children: [_jsx(Section, { children: _jsx(Heading, { className: "text-2xl font-bold text-gray-900", children: "DeesseJS" }) }), _jsx(Hr, { className: "my-4 border-gray-200" }), children, _jsx(Hr, { className: "my-4 border-gray-200" }), _jsx(Section, { children: _jsxs(Text, { className: "text-xs text-gray-500", children: ["\u00A9 ", new Date().getFullYear(), " DeesseJS. All rights reserved."] }) })] }) }) })] }));
}
