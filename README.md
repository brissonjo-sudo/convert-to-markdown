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

Toute la conversion s'effectue dans votre navigateur, en JavaScript côté client, y compris la reconnaissance de texte (OCR). Aucun fichier n'est envoyé sur un serveur, aucune donnée n'est collectée, aucun cookie n'est posé.

Cette promesse n'est pas seulement tenue par le code : **le navigateur l'impose**.
- Une **politique de sécurité (CSP)** interdit à la page toute connexion vers un autre serveur que les deux CDN (en lecture seule) qui fournissent les bibliothèques. Même une bibliothèque compromise ne pourrait pas envoyer vos documents ailleurs.
- Chaque bibliothèque est **vérifiée par son empreinte (SRI)** : un fichier modifié sur le CDN est refusé et ne s'exécute pas. La CI compare ces empreintes aux fichiers réellement servis.

✅ Adapté pour : arrêtés municipaux, rapports internes, documents administratifs, données RH, courriers confidentiels.

---

## 📋 Formats pris en charge

| Catégorie | Extensions | Ce qui est restitué | Moteur |
| --- | --- | --- | --- |
| Word | `.docx` | Titres, listes, tableaux (cellules fusionnées comprises), images (extraites en fichiers), notes de bas de page | mammoth.js + Turndown |
| LibreOffice Writer | `.odt` | Titres, mise en forme, listes, tableaux, images, notes de bas de page | JSZip |
| PDF (texte) | `.pdf` | Titres, paragraphes, listes ; en-têtes et pieds de page répétés retirés | PDF.js |
| PDF scanné | `.pdf` | Texte reconnu par **OCR** (français), à la demande, sur votre appareil | PDF.js + Tesseract.js |
| Excel | `.xlsx`, `.xls`, `.ods` | Une section par feuille, valeurs telles qu'affichées (dates, montants, %) | SheetJS |
| Données tabulaires | `.csv`, `.tsv` | Tableau ; séparateur et encodage détectés | PapaParse |
| PowerPoint | `.pptx` | Titres, puces, tableaux, images, notes de l'orateur, dans l'ordre réel | JSZip |
| LibreOffice Impress | `.odp` | Titres, puces, tableaux, images, notes de l'orateur | JSZip |
| Texte | `.txt` | Texte brut | Natif |
| Page web | `.html`, `.htm` | Structure, tableaux, images intégrées (extraites en fichiers) | Turndown |

