#!/usr/bin/env bash
# Régénère les fichiers réels de test (produits par de vrais logiciels, et non par
# tests/fabriques.js) à partir de leurs sources. Nécessite pandoc et LibreOffice.
# Usage : bash tests/fichiers/generer.sh
set -euo pipefail
cd "$(dirname "$0")"
pandoc rapport.md -o rapport.docx                                    # Word (pandoc)
soffice --headless --convert-to odt rapport.docx >/dev/null          # Writer (LibreOffice)
soffice --headless --convert-to odt:writer8 --infilter="HTML (StarWriter)" tableau.html >/dev/null
pandoc presentation.md -o presentation.pptx                          # PowerPoint (pandoc)
soffice --headless --convert-to odp presentation.pptx >/dev/null     # Impress (LibreOffice)
