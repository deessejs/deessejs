import type React from "react"
import { cssVariables } from "./utils.js"

const variables: React.CSSProperties = cssVariables({
  "--custom-string": "value",
  "--custom-number": 1,
  "--custom-undefined": undefined,
})

const invalidVariables: React.CSSProperties = {
  // @ts-expect-error Unprefixed custom property keys are invalid.
  custom: "value",
}

void variables
void invalidVariables
