import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// =============================================================================
// DeesseJS Design System ESLint Rules
// =============================================================================
// These rules enforce the mechanical decisions documented in DESIGN.md.
// Judgment-level decisions (modes, hierarchy, scope) live in
// .claude/skills/product-design/SKILL.md.
// =============================================================================

/**
 * Rule: prefer-radio-for-few-static-options
 *
 * If a <Select> has 2 or 3 hardcoded <option> children, suggest Radio buttons
 * instead. Radio buttons show every choice at once; Select requires a click
 * to reveal options.
 */
const preferRadioForFewStaticOptions = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest Radio buttons when Select has 2-3 static options",
      category: "Design System",
      recommended: true,
    },
    schema: [],
    messages: {
      preferRadio:
        "Select with {{ count }} static options. Consider using Radio buttons — they show all options at once without requiring a click to open.",
    },
  },
  create(context) {
    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (opening.name.type !== "JSXIdentifier") return;
        if (opening.name.name !== "Select") return;

        // Skip if any child is a dynamic mapping (e.g. {options.map(...)}).
        const hasDynamic = node.children.some(
          (child) =>
            child.type === "JSXExpressionContainer" &&
            child.expression.type === "CallExpression",
        );
        if (hasDynamic) return;

        // Count hardcoded <option> children.
        const optionChildren = node.children.filter(
          (child) =>
            child.type === "JSXElement" &&
            child.openingElement.name.type === "JSXIdentifier" &&
            child.openingElement.name.name === "option",
        );
        if (optionChildren.length < 2 || optionChildren.length > 3) return;

        context.report({
          node: opening,
          messageId: "preferRadio",
          data: { count: String(optionChildren.length) },
        });
      },
    };
  },
};

/**
 * Rule: no-classname-override-on-ds-component
 *
 * Design-system primitives bake in semantic tokens (bg-primary,
 * text-foreground, etc.). Overriding these via className breaks dark mode,
 * brand consistency, and the DS contract. Use the variant prop instead, or
 * extend the primitive's CVA variants.
 */
const noClassnameOverrideOnDsComponent = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent className overrides on design-system primitives",
      category: "Design System",
      recommended: true,
    },
    schema: [],
    messages: {
      overrideDetected:
        "className overrides design-system tokens ({{ tokens }}). Use the `variant` prop or extend the primitive's CVA variants instead.",
    },
  },
  create(context) {
    const DS_COMPONENTS = new Set([
      "Button",
      "Dialog",
      "Input",
      "Label",
      "Select",
      // Extend as primitives ship. See coverage-gaps.md.
    ]);

    // Match raw color utilities that would override semantic tokens.
    // Allow-listed prefixes: bg-background, text-foreground, bg-primary, etc.
    const RAW_COLOR_PATTERN =
      /^(bg|text|border|ring|fill|stroke)-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d+$/;

    function extractClassName(attr) {
      // className="literal" → JSXAttribute { value: Literal }
      if (attr.value.type === "Literal") {
        return attr.value.value;
      }
      // className={"literal"} → JSXAttribute { value: JSXExpressionContainer { expression: Literal } }
      if (
        attr.value.type === "JSXExpressionContainer" &&
        attr.value.expression.type === "Literal"
      ) {
        return attr.value.expression.value;
      }
      // className={`template ${var}`} → extract static parts
      if (
        attr.value.type === "JSXExpressionContainer" &&
        attr.value.expression.type === "TemplateLiteral"
      ) {
        return attr.value.expression.quasis.map((q) => q.value.raw).join(" ");
      }
      return undefined; // dynamic — skip
    }

    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (!DS_COMPONENTS.has(node.name.name)) return;

        const classNameAttr = node.attributes.find(
          (attr) =>
            attr.type === "JSXAttribute" &&
            attr.name.name === "className",
        );
        if (!classNameAttr) return;

        const rawValue = extractClassName(classNameAttr);
        if (rawValue === undefined) return;

        const classes = String(rawValue).split(/\s+/);
        const offenders = classes.filter((cls) => RAW_COLOR_PATTERN.test(cls));
        if (offenders.length > 0) {
          context.report({
            node,
            messageId: "overrideDetected",
            data: { tokens: offenders.join(", ") },
          });
        }
      },
    };
  },
};

/**
 * Rule: grid-spacing-enforcer
 *
 * DESIGN.md §1 principle #3 is "same spacing rhythm". Tailwind arbitrary
 * values like p-[13px] or mt-[7px] break the 4px grid. Use standard
 * utilities (p-3 = 12px, p-4 = 16px) or extend the spacing scale.
 */
const gridSpacingEnforcer = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Reject arbitrary spacing values not on the 4px grid",
      category: "Design System",
      recommended: true,
    },
    schema: [],
    messages: {
      offGrid:
        "Arbitrary spacing value `{{ value }}` is not on the 4px grid. Use a standard utility (p-3, p-4, mt-2, etc.) or extend the spacing scale.",
    },
  },
  create(context) {
    const SPACING_PREFIXES =
      /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|top|bottom|left|right|inset)-/;
    const ARBITRARY_VALUE = /\[(-?\d+(?:\.\d+)?)(px|rem|em)\]/;

    function checkString(node, raw) {
      if (typeof raw !== "string") return;
      const classes = raw.split(/\s+/);
      for (const cls of classes) {
        if (!SPACING_PREFIXES.test(cls)) continue;
        const match = cls.match(ARBITRARY_VALUE);
        if (!match) continue;
        const num = parseFloat(match[1]);
        const unit = match[2];
        if (unit === "rem" || unit === "em") continue; // rem/em follow a different scale
        if (num === 1) continue; // 1px borders / dividers are fine
        if (num % 4 === 0) continue;
        context.report({
          node,
          messageId: "offGrid",
          data: { value: cls.match(/\[.*?\]/)[0] },
        });
      }
    }

    return {
      Literal(node) {
        checkString(node, node.value);
      },
      TemplateElement(node) {
        checkString(node, node.value.raw);
      },
    };
  },
};

// =============================================================================
// Config export
// =============================================================================
// A single plugin namespace is declared once at the top, then referenced in
// the file-scoped blocks below. ESLint flat config does not allow redefining
// the same plugin key across blocks — the plugin object lives once.
//
// NOTE: `require-data-slot` was planned as a 4th rule but its visitor keys
// (ExportNamedDeclaration, VariableDeclaration) silently don't fire under
// typescript-eslint 8 + ESLint 9 flat config in this setup. Tracked as
// follow-up. The other 3 rules catch the bulk of mechanical design decisions.
// =============================================================================

const dsPlugin = {
  rules: {
    "prefer-radio-for-few-static-options": preferRadioForFewStaticOptions,
    "no-classname-override-on-ds-component": noClassnameOverrideOnDsComponent,
    "grid-spacing-enforcer": gridSpacingEnforcer,
  },
};

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    plugins: { "deessejs-ds": dsPlugin },
    rules: {
      "deessejs-ds/grid-spacing-enforcer": "warn",
    },
  },
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "deessejs-ds/prefer-radio-for-few-static-options": "warn",
      "deessejs-ds/no-classname-override-on-ds-component": "warn",
    },
  },
]);