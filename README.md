# 📄 ➜ 📝 Convertisseur Markdown

[![Tests](https://github.com/brissonjo-sudo/convert-to-markdown/actions/workflows/tests.yml/badge.svg)](https://github.com/brissonjo-sudo/convert-to-markdown/actions/workflows/tests.yml)

Un convertisseur de fichiers bureautiques en Markdown (.md) — **100 % local, sans installation, sans serveur.**

🔗 **[Utiliser l'application →](https://brissonjo-sudo.github.io/convert-to-markdown/)**

---

## ✨ Comment l'utiliser

1. **Ouvrez** [le lien ci-dessus](https://brissonjo-sudo.github.io/convert-to-markdown/) dans votre navigateur
2. **Ajoutez** vos documents : glissez-les dans la zone de dépôt, cliquez pour les choisir, ou **collez** (Ctrl+V) un texte copié depuis Word, un mail ou une page web
3. *(Facultatif)* **Cochez** « En-tête Obsidian » si vous rangez vos notes dans Obsidian
4. **Récupérez** vos `.md` — un par un, ou tous en `.zip`

PDF scanné ou photo de document : cliquez sur **« Reconnaître le texte (OCR) »** dans le journal de conversion.

---

## 🔒 Confidentialité — 100 % local

**Vos fichiers ne quittent jamais votre appareil.**

Toute la conversion s'effectue dans votre navigateur, y compris la reconnaissance de texte (OCR). Aucun fichier n'est envoyé sur un serveur, aucune donnée n'est collectée, aucun cookie n'est posé.

Cette promesse n'est pas seulement tenue par le code : **le navigateur l'impose**.
- Il **bloque toute connexion** vers un autre serveur que ceux qui fournissent les composants de l'outil, en lecture seule. Même un composant piraté ne pourrait pas envoyer vos documents ailleurs.
- Chaque composant téléchargé est **vérifié** : s'il a été modifié, il est refusé et ne s'exécute pas.

Détails techniques : voir [Sécurité](#sécurité).

✅ Adapté pour : arrêtés municipaux, rapports internes, documents administratifs, données RH, courriers confidentiels.

---

## 📋 Formats pris en charge

| Catégorie | Extensions | Ce qui est restitué | Moteur |
| --- | --- | --- | --- |
| Word | `.docx` | Titres, listes, tableaux (cellules fusionnées comprises), images (extraites en fichiers), notes de bas de page | mammoth.js + Turndown |
| LibreOffice Writer | `.odt` | Titres, mise en forme, listes, tableaux, images, notes de bas de page | JSZip |
| PDF (texte) | `.pdf` | Titres, paragraphes, listes ; en-têtes et pieds de page répétés retirés | PDF.js |
| PDF scanné | `.pdf` | Texte reconnu par **OCR** (français), à la demande, sur votre appareil — document entier ou seulement les pages scannées d'un PDF texte (annexe signée, courrier numérisé) | PDF.js + Tesseract.js |
| Tableur (Excel, LibreOffice Calc) | `.xlsx`, `.xls`, `.ods` | Une section par feuille, valeurs telles qu'affichées (dates, montants, %) | SheetJS 0.20 |
| Données tabulaires | `.csv`, `.tsv` | Tableau ; séparateur et encodage détectés | PapaParse |
| PowerPoint | `.pptx` | Titres, puces, tableaux, images, notes de l'orateur, dans l'ordre réel | JSZip |
| LibreOffice Impress | `.odp` | Titres, puces, tableaux, images, notes de l'orateur | JSZip |
| Photo de document | `.png`, `.jpg`, `.jpeg`, `.webp` | Texte reconnu par **OCR** (français), à la demande | Tesseract.js |
| Texte | `.txt` | Texte brut | Natif |
| Page web | `.html`, `.htm` | Structure, tableaux, images intégrées (extraites en fichiers) | Turndown |
| Courriel | `.eml` | Expéditeur, destinataires, date, objet, corps (version HTML de préférence), images intégrées ; pièces jointes extraites dans `pieces-jointes/<document>/` | Natif + Turndown |
| Livre numérique | `.epub` | Chapitres dans l'ordre de lecture, titres, images | JSZip + Turndown |

Les **images** des documents sont enregistrées à côté du Markdown, dans `images/<document>/`, avec des liens relatifs : un document qui contient des images se télécharge en `.zip` (le `.md` et son dossier d'images).

---

## 🔧 Fonctionnalités

- ✅ **Plusieurs fichiers à la fois** : glisser-déposer ou sélecteur classique, jusqu'à 4 conversions en parallèle
- ✅ **Coller (Ctrl+V)** un texte copié depuis Word, un mail ou une page web : converti directement en Markdown (une capture d'écran collée passe par l'OCR)
- ✅ **OCR des PDF scannés et des photos de documents** : reconnaissance du texte sur votre appareil, à la demande
- ✅ **Aperçu** avant téléchargement (limité au début des très gros fichiers, pour rester instantané) et **copie en un clic** — toujours le fichier complet
- ✅ **Téléchargement individuel** ou archive `.zip` complète, images comprises
- ✅ **En-tête Obsidian** (case à cocher) : propriétés `title`, `source` et `date` en tête de chaque `.md`, choix mémorisé
- ✅ **Hors ligne** : après une première visite, l'outil fonctionne sans connexion, et peut s'installer comme une application
- ✅ **Interface fluide**, même pendant la conversion de gros tableurs
- ✅ **Encodage détecté automatiquement** (UTF-8, UTF-16, Windows-1252) pour les CSV et TXT
- ✅ **Formats LibreOffice** (`.odt`, `.ods`, `.odp`) au même titre que Microsoft Office
- ✅ **Mode sombre** : l'interface suit le réglage de votre système
- ✅ **Utilisable entièrement au clavier**

---

## ⚠️ Limites connues

- **Formats anciens (`.doc` / `.ppt`, avant 2007)** : non pris en charge. Ouvrez-les dans Word/PowerPoint et enregistrez en `.docx` / `.pptx`.
- **OCR** : français uniquement. La qualité dépend de celle du scan ou de la photo : le texte reconnu est signalé « à relire », avec la confiance moyenne. Une page est reconnue comme scannée si elle contient une image et presque pas de texte : une page mêlant texte et passage scanné n'est pas détectée. Sur une photo de quelques lignes, la séparation entre paragraphes est approximative.
- **Structure des PDF** : un PDF ne contient que du texte positionné ; titres et paragraphes sont déduits de la mise en page (taille de police, interlignes). Les mises en page complexes (plusieurs colonnes, tableaux) sont restituées imparfaitement. Un mot coupé en fin de ligne garde son trait d'union (« collec-tivités ») : sans dictionnaire, impossible de le distinguer d'un mot composé (« porte-monnaie »).
- **Courriels** : format `.eml` uniquement, produit par Thunderbird, Outlook sur le web et le nouvel Outlook (*Télécharger*). L'Outlook classique enregistre en `.msg`, format non pris en charge. Les images distantes d'un courriel (souvent des pixels de suivi) ne sont pas recopiées, seul leur texte alternatif est gardé.
- **Livres numériques** : les `.epub` protégés par DRM ne sont pas lisibles.
- **Images `.emf` / `.wmf`** (fréquentes dans les documents Office anciens) : extraites telles quelles, mais la plupart des lecteurs Markdown ne les affichent pas.
- **Première visite** : une connexion internet est nécessaire pour télécharger les composants de l'outil (environ 3 Mo, une seule fois), plus environ 5 Mo au premier usage de l'OCR. Tout reste ensuite disponible hors ligne.

---

## 🚀 Hébergement local (optionnel)

Si vous préférez héberger l'outil sur votre propre serveur ou en local :

```bash
# Cloner le repo
git clone https://github.com/brissonjo-sudo/convert-to-markdown.git
cd convert-to-markdown

# Aucune dépendance à installer : servir le dossier suffit
python -m http.server 8000   # puis ouvrir http://localhost:8000
```

Ouvert directement (double-clic sur `index.html`, sans serveur), l'outil fonctionne aussi, mais **sans mode hors ligne garanti** : celui-ci repose sur un service worker, que les navigateurs n'activent qu'à travers un serveur (le lien en ligne, ou un serveur local comme ci-dessus).

---

## 🏗️ Architecture technique

- **Quatre fichiers, zéro build** :
  - `index.html` — toute l'application (HTML + CSS + JS). **Ouvert seul, il reste pleinement fonctionnel** (y compris en `file://`), sans le mode hors ligne.
  - `sw.js` — service worker : cache hors ligne (fichier séparé obligatoire, doit être servi en HTTP(S) même-origine)
  - `manifest.webmanifest` — manifeste PWA (installation)
  - `icone.svg` — icône de l'application
- **Zéro framework** : JavaScript vanilla, pas de webpack, pas de build
- **Conversions lourdes déléguées** : les tableurs / CSV / PowerPoint / OpenDocument sont parsés dans un **Web Worker** (construit à partir du bloc `#code-partage` d'`index.html`, sans duplication de code), avec repli automatique sur le fil principal si le worker ne peut pas démarrer
- **Hors ligne (PWA)** : le service worker met en cache les bibliothèques à la première visite, et les fichiers de l'OCR à son premier usage
- **Bibliothèques tierces** : chargées depuis [cdnjs.cloudflare.com](https://cdnjs.com), [cdn.sheetjs.com](https://cdn.sheetjs.com) pour SheetJS (plus publié sur cdnjs depuis la 0.18.5, vulnérable) et [jsDelivr](https://www.jsdelivr.com) pour l'OCR, versions épinglées, empreintes SRI vérifiées
- **Accessibilité** : navigation clavier complète, focus piégé dans la fenêtre d'aperçu, attributs ARIA, journal annoncé aux lecteurs d'écran (`aria-live`)
- **Compatibilité** : Chrome, Edge et Firefox récents ; tests automatisés sous Chromium

### Sécurité

- ✅ Conversion 100 % côté client (zéro requête réseau pour les fichiers)
- ✅ CSP : la page ne peut se connecter qu'à elle-même et aux trois CDN ci-dessus, en lecture seule (vérifié par des tests qui tentent des fuites)
- ✅ SRI : toute bibliothèque, y compris celles chargées par les workers et l'OCR, est vérifiée par son empreinte ; la CI compare ces empreintes aux fichiers réellement servis par les CDN
- ✅ Données de langue de l'OCR : ce sont des données, pas du code, et elles ne sont pas vérifiées par empreinte ; la CSP garantit qu'elles ne peuvent venir que de jsDelivr
- ✅ Construction DOM sécurisée (pas d'`innerHTML` avec données externes → pas de XSS)
- ✅ HTML malveillant neutralisé (DOMParser inerte, `<script>`/`<style>` retirés)
- ✅ Liens exécutables (`javascript:`, `vbscript:`, `data:`) retirés du Markdown produit : un clic dans votre éditeur ne peut rien exécuter
- ✅ Pièces jointes des courriels : noms rendus sûrs (un nom piégé « ../ » ne peut pas sortir de son dossier à l'extraction du ZIP) ; images distantes non recopiées
- ✅ Validation par tests automatisés en navigateur (Playwright), à chaque modification

### Tests

Une suite de tests Playwright (`tests/`) vérifie chaque format de bout en bout dans Chromium : fichiers générés à la volée (PDF, PDF scanné, photo, Word, PowerPoint, Excel, LibreOffice, courriel, EPUB), fichiers réels produits par LibreOffice et pandoc (`tests/fichiers/`, régénérables par `generer.sh`), contenu exact du Markdown produit, archives ZIP téléchargées, Web Worker et repli, OCR, collage, fonctionnement hors ligne, confidentialité (CSP et SRI). Tout test échoue s'il provoque une violation de la CSP ou un échec de vérification d'empreinte. Elle tourne **sans réseau** : un petit serveur de test (`tests/serveur.js`) sert l'application en remplaçant les CDN par les mêmes versions des bibliothèques, installées via npm.

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
> 3. pour les tests, épinglez la même version dans `package.json` (SheetJS : archive `https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`, l'éditeur ne publiant plus sur npm).

---

## 📅 Roadmap (idées, non engageant)

- 🔭 OCR dans d'autres langues que le français
- 🔭 Courriels Outlook `.msg`
- 🔭 Interface mobile optimisée (actuellement responsive mais perfectible)

---

## 📜 Licence

MIT — voir le fichier `LICENSE`. Utilisez, modifiez, partagez librement.

---

*Outil développé pour faciliter la rédaction et l'archivage de documents administratifs.*
