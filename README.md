# Dress My Way

Construis une application web mobile-first (PWA installable sur téléphone Android) appelée Dress My Way, conformément à l'intégralité du cahier des charges joint et aux spécifications suivantes :

1. MISSION ET CONTEXTE
Application en français intégral destinée à une étudiante en médecine vivant à Kinshasa (RDC) avec trois valises et un grand sac de vêtements. Elle fonctionne sur smartphone Android sans ordinateur, sans abonnement obligatoire, avec une gestion fluide des données et une résilience maximale en cas de connexion instable.

2. LE SALON DES 3 STYLISTES IA ET MODE DE SECOURS (RÈGLE DE VÉRITÉ ABSOLUE)
- Intégration de 3 personnalités de stylistes distinctes :
  1. Élise (propulsée par Google Gemini) : spécialisée dans l'élégance, les coupes amples structurées, les pantalons à pinces et les proportions soignées.
  2. Maya (propulsée par Qwen 2.5-VL) : spécialisée dans la créativité, l'analyse fine des textures, motifs, imprimés et touches contemporaines / afro-chic.
  3. Clara (propulsée par Meta Llama 3.2 Vision) : pragmatique et rapide, dédiée au confort quotidien pour les cours de médecine et adaptée à la météo de Kinshasa.
- Fonctionnalités styliste :
  * Discussion libre avec la styliste de son choix.
  * Le « Conseil de style » : consultation des 3 stylistes en parallèle pour comparer 3 visions différentes sur une même pièce ou pour un jour donné.
  * Règle de vérité P0 : Les stylistes ne peuvent recommander QUE des articles réels existant dans le dressing de l'utilisatrice, vérifiés par leurs identifiants uniques. Zéro vêtement halluciné ou inventé.
  * Mode de secours automatique (Fallback) : Si une IA est indisponible ou atteint son quota, les autres prennent le relais, et un moteur local de règles stylistiques (harmonie des couleurs, silhouettes, roue chromatique) prend le relais à 100% hors-connexion.
  * Préférence initiale : Robes et jupes exclues par défaut des suggestions (paramètre modifiable dans le profil). Focus sur pantalons cargos, amples, pinces, jeans, vestes, cardigans, chemises et superpositions.

3. DRESSING ET IMPORTATION SANS EFFORT
- Prise de vue directe depuis l'appareil photo et sélection multiple dans la galerie.
- Extraction par lots d'archives ZIP de photos pour cataloguer rapidement sans bloquer l'appareil.
- Compression automatique des images côté client (dans le navigateur) pour économiser l'espace de stockage et la bande passante.
- Fiches articles complètes : photo, nom, catégorie/sous-catégorie, couleurs dominante et secondaires, motif, matière apparente, coupe, occasion, statut de disponibilité (disponible, au lavage, en réparation, etc.).
- Mode A (Découverte progressive) : Suggestions pour chercher une pièce ciblée dans ses valises et composer une tenue sans avoir à photographier tout son dressing d'un coup.
- Mode B (Organisation) : Catalogue complet, recherche textuelle et filtres multi-critères.

4. PLANIFICATEUR DE RENTRÉE : 15 TENUES EN AVANCE
- Bouton dédié « Préparer mes 15 tenues de rentrée » : génération d'un calendrier sur 3 semaines universitaires (15 jours ouvrés).
- Contrôle strict de la diversité (éviter les répétitions complètes, réutilisation réaliste des bas en variant les hauts et accessoires).
- Prise en compte du statut du linge à laver et bouton de remplacement instantané d'une tenue individuelle en un clic.

5. DESIGN ET THÈMES VISUELS (MODES CLAIR, SOMBRE ET SYSTÈME)
- 3 thèmes intégrés :
  1. Chic Editorial (crème, beige, terracotta, brun)
  2. Colorful Studio (lavande, rose doux, corail, jaune beurre)
  3. Modern Closet (bleu profond, blanc, moderne)

6. STOCKAGE ET INSTALLATION PWA
- Stockage local persistant (IndexedDB) pour un fonctionnement 100% hors-ligne du dressing et des tenues.
- Export et sauvegarde des données en local (JSON).
- Configuration PWA (manifest, service worker) permettant l'installation directe sur l'écran d'accueil d'un smartphone Android.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9898c0c-53d0-4732-8cdc-79f13c3aed0c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
