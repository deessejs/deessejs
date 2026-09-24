import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from "@react-email/components";
/**
 * Brand-styled CTA button. Centralizes the Tailwind classes so all templates
 * share the same look.
 */
export function CTAButton(props) {
    return (_jsx(Button, { ...props, className: `rounded-md bg-brand px-6 py-3 text-center text-base font-medium text-brandText ${props.className ?? ""}` }));
}