Les **images** des documents sont enregistrées à côté du Markdown, dans `images/<document>/`, avec des liens relatifs : un document qui contient des images se télécharge en `.zip` (le `.md` et son dossier d'images).

---

## ⚠️ Limites connues

- **Formats anciens (`.doc` / `.ppt`, avant 2007)** : non pris en charge. Ouvrez-les dans Word/PowerPoint et enregistrez en `.docx` / `.pptx`.
- **OCR des PDF scannés** : proposé par un bouton dans le journal. Le premier usage télécharge environ **5 Mo** (moteur et données françaises), ensuite conservés pour un usage hors-ligne. La qualité dépend de celle du scan : le texte reconnu est signalé comme « à relire », avec la confiance moyenne. Français uniquement. Seuls les PDF entièrement scannés sont détectés (pas une page scannée au milieu d'un PDF texte).
- **Données de langue de l'OCR** : ce sont des données, pas du code, et elles ne sont pas vérifiées par empreinte ; la CSP garantit qu'elles ne peuvent venir que du CDN jsDelivr.
- **Structure des PDF** : un PDF ne contient que du texte positionné ; titres et paragraphes sont déduits de la mise en page (taille de police, interlignes). Les mises en page complexes (plusieurs colonnes, tableaux) sont restituées imparfaitement. Un mot coupé en fin de ligne garde son trait d'union (« collec-tivités ») : sans dictionnaire, impossible de le distinguer d'un mot composé (« porte-monnaie »).
- **Images `.emf` / `.wmf`** (fréquentes dans les documents Office anciens) : extraites telles quelles, mais la plupart des lecteurs Markdown ne les affichent pas.
- **Connexion internet requise uniquement à la première visite** : les bibliothèques (~1 Mo total) sont chargées depuis le CDN `cdnjs.cloudflare.com` (et `cdn.jsdelivr.net` pour l'OCR). Dès la première visite en ligne, le service worker les met en cache : l'outil fonctionne ensuite **100 % hors-ligne** (et peut être installé comme une application).

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
- ✅ **OCR des PDF scannés** — reconnaissance du texte sur votre appareil, à la demande, disponible hors-ligne après un premier usage
- ✅ **Formats LibreOffice** (`.odt`, `.ods`, `.odp`) au même titre que Microsoft Office
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
- **Bibliothèques tierces** : chargées depuis [cdnjs.cloudflare.com](https://cdnjs.com) (et [jsDelivr](https://www.jsdelivr.com) pour l'OCR), versions épinglées, empreintes SRI vérifiées
- **Compatibilité** : Chrome, Edge, Firefox récents (testé sur les 3)

### Sécurité

- ✅ Conversion 100 % côté client (zéro requête réseau pour les fichiers)
- ✅ CSP : aucune connexion possible vers un serveur tiers (vérifié par des tests qui tentent des fuites)
- ✅ SRI : toute bibliothèque, y compris celles chargées par les workers et l'OCR, est vérifiée par son empreinte
- ✅ Construction DOM sécurisée (pas d'`innerHTML` avec données externes → pas de XSS)
- ✅ HTML malveillant neutralisé (DOMParser inerte, `<script>`/`<style>` retirés)
- ✅ Validation par tests automatisés en navigateur (Playwright), à chaque modification

### Tests

Une suite de tests Playwright (`tests/`) vérifie chaque format de bout en bout dans Chromium : fichiers générés à la volée (PDF, PDF scanné, Word, PowerPoint, Excel, LibreOffice), fichiers réels produits par LibreOffice et pandoc (`tests/fichiers/`, régénérables par `generer.sh`), contenu exact du Markdown produit, archives ZIP téléchargées, Web Worker et repli, OCR, fonctionnement hors-ligne, confidentialité (CSP et SRI). Tout test échoue s'il provoque une violation de la CSP ou un échec de vérification d'empreinte. Elle tourne **sans réseau** : un petit serveur de test (`tests/serveur.js`) sert l'application en remplaçant le CDN par les mêmes versions des bibliothèques, installées via npm.

Les tests se lancent automatiquement sur GitHub à chaque pull request et à chaque modification de `main`, avec une vérification des empreintes SRI contre les fichiers réellement servis par les CDN (`tests/verifier-cdn.js`). Pour les lancer localement :

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

> **Note (bibliothèques et service worker)** : modifier `index.html` seul ne demande rien de particulier — les pages sont servies « réseau d'abord », la nouvelle version s'affiche au rechargement suivant. En revanche, si vous **changez la version d'une bibliothèque CDN** :
> 1. mettez à jour son URL **et son empreinte** dans `index.html` (attribut `integrity` de la balise, ou table `INTEGRITE`) ; `node tests/verifier-cdn.js` donne l'empreinte réelle ;
> 2. mettez à jour l'URL dans `sw.js` (`PRECACHE`) et incrémentez sa constante `VERSION` pour purger l'ancien cache ;
> 3. pour les tests, épinglez la même version dans `package.json`.

---

## 📅 Roadmap (idées, non engageant)

- 🔭 OCR des pages scannées au milieu d'un PDF texte, et d'autres langues que le français
- 🔭 Support `.epub` (e-books)
- 🔭 Interface mobile optimisée (actuellement responsive mais perfectible)

---

## 📜 Licence

MIT — voir le fichier `LICENSE`. Utilisez, modifiez, partagez librement.

---

*Outil développé pour faciliter la rédaction et l'archivage de documents administratifs.*
