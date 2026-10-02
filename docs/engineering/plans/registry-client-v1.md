# registry-client V1 — spec d'implémentation

> **Statut** : draft, à valider avant tout code.
> **Auteur** : David + Claude, session 2026-09-25.
> **Branche** : `docs/adr-031-templates-json`.

## 1. Contexte

Le CLI DeesseJS parle aujourd'hui à **deux backends en parallèle** :

- L'API serveur (`app.deessejs.com`) pour le catalogue via oRPC
- GitHub directement pour `git clone` du repo template

Ce n'est **pas un flux de registre de bout en bout** : le client connaît les détails de stockage (GitHub vs R2) et les reproduit dans chaque consumer. Quand R2 arrivera pour les templates payants, le contrôle d'accès sera centralisé côté serveur, mais le client continuera à parler à GitHub en parallèle.

On introduit `@workspace/registry-client` (SDK) pour :

1. Donner aux consumers (CLI, web à venir) un **contrat unique de fetch de templates**
2. Garder **l'API serveur comme autorité** sur la résolution et le contrôle d'accès
3. Permettre à R2 d'arriver **sans casser le SDK** (provider reste interne au serveur)
4. Fournir une **base commune** de validation Zod et de gestion d'erreurs typées

## 2. Architecture

```
┌─────────────────────────────────────────┐
│ Consumers (CLI, Web, future AI/Mobile)  │
└────────────────────┬────────────────────┘
                     │ fetchDescriptor(slug)
                     ▼
┌─────────────────────────────────────────┐
│ @workspace/registry-client (SDK)        │
│ - validation Zod défense en profondeur │
│ - erreurs typées RegistryFailure        │
│ - (V2+) cache, retry, offline           │
└────────────────────┬────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────┐
│ @workspace/api (serveur oRPC)           │
│ - résout l'identifiant en source        │
│ - télécharge depuis la source           │
│ - valide contre TemplateV2Schema        │
│ - signe URLs pour sources privées (R2)  │
└────────────────────┬────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   ┌─────────────┐       ┌─────────────┐
   │ GitHub raw  │       │ R2 (futur)  │
   │  (V1)       │       │ + auth      │
   └─────────────┘       └─────────────┘
```

**Principe fondamental** : le **provider est serveur**. Le SDK ne sait pas si un template vient de GitHub, de R2 ou d'ailleurs. Il appelle l'API et reçoit un descriptor validé plus des URLs fetchable.

## 3. Contrat public du SDK

### Interface

```ts
export type RegistryClient = {
  /** Fetch un template par identifiant. */
  fetchDescriptor: (
    slug: string,
    options?: { ref?: string },
  ) => Promise<Result<FetchedTemplate, RegistryFailure>>

  /** Liste les templates disponibles (catalogue). */
  listCatalog: () => Promise<Result<CatalogEntry[], RegistryFailure>>
}

export type FetchedTemplate = {
  /** Descriptor validé par Zod (TemplateV2Schema). */
  readonly descriptor: TemplateV2
  /**
   * URLs fetchable pour chaque fichier déclaré dans
   * `descriptor.files[]`. Le SDK ne sait pas ce qu'elles contiennent
   * (GitHub raw, signed URL R2, etc.).
   */
  readonly files: Readonly<Record<ObjectKey, string>>
}

export type CatalogEntry = {
  readonly slug: string
  readonly title: string
  readonly description?: string
  readonly layer: "open-community" | "pro" | "enterprise"
  readonly latestVersion: string
}
```

### Factory

```ts
export const createRegistryClient = (options: {
  apiUrl: string  // ex: "https://app.deessejs.com"
  fetchImpl?: typeof fetch  // injectable pour les tests
}): RegistryClient
```

## 4. Trajet des octets (V1)

Pour `fetchDescriptor("@deessejs/nextjs-saas")` :

