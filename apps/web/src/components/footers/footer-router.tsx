"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { StarterFooter } from "./starter-footer"

const AppFooter = dynamic(() =>
  import("./app-footer").then((module) => module.AppFooter)
)

export function FooterRouter() {
  const pathname = usePathname()
  return pathname === "/" ? <StarterFooter /> : <AppFooter />
}
