# Phase 1 — Fondations et migrations V2 (uniquement)

Les phases 2 à 5 ne seront pas commencées avant votre validation du rapport de cette phase.

## 1. État initial
- Lancer `build`, `lint` et `vitest run` sur le code actuel et noter les résultats bruts (référence avant modifications).

## 2. Types V2 (nouveau fichier `src/lib/types-v2.ts`)
Selon les sections 6.3, 17 et 17.1 du cahier des charges :
- `TaxonomyFamily`, `TaxonomyCategory` (avec `role` : haut, bas, pièce complète, couche, chaussure, sac, bijou, accessoire, coiffure/perruque, divers), `TaxonomySubcategory` — identifiants stables, `archived`, `custom`.
- `Item` V2 : identité, visuel, apparence (silhouette, style), usage (saison, météo, occasions, formalité, confort, notes), gestion (disponibilité, emplacement, `archived`), suivi (favori, ports, dernière utilisation), métadonnées facultatives, `ai?: AiAnalysis`, et `legacyCategory` pour garder le texte d'origine.
- `Draft` (séparé d'Item, statut brouillon/abandonné), `AiAnalysis` + provenance par champ (suggéré, accepté, final, confiance, source).
- `Outfit` V2 (articles par rôle, favori, archive, variante de), `CalendarEvent` (date, tenue, occasion, statut planifié), `WearRecord` (port réel explicite), `Occasion`, `CorrectionRecord`, `UserProfile`, `BodyProfile`, `RepresentationPreferences`, `Conversation`, `Settings`.
- Les types actuels restent exportés pour que les écrans existants fonctionnent pendant la transition (règle 18.3.6).

## 3. Base locale étendue (`src/lib/db.ts`)
- Passage de la version 1 à 2 : magasins `items`, `plan`, `kv` conservés tels quels ; ajout de `taxonomy`, `drafts`, `outfits`, `calendarEvents`, `wearHistory`, `corrections`, `occasions` (avec index utiles : catégorie, date, tenue).
- Aucune suppression ni vidage d'un magasin existant.
- Fonctions de lecture/écriture minimales pour chaque nouveau magasin.

## 4. Migration idempotente sans perte (`src/lib/migrate.ts`)
Exécutée au démarrage, marquée dans `kv` (`migration:v2`), rejouable sans doublon :
1. Sauvegarde de secours JSON de l'ancien contenu dans `kv` avant toute écriture.
2. Taxonomie initiale (Annexe A, 7 familles) insérée par identifiants fixes — un deuxième passage ne crée rien.
3. Occasions initiales (cours, stage / hôpital, sortie, église, maison, soirée) idem.
4. Articles : ajout de famille/catégorie/sous-catégorie V2 par correspondance (haut, bas, veste→couche, robe→pièce complète, jupe→bas, chaussures, accessoire→bijou/sac/accessoire selon le type) ; texte d'origine conservé ; champs existants intacts.
5. Ancien plan : chaque jour devient une `Outfit` + un `CalendarEvent` « planifié » ; **aucun WearRecord créé**. Le magasin `plan` reste en place.
6. Profil : nouveaux champs facultatifs avec valeurs par défaut, sans action demandée.
7. Erreur pendant la migration : transaction annulée, données d'origine intactes, nouvel essai au prochain démarrage.

## 5. Tests (`src/test/migration.test.ts`, `src/test/persistence.test.ts`)
Avec une base IndexedDB simulée (ajout de `fake-indexeddb` en dépendance de test) :
- Base neuve : taxonomie et occasions créées, aucun article.
- Base V1 existante (T01) : articles, profil et plan toujours lisibles ; un article par ancien article ; correspondances de catégories correctes.
- Plan converti : N jours → N tenues + N événements planifiés, 0 historique porté.
- Idempotence : migration lancée 2 fois → mêmes nombres d'entrées.
- Données partielles (article sans photo/champs, plan vide, profil absent).
- Échec simulé : rien de perdu, migration non marquée terminée.
- Persistance : écriture/relecture dans chaque nouveau magasin après réouverture.
- Les tests existants (`rules`, `app-routing`) doivent rester verts.

## 6. Rapport de fin de phase
Fichiers modifiés, migrations appliquées, tests exécutés avec résultats, erreurs restantes, reste à faire — puis arrêt.

## Points techniques
- Les écrans actuels continuent de lire `items`/`plan` ; la bascule vers `outfits`/`calendarEvents` se fera en phases 2-3.
- Règle d'architecture ajoutée dans `AGENTS.md` : migrations versionnées et idempotentes, jamais de vidage des magasins existants.