1. **SDK** appelle `POST /api/v1/registry/fetch-descriptor` avec `{ slug, ref? }`
2. **API** résout le slug en source :
   ```
   "@deessejs/*" → GitHub repo `deessejs/templates`, path, ref
   ```
3. **API** télécharge `deesse-template.json` depuis GitHub raw
4. **API** valide contre `TemplateV2Schema`. Si invalide → `RegistryInvalidDescriptor`
5. **API** télécharge chaque fichier listé dans `descriptor.files[]` et génère une URL fetchable par fichier :
   ```ts
   files: {
     "package.json": "https://raw.githubusercontent.com/deessejs/templates/v1.4.0/nextjs-saas/package.json",
     "src/index.ts": "https://raw.githubusercontent.com/deessejs/templates/v1.4.0/nextjs-saas/src/index.ts",
     // ...
   }
   ```
   En V1, ce sont des URLs GitHub raw publiques. En V2 (R2), ce seront des signed URLs temporaires.
6. **API** retourne `{ descriptor, files }` au SDK
7. **SDK** re-valide le descriptor (défense en profondeur)
8. **SDK** retourne `Result.ok({ descriptor, files })` au consumer

Le consumer (CLI) fait ensuite des `fetch()` parallèles pour récupérer les bytes des fichiers, puis écrit sur disque selon `descriptor.files[i].target ?? descriptor.files[i].path`.

## 5. Erreurs typées

```ts
export type RegistryFailure =
  | { readonly _tag: "RegistryNotFound"; readonly slug: string }
  | { readonly _tag: "RegistryFetchFailed"; readonly slug: string; readonly cause: unknown }
  | { readonly _tag: "RegistryInvalidDescriptor"; readonly slug: string; readonly cause: unknown }
  | { readonly _tag: "RegistryNetworkError"; readonly slug: string; readonly cause: unknown }
  | { readonly _tag: "RegistryAuthRequired"; readonly slug: string }
  | { readonly _tag: "RegistryUnsupportedSource"; readonly source: string }
```

Helpers (cohérence avec `StorageFailure`) :

```ts
export const toRegistryError = (
  failure: RegistryFailure,
  message: string,
): Error

export const asRegistryFailure = (err: unknown): RegistryFailure | null
```

## 6. Frontières API ↔ SDK

| Responsabilité | API serveur | SDK client |
|---|---|---|
| Résolution slug → source | ✅ | ❌ |
| Téléchargement depuis la source | ✅ | ❌ |
| Validation Zod du descriptor | ✅ (primaire) | ✅ (défense) |
| Signature des URLs privées | ✅ (futur R2) | ❌ |
| Cache local | ❌ | ❌ (V1) |
| Retry HTTP | ❌ (plugins oRPC) | ❌ (V1) |
| Erreurs typées côté transport | `ORPCError` | `RegistryFailure` union |
| Erreurs applicatives visibles | `RegistryFetchFailed`, etc. | `RegistryFailure` exposé au consumer |

## 7. Compatibilité avec `init` actuel

**V1 cohabitation** :

- `deesse init <slug>` continue à cloner le repo (parcours legacy pour templates sans descriptor V2)
- `deesse init-v2 <slug>` est la nouvelle commande qui consomme le SDK
- Les deux parcours coexistent pendant la transition

**Décision ouverte** : faut-il basculer `init` directement sur le SDK quand un descriptor V2 est disponible, ou garder les deux commandes forever ? Voir §10.

## 8. Critères d'acceptation

- ✅ Test : `deesse init-v2 <fixture-slug>` avec un template de fixture dans `apps/cli/test/fixtures/` produit les fichiers attendus dans `targetDir`
- ✅ Validation Zod à la frontière API : un descriptor malformé (lignes JSON cassées) → API retourne 4xx avec code stable, SDK expose `RegistryInvalidDescriptor`
- ✅ Le SDK expose un seul contrat typé pour les consumers (pas de types R2, pas de `bucket`, pas de `key`)
- ✅ Le descriptor `TemplateV2` est validé deux fois : à l'API (primaire) et au SDK (défense)
- ✅ Aucune URL signée ou détail de source n'est exposé via le SDK

