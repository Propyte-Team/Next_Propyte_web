#!/usr/bin/env bash
# Reconstruye y prepara el build de PRODUCCION para servirlo en :3199.
#
# ⚠️ NO PIPEAR `npm run build` A `grep`/`tail`. La version anterior de este
# script hacia `npm run build | grep -E "Compiled successfully|..." || true` y
# ESO TAPO UN BUILD ROTO: Next imprime "Compiled successfully" y MUERE despues,
# en la fase de prerender. El `|| true` remataba el enmascaramiento. El sintoma
# fue `.next/standalone` inexistente y un `cp` fallando por una razon que no
# tenia nada que ver con la causa.
#
# Aqui el build escribe a un log, se comprueba SU exit code, y solo entonces se
# sigue. Ver [[feedback_pipe_a_tail_se_come_el_exit_code]].
#
# Y `output: 'standalone'` en next.config => `next start` NO sirve este build.
set -euo pipefail
cd "$(dirname "$0")"

npm run build > build.log 2>&1 || {
  echo "✗ BUILD FALLIDO. Ultimas lineas:"
  tail -30 build.log
  exit 1
}
grep -q "Compiled successfully" build.log || { echo "✗ build sin 'Compiled successfully'"; exit 1; }

# El propio build es el testigo de que el standalone existe.
test -d .next/standalone || { echo "✗ .next/standalone no se genero"; tail -20 build.log; exit 1; }

# El copiado tiene que ser LIMPIO: `cp -r public dest/public` sobre un destino
# que ya existe anida `dest/public/public` y deja medio arbol fuera. Eso ya
# produjo un 404 del logo que parecia un bug del codigo.
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp .env.local .next/standalone/.env.local

test -f .next/standalone/public/img/logos/logo-horizontal-white.png \
  || { echo "✗ assets incompletos"; exit 1; }

echo "✓ build + assets OK"
echo "  arranca: (cd .next/standalone && PORT=3199 HOSTNAME=127.0.0.1 node server.js)"
