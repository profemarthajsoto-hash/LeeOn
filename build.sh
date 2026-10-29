#!/bin/bash
# Une style.css + js/*.js en un solo HTML autocontenido.
#   ./build.sh index.html        → versión simple (abrir con doble clic o publicar)
#   ./build.sh index.html pwa    → añade manifest + service worker (requiere servidor http/https)
set -e
cd "$(dirname "$0")"
OUT=${1:-index.html}
MODE=${2:-plain}
MANIFEST=""; SW=""
if [ "$MODE" = "pwa" ]; then
  MANIFEST='<link rel="manifest" href="manifest.json"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png">'
  SW="if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) { window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }); }"
fi
{
cat <<HEAD
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#1D64CF">
<title>LeeOn · Aprendemos juntos, paso a paso</title>
$MANIFEST
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@500;600&display=swap">
<style>
HEAD
cat style.css
cat <<'MID'
</style>
</head>
<body>
<button type="button" class="skip" id="skip">Saltar al contenido</button>
<div id="toasts" aria-live="polite" role="status"></div>
<div id="app"></div>
<noscript>LeeOn necesita JavaScript para funcionar.</noscript>
<script>
(function () {
'use strict';
MID
for f in js/0*.js; do cat "$f"; echo; done
echo "$SW"
cat <<'TAIL'
})();
</script>
</body>
</html>
TAIL
} > "$OUT"
echo "Generado $OUT ($(wc -c < "$OUT") bytes, modo $MODE)"
