# 📄 ➜ 📝 Convertisseur Markdown

[![Tests](https://github.com/brissonjo-sudo/convert-to-markdown/actions/workflows/tests.yml/badge.svg)](https://github.com/brissonjo-sudo/convert-to-markdown/actions/workflows/tests.yml)

Un convertisseur universel de fichiers bureautiques en Markdown (.md) — **100 % local, sans installation, sans serveur.**

🔗 **[Utiliser l'application →](https://brissonjo-sudo.github.io/convert-to-markdown/)**

---

## ✨ Comment l'utiliser

1. **Ouvrez** [le lien ci-dessus](https://brissonjo-sudo.github.io/convert-to-markdown/) dans votre navigateur
2. **Glissez** vos fichiers dans la zone de dépôt (ou cliquez pour les sélectionner)
3. **Récupérez** vos `.md` — un par un, ou tous en `.zip`

---

## 🔒 Confidentialité — 100 % local

**Vos fichiers ne quittent jamais votre appareil.**

Toute la conversion s'effectue dans votre navigateur, en JavaScript côté client. Aucun fichier n'est envoyé sur un serveur, aucune donnée n'est collectée, aucun cookie n'est posé.

✅ Adapté pour : arrêtés municipaux, rapports internes, documents administratifs, données RH, courriers confidentiels.

---

## 📋 Formats pris en charge

| Catégorie | Extensions | Ce qui est restitué | Moteur |
| --- | --- | --- | --- |
| Word | `.docx` | Titres, listes, tableaux, images (extraites en fichiers) | mammoth.js + Turndown |
| PDF (texte) | `.pdf` | Titres, paragraphes, listes ; en-têtes et pieds de page répétés retirés | PDF.js |
| Excel | `.xlsx`, `.xls`, `.ods` | Une section par feuille, valeurs telles qu'affichées (dates, montants, %) | SheetJS |
| Données tabulaires | `.csv`, `.tsv` | Tableau ; séparateur et encodage détectés | PapaParse |
| PowerPoint | `.pptx` | Titres, puces, tableaux, images, notes de l'orateur, dans l'ordre réel | JSZip |
| Texte | `.txt` | Texte brut | Natif |
| Page web | `.html`, `.htm` | Structure, tableaux, images intégrées (extraites en fichiers) | Turndown |

Les **images** des documents sont enregistrées à côté du Markdown, dans `images/<document>/`, avec des liens relatifs : un document qui contient des images se télécharge en `.zip` (le `.md` et son dossier d'images).

---

## ⚠️ Limites connues

- **Formats anciens (`.doc` / `.ppt`, avant 2007)** : non pris en charge. Ouvrez-les dans Word/PowerPoint et enregistrez en `.docx` / `.pptx`.
- **PDF scannés (image)** : aucun texte ne peut être extrait sans **OCR**. Un avertissement est ajouté au fichier produit. Pour traiter ces PDF, utilisez d'abord un outil OCR (Adobe Acrobat, ilovepdf.com, Tesseract…).
- **Structure des PDF** : un PDF ne contient que du texte positionné ; titres et paragraphes sont déduits de la mise en page (taille de police, interlignes). Les mises en page complexes (plusieurs colonnes, tableaux) sont restituées imparfaitement. Un mot coupé en fin de ligne garde son trait d'union (« collec-tivités ») : sans dictionnaire, impossible de le distinguer d'un mot composé (« porte-monnaie »).
- **Images `.emf` / `.wmf`** (fréquentes dans les documents Office anciens) : extraites telles quelles, mais la plupart des lecteurs Markdown ne les affichent pas.
- **Connexion internet requise uniquement à la première visite** : les bibliothèques (~1 Mo total) sont chargées depuis le CDN `cdnjs.cloudflare.com`. Dès la première visite en ligne, le service worker les met en cache : l'outil fonctionne ensuite **100 % hors-ligne** (et peut être installé comme une application).

---

## 🔧 Fonctionnalités

- ✅ **Glisser-déposer multi-fichiers** ou sélecteur classique
- ✅ **Conversion par lot en parallèle** — jusqu'à 4 fichiers traités simultanément
- ✅ **Affichage instantané** — les bibliothèques se chargent en arrière-plan sans bloquer la page
- ✅ **Interface qui ne gèle jamais** — les conversions lourdes (Excel, CSV, PowerPoint) tournent dans un Web Worker
- ✅ **Installable (PWA)** — fonctionne 100 % hors-ligne après la première visite
- ✅ **Téléchargement individuel** ou archive `.zip` complète, images comprises
- ✅ **Aperçu intégré** — vérifiez le rendu Markdown avant téléchargement (limité au début des très gros fichiers, pour rester instantané)
- ✅ **Copier dans le presse-papiers** d'un clic — toujours le fichier complet
- ✅ **Détection automatique d'encodage** (UTF-8, UTF-16, Windows-1252) pour les CSV/TXT
- ✅ **Détection des PDF scannés** avec message d'orientation
- ✅ **Accessibilité** : navigation clavier complète, focus trap sur les modales, attributs ARIA

---

## 🚀 Hébergement local (optionnel)

Si vous préférez héberger l'outil sur votre propre serveur ou en local :

```bash
# Cloner le repo
git clone https://github.com/brissonjo-sudo/convert-to-markdown.git
cd convert-to-markdown

# Aucune dépendance à installer !
# Il suffit d'ouvrir index.html dans un navigateur :
xdg-open index.html      # Linux
open index.html          # macOS
start index.html         # Windows
```

Vous pouvez aussi l'utiliser **complètement hors-ligne** : téléchargez juste `index.html`, ouvrez-le, et après le premier chargement les bibliothèques restent en cache.

---

## 🏗️ Architecture technique

- **Quatre fichiers, zéro build** :
  - `index.html` — toute l'application (HTML + CSS + JS). **Ouvert seul, il reste pleinement fonctionnel** (y compris en `file://`), sans le mode hors-ligne géré.
  - `sw.js` — service worker : cache hors-ligne (fichier séparé obligatoire, doit être servi en HTTP(S) même-origine)
  - `manifest.webmanifest` — manifeste PWA (installation)
  - `icone.svg` — icône de l'application
- **Zéro framework** : JavaScript vanilla, pas de webpack, pas de build
- **Conversions lourdes déléguées** : les tableurs / CSV / PowerPoint sont parsés dans un **Web Worker** (construit à partir du bloc `#code-partage` d'`index.html`, sans duplication de code), avec repli automatique sur le fil principal si le worker ne peut pas démarrer
- **Bibliothèques tierces** : chargées depuis [cdnjs.cloudflare.com](https://cdnjs.com), versions épinglées
- **Compatibilité** : Chrome, Edge, Firefox récents (testé sur les 3)

### Sécurité

- ✅ Conversion 100 % côté client (zéro requête réseau pour les fichiers)
- ✅ Construction DOM sécurisée (pas d'`innerHTML` avec données externes → pas de XSS)
- ✅ HTML malveillant neutralisé (DOMParser inerte, `<script>`/`<style>` retirés)
- ✅ Validation par tests automatisés en navigateur (Playwright), à chaque modification

### Tests

Une suite de tests Playwright (`tests/`) vérifie chaque format de bout en bout dans Chromium : fichiers générés à la volée (PDF, Word, PowerPoint, Excel), contenu exact du Markdown produit, archives ZIP téléchargées, Web Worker et repli, fonctionnement hors-ligne. Elle tourne **sans réseau** : un petit serveur de test (`tests/serveur.js`) sert l'application en remplaçant le CDN par les mêmes versions des bibliothèques, installées via npm.

Les tests se lancent automatiquement sur GitHub à chaque pull request et à chaque modification de `main`. Pour les lancer localement :

```bash
npm install                          # outillage de test uniquement
npx playwright install chromium
npm test
```

---

## 🛠️ Contribuer

Pour modifier l'outil :

1. **Modification rapide via GitHub** : cliquez sur le crayon ✏️ sur `index.html`, éditez, commit. L'URL se met à jour en 1-2 min.
2. **Modification locale** : `git clone`, modifier `index.html`, `git push`. Idem.

L'application ne demande ni compilation ni dépendance : `package.json` ne sert qu'aux tests (voir ci-dessus), qui vérifient automatiquement chaque pull request.

> **Note (service worker)** : modifier `index.html` seul ne demande rien de particulier — les pages sont servies « réseau d'abord », la nouvelle version s'affiche au rechargement suivant. En revanche, si vous **changez la version d'une bibliothèque CDN**, mettez à jour son URL dans `index.html` **et** dans `sw.js` (`PRECACHE`), puis incrémentez la constante `VERSION` de `sw.js` pour purger l'ancien cache.

---

## 📅 Roadmap (idées, non engageant)

- 🔭 OCR pour les PDF scannés (Tesseract.js — décision en attente, ~20 Mo à charger)
- 🔭 Support `.epub` (e-books)
- 🔭 Interface mobile optimisée (actuellement responsive mais perfectible)

---

## 📜 Licence

MIT — voir le fichier `LICENSE`. Utilisez, modifiez, partagez librement.

---

*Outil développé pour faciliter la rédaction et l'archivage de documents administratifs.*
