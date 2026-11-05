#!/usr/bin/env bash
# Build the copy embedded in ApophisCode (new-api) under /image-studio-app/.
# Usage: scripts/build-apophiscode-embed.sh <new-api>/web/public/image-studio-app
set -euo pipefail
out="${1:?target directory required}"
rm -rf dist
# The preset points at the hosting origin (see defaultApiUrl.ts) and is the only
# provider users can use; the host passes the user's own key via ?apiKey=.
VITE_APOPHISCODE_EMBED=true \
VITE_DEFAULT_API_URL='/v1?model=gpt-image-2.5&apiMode=images&profileName=ApophisCode' \
VITE_SHOW_PRESET_CONFIG_ONLY=true \
VITE_LOCK_PRESET_CONFIG_PARAMS=true \
VITE_DEFAULT_UI_FONT=system VITE_DEFAULT_MONO_FONT=system VITE_DISABLE_SW=true \
  npx vite build --base=/image-studio-app/
rm -f dist/sw.js
# Go's FileServer redirects explicit /index.html requests, so the host loads app.html.
cp dist/index.html dist/app.html
cp LICENSE dist/LICENSE.txt
rm -rf "$out"
cp -R dist "$out"
