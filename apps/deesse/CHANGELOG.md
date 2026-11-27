# deesse

## 1.0.0

### Major Changes

- a14fcee: Move the optional Admin plugin into Deesse, expose it through opt-in plugin subpaths, and add the Blog plugin with byte-preserving Markdown content and bounded offset pagination. The Deesse 1.0 API contains both capabilities; the separate Admin package is retired.

## 0.4.0

### Minor Changes

- a6cf6ae: Add the first DeesseJS admin dashboard package, expose typed runtime plugin outputs for schema generation, and let the Drizzle schema CLI read those outputs from the app runtime config.
