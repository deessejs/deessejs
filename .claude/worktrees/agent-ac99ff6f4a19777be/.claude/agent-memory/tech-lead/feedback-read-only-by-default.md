---
name: feedback-read-only-by-default
description: Pour les demandes « analyse X » ou « audite Y » sans mention explicite de modification, rester en lecture seule stricte (aucune commande mutante).
metadata:
  type: feedback
---

Règle : demande d'analyse/audit/revue/lecture → mode lecture seule par défaut. Pas de `pnpm install`, `pnpm turbo …`, `pnpm test`, `pnpm format`, `pnpm db:*`, `git checkout/reset/clean/stash/commit/push`, `corepack enable`, `nvm install`, `docker run`, ni aucun POST/GET réseau.

**Why** : observé sur 2026-07-13 quand l'utilisateur a écrit « Tu peux analyser ce projet sans modifier ce code pls » avant de lancer un audit multi-agents. La consigne explicite vaut pour toute demande qui ressemble à « analyser / auditer / cartographier / revoir » — l'utilisateur veut une vue, pas une transformation.

**How to apply** : si la demande est ambiguë (par ex. « vérifie que tout marche »), préférer poser la question via `AskUserQuestion` avant toute action mutante. Toujours lister explicitement dans le rapport final « ce que je n'ai pas exécuté » pour garantir zéro modification. Si l'utilisateur veut ensuite appliquer des recommandations, basculer sur `EnterPlanMode` pour cadrer.