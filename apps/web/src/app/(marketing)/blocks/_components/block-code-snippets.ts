/**
 * V1 stub snippets for the Code tab on every
 * `/blocks/[category]/[block]` page. Each entry is a small JSX
 * example that renders the block as a single composition with
 * placeholder inner content. V2 will swap these for real source
 * from the registered sections of the marketing pages (or a
 * dedicated `packages/blocks/` package once one lands).
 */

import type { CatalogueBlock } from "./blocks-list"

const SNIPPETS = {
  "hero-centered": `export function HeroCentered() {
  return (
    <section className="text-center">
      <h1 className="text-heading-56 font-medium tracking-tight">
        Production-ready templates
      </h1>
      <p className="text-copy-20 text-muted-foreground mt-4">
        Same stack, same guarantees.
      </p>
      <button className="mt-6">Browse templates</button>
    </section>
  )
}`,
  "hero-split-image": `export function HeroSplitImage() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
      <div>
        <h1 className="text-heading-56 font-medium tracking-tight">
          Production-ready templates
        </h1>
        <p className="text-copy-20 text-muted-foreground mt-4">
          Same stack, same guarantees.
        </p>
      </div>
      <div className="aspect-video bg-muted/40" aria-hidden />
    </section>
  )
}`,
  "hero-with-mockup": `export function HeroWithMockup() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-heading-56 font-medium tracking-tight">
        Production-ready templates
      </h1>
      <div className="aspect-video bg-muted/40" aria-hidden />
    </section>
  )
}`,
  "hero-with-cta-banner": `export function HeroWithCtaBanner() {
  return (
    <section className="flex flex-col gap-6 text-center">
      <span className="rounded-full border px-3 py-1 text-sm">
        New release
      </span>
      <h1 className="text-heading-56 font-medium tracking-tight">
        Production-ready templates
      </h1>
    </section>
  )
}`,
  "cta-banner": `export function CtaBanner() {
  return (
    <section className="border-y py-4 text-center">
      <p className="text-copy-14">
        Ready to ship?{" "}
        <a className="underline" href="/templates">Browse templates →</a>
      </p>
    </section>
  )
}`,
  "cta-final": `export function CtaFinal() {
  return (
    <section className="bg-foreground text-background py-16 text-center">
      <h2 className="text-heading-40 font-medium tracking-tight">
        Ready to ship?
      </h2>
      <button className="mt-6">Get started</button>
    </section>
  )
}`,
  "cta-repeating": `export function CtaRepeating() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
      <div className="p-6">Install the CLI</div>
      <div className="p-6">Ship with us</div>
      <div className="p-6">Read the manifesto</div>
    </section>
  )
}`,
  "feature-bento": `export function FeatureBento() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 md:row-span-2 border p-6">Feature A</div>
      <div className="border p-6">Feature B</div>
      <div className="border p-6">Feature C</div>
      <div className="md:col-span-3 border p-6">Feature D</div>
    </section>
  )
}`,
  "feature-list": `export function FeatureList() {
  return (
    <ul className="flex flex-col gap-6">
      <li className="flex items-start gap-3">
        <Icon />
        <span>Feature one</span>
      </li>
      <li className="flex items-start gap-3">
        <Icon />
        <span>Feature two</span>
      </li>
    </ul>
  )
}`,
  "feature-comparison": `export function FeatureComparison() {
  return (
    <section className="grid grid-cols-2 gap-8">
      <div className="border p-6">Option A</div>
      <div className="border p-6">Option B</div>
    </section>
  )
}`,
  "pricing-three-layer": `export function PricingThreeLayer() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border p-6">Open Community</div>
      <div className="border p-6">Pro</div>
      <div className="border p-6">Enterprise</div>
    </section>
  )
}`,
  "pricing-comparison-table": `export function PricingComparisonTable() {
  return (
    <table className="w-full text-left">
      <thead>
        <tr><th>Attribute</th><th>Open</th><th>Pro</th></tr>
      </thead>
      <tbody>
        <tr><td>Price</td><td>Free</td><td>$299</td></tr>
      </tbody>
    </table>
  )
}`,
  "pricing-faq": `export function PricingFaq() {
  return (
    <div className="flex flex-col gap-12">
      <PricingThreeLayer />
      <FaqAccordion />
    </div>
  )
}`,
  "testimonial-pair": `export function TestimonialPair() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <blockquote className="border p-6">"Great product"</blockquote>
      <blockquote className="border p-6">"Saves us time"</blockquote>
    </section>
  )
}`,
  "testimonial-wall": `export function TestimonialWall() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quotes.map((q) => (
        <blockquote key={q.author} className="border p-4 text-sm">
          {q.text}
        </blockquote>
      ))}
    </section>
  )
}`,
  "stats-four-cells": `export function StatsFourCells() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
      <div className="p-6 text-center">12K npm</div>
      <div className="p-6 text-center">3.2K GH</div>
      <div className="p-6 text-center">1 template</div>
      <div className="p-6 text-center">MIT</div>
    </section>
  )
}`,
  "stats-tier": `export function StatsTier() {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">Free tier stats</div>
      <div className="grid grid-cols-3 gap-4">Pro tier stats</div>
    </section>
  )
}`,
  "faq-accordion": `export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="q">
        <AccordionTrigger>Question?</AccordionTrigger>
        <AccordionContent>Answer.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
  "faq-split": `export function FaqSplit() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-12">
      <div>
        <h2>FAQ</h2>
        <p>Common questions.</p>
      </div>
      <FaqAccordion />
    </section>
  )
}`,
  "footer-column-rich": `export function FooterColumnRich() {
  return (
    <footer className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t pt-8">
      <div>
        <h3>Product</h3>
        <ul><li><a>Templates</a></li></ul>
      </div>
      <div>
        <h3>Resources</h3>
        <ul><li><a>Docs</a></li></ul>
      </div>
      <div>
        <h3>Company</h3>
        <ul><li><a>About</a></li></ul>
      </div>
      <div>
        <h3>Legal</h3>
        <ul><li><a>Privacy</a></li></ul>
      </div>
    </footer>
  )
}`,
  "footer-minimal": `export function FooterMinimal() {
  return (
    <footer className="flex items-center justify-between border-t py-4">
      <span>© DeesseJS</span>
      <nav className="flex gap-4">
        <a>Privacy</a>
        <a>Terms</a>
      </nav>
    </footer>
  )
}`,
} as const satisfies Record<CatalogueBlock["slug"], string>

export function getBlockSnippet(slug: CatalogueBlock["slug"]): string {
  return SNIPPETS[slug]
}