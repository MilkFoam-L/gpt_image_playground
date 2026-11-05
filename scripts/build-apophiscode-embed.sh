#!/usr/bin/env bash
# Build the copy embedded in ApophisCode (new-api) under /image-studio-app/.
# Usage: scripts/build-apophiscode-embed.sh <new-api>/web/public/image-studio-app
set -euo pipefail
out="${1:?target directory required}"
rm -rf dist
VITE_DEFAULT_UI_FONT=system VITE_DEFAULT_MONO_FONT=system VITE_DISABLE_SW=true \
  npx vite build --base=/image-studio-app/
rm -f dist/sw.js
# Go's FileServer redirects explicit /index.html requests, so the host loads app.html.
cp dist/index.html dist/app.html
cp LICENSE dist/LICENSE.txt
rm -rf "$out"
cp -R dist "$out"