## 9. Hors scope V1

- Cache local (fichier JSON, IndexedDB, etc.)
- R2 et templates payants
- Signature cryptographique du descriptor
- Commande `add` (ajout de blocs/feature à un projet existant)
- AI agent, mobile, desktop consumers
- Bot de publication des templates
- Modes offline avancés (stale-while-revalidate, etc.)
- Signature des WireEnvelopes

## 10. Décisions ouvertes

### 10.1. `init` legacy vs SDK — bascule ou cohabitation ?

**Option A** : `init` reste `git clone` pour toujours. `init-v2` est le chemin moderne.
**Option B** : `init` détecte si un descriptor V2 existe → bascule auto. Sinon, fallback clone.

Recommandation : **Option A** pour V1 (simplicité). Évoluer vers B quand tous les templates officiels ont leur descriptor.

### 10.2. Templates de fixture

Quels templates utiliser pour les tests ? Options :
- Créer un repo factice `apps/cli/test/fixtures/templates/` avec un `deesse-template.json` minimal
- Pointer sur un vrai repo public (`deessejs/templates`)

Recommandation : **fixtures locaux** pour les tests unitaires. Pas de dépendance réseau.

### 10.3. Format de la réponse API

`{ descriptor, files }` directement, ou envelopper dans `{ data: { descriptor, files }, meta: {...} }` ?

Recommandation : **réponse plate** (`{ descriptor, files }`) pour V1. Si on a besoin de metadata plus tard (rate limits, cache hints), on ajoute `meta`.

### 10.4. Qui parle au SDK ?

V1 : CLI uniquement. Web attendra que le SDK soit stable. Mobile et AI agent : pas avant.

## 11. Séquencement

5-6 commits atomiques sur 2-3 jours, chaque commit indépendamment reviewable :

| # | Commit | Contenu | Tests | Estimation |
|---|---|---|---|---|
| 1 | `docs(plans): registry-client-v1 spec` | Ce document | n/a | 30 min |
| 2 | `feat(api): registry fetchDescriptor route` | Route oRPC + Server-Side Client test + validation Zod | Tests d'intégration | 2-3 h |
| 3 | `feat(registry-client): scaffold + interface` | Package skeleton, `RegistryClient`, factory, types | Tests unitaires | 2 h |
| 4 | `feat(registry-client): GitHub V1 provider` | Le SDK appelle l'API (pas GitHub direct — provider = serveur) | Tests avec fetch mocké | 1-2 h |
| 5 | `feat(cli): init-v2 command` | Nouvelle commande qui consomme le SDK | Test e2e fixture | 2-3 h |
| 6 | `docs(registry-client): README + ADR followup` | README + éventuellement ADR-037 storage strategy | n/a | 1 h |

**Total** : 8-11 h sur 2-3 jours, avec marge pour révision.

## 12. Critères de succès global

- Le SDK a un contrat public stable qui ne changera pas quand R2 arrivera
- `deesse init-v2 <slug>` fonctionne end-to-end avec un template de fixture
- Les 4 consumers futurs (CLI confirmé, web confirmé, AI/mobile potentiels) peuvent adopter le SDK sans changement de l'API serveur
- L'API serveur reste le seul point de contact avec GitHub et R2

## 13. Anti-critères

Ce que ce SDK **n'est pas** :

- ❌ Un cache local (différé)
- ❌ Un validateur de templates (c'est le job de `@workspace/contracts/v2`)
- ❌ Un scaffolder (c'est le job du CLI ou d'un consumer dédié)
- ❌ Un client GitHub direct (le serveur proxifie)
- ❌ Un système de publication (futur bot, hors-scope)
- ❌ Une lib générique d'HTTP retry (utiliser des libs dédiées le jour où on en a besoin)
