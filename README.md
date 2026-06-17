# 📄 ➜ 📝 Convertisseur Markdown

Un convertisseur universel de fichiers bureautiques en Markdown (.md) — **100 % local, sans installation, sans serveur.**

🔗 **[Utiliser l'application →](https://brissonjo-sudo.github.io/convertisseur-to-markdown/)**

---

## ✨ Comment l'utiliser

1. **Ouvrez** [le lien ci-dessus](https://brissonjo-sudo.github.io/convertisseur-to-markdown/) dans votre navigateur
2. **Glissez** vos fichiers dans la zone de dépôt (ou cliquez pour les sélectionner)
3. **Récupérez** vos `.md` — un par un, ou tous en `.zip`

---

## 🔒 Confidentialité — 100 % local

**Vos fichiers ne quittent jamais votre appareil.**

Toute la conversion s'effectue dans votre navigateur, en JavaScript côté client. Aucun fichier n'est envoyé sur un serveur, aucune donnée n'est collectée, aucun cookie n'est posé.

✅ Adapté pour : arrêtés municipaux, rapports internes, documents administratifs, données RH, courriers confidentiels.

---

## 📋 Formats pris en charge

| Catégorie | Extensions | Moteur |
| --- | --- | --- |
| Word | `.docx` | mammoth.js + Turndown |
| PDF (texte) | `.pdf` | PDF.js |
| Excel | `.xlsx`, `.xls`, `.ods` | SheetJS |
| Données tabulaires | `.csv`, `.tsv` | PapaParse |
| PowerPoint | `.pptx` | JSZip |
| Texte | `.txt` | Natif |
| Page web | `.html`, `.htm` | Turndown |

---

## ⚠️ Limites connues

- **Formats anciens (`.doc` / `.ppt`, avant 2007)** : non pris en charge. Ouvrez-les dans Word/PowerPoint et enregistrez en `.docx` / `.pptx`.
- **PDF scannés (image)** : aucun texte ne peut être extrait sans **OCR**. Un avertissement est ajouté au fichier produit. Pour traiter ces PDF, utilisez d'abord un outil OCR (Adobe Acrobat, ilovepdf.com, Tesseract…).
- **Connexion internet requise au premier chargement** : les bibliothèques (~1 Mo total) sont chargées depuis le CDN `cdnjs.cloudflare.com`. Elles sont ensuite mises en cache par votre navigateur — l'outil fonctionne hors-ligne après cette première fois.

---

## 🔧 Fonctionnalités

- ✅ **Glisser-déposer multi-fichiers** ou sélecteur classique
- ✅ **Conversion par lot** — traitez plusieurs fichiers en une fois
- ✅ **Téléchargement individuel** ou archive `.zip` complète
- ✅ **Aperçu intégré** — vérifiez le rendu Markdown avant téléchargement
- ✅ **Copier dans le presse-papiers** d'un clic
- ✅ **Détection automatique d'encodage** (UTF-8, UTF-16, Windows-1252) pour les CSV/TXT
- ✅ **Détection des PDF scannés** avec message d'orientation
- ✅ **Accessibilité** : navigation clavier complète, focus trap sur les modales, attributs ARIA

---

## 🚀 Hébergement local (optionnel)

Si vous préférez héberger l'outil sur votre propre serveur ou en local :

```bash
# Cloner le repo
git clone https://github.com/brissonjo-sudo/convertisseur-markdown.git
cd convertisseur-markdown

# Aucune dépendance à installer !
# Il suffit d'ouvrir index.html dans un navigateur :
xdg-open index.html      # Linux
open index.html          # macOS
start index.html         # Windows
```

Vous pouvez aussi l'utiliser **complètement hors-ligne** : téléchargez juste `index.html`, ouvrez-le, et après le premier chargement les bibliothèques restent en cache.

---

## 🏗️ Architecture technique

- **Un seul fichier** : tout est dans `index.html` (HTML + CSS + JS, ~800 lignes)
- **Zéro framework** : JavaScript vanilla, pas de webpack, pas de build
- **Bibliothèques tierces** : chargées depuis [cdnjs.cloudflare.com](https://cdnjs.com), versions épinglées
- **Compatibilité** : Chrome, Edge, Firefox récents (testé sur les 3)

### Sécurité

- ✅ Conversion 100 % côté client (zéro requête réseau pour les fichiers)
- ✅ Construction DOM sécurisée (pas d'`innerHTML` avec données externes → pas de XSS)
- ✅ HTML malveillant neutralisé (DOMParser inerte, `<script>`/`<style>` retirés)
- ✅ Validation par tests automatisés en navigateur (Playwright)

---

## 🛠️ Contribuer

Pour modifier l'outil :

1. **Modification rapide via GitHub** : cliquez sur le crayon ✏️ sur `index.html`, éditez, commit. L'URL se met à jour en 1-2 min.
2. **Modification locale** : `git clone`, modifier `index.html`, `git push`. Idem.

Aucune compilation, aucun build, aucune dépendance npm.

---

## 📅 Roadmap (idées, non engageant)

- 🔭 OCR pour les PDF scannés (Tesseract.js — décision en attente, ~20 Mo à charger)
- 🔭 Extraction des images intégrées dans les `.docx` et `.pptx`
- 🔭 Mode PWA installable (utilisation hors-ligne complète après une visite)
- 🔭 Support `.epub` (e-books)
- 🔭 Interface mobile optimisée (actuellement responsive mais perfectible)

---

## 📜 Licence

MIT — voir le fichier `LICENSE`. Utilisez, modifiez, partagez librement.

---

*Outil développé pour faciliter la rédaction et l'archivage de documents administratifs.*
