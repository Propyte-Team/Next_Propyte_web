# Roadmap de remediación — auditoría de diseño de propyte.com

**Fecha:** 2026-08-06
**Autor:** Luis Flores + Claude
**Estado:** Aprobado
**Origen:** auditoría UX/UI de las 92 rutas `/es` en producción, 6-ago-2026.
Informe navegable: https://claude.ai/code/artifact/6fe68e0c-0aaf-46fd-b597-d02e3112a676

## Qué encontró la auditoría

92 páginas medidas en navegador real (Chromium 1440×900 y 390×844), 714 capturas,
axe-core WCAG 2.1 AA por página y revisión visual de las 92. Resultado: 204 hallazgos
—41 P0, 50 P1, 69 P2, 44 P3—, diseño 5,3/10 de media, técnica 15,1/20, heurísticas de
Nielsen 24/40.

El patrón de fondo: **el sitio está bien construido y mal abastecido.** Las plantillas
mejor construidas son las que peor puntúan en diseño; las 13 fichas de desarrollo
promedian 16,19/20 técnico y 4,08/10 de diseño. No falla el código, falla lo que se le
pide mostrar.

## Por qué siete frentes y no un plan

Los 204 hallazgos no forman un proyecto: tocan verdad del dato, enrutado, cumplimiento
legal, accesibilidad, deuda de tokens, rendimiento y contenido. Un spec único mezclaría
decisiones de negocio con CSS y no se ejecutaría. Cada frente se especifica cuando le
toca, con su propio ciclo spec → plan → implementación.

| | Frente | Contenido | Severidad | Depende de |
|---|---|---|---|---|
| **A** | Verdad del dato | Yield constante en `/es/rentas`, «Alta Demanda» invariable en 45 zonas, KPIs en «—» sobre gráficas pobladas, plural roto («1 desarrollos activos en 1 zonas») | 4 P0 | — |
| **B** | Rutas rotas | Sitemap que ignora la compuerta de publicación, 8 facetas de desarrollo con cero resultados, listado móvil inalcanzable en `/propiedades` | 3 P0 | — |
| **C** | Cumplimiento | Nombres de proveedores de datos visibles al usuario | 1 P0, riesgo legal | — |
| **D** | Accesibilidad | Contraste bajo AA en 52 páginas, objetivos táctiles <44 px en 78, campos sin etiqueta en 12, landmarks y ARIA | 1 P0 + 4 P1 | — |
| **E** | Sistema de diseño | 1.354 colores en crudo en 165 archivos, migas ausentes en 58 páginas, tipografía declarada ≠ renderizada | P1, deuda | conviene después de D |
| **F** | Rendimiento | `/es/desarrollos` 9,7 MB / 506 imágenes / 250 peticiones, Mérida FCP 10,7 s, home de 12.560 px | P1 | — |
| **G** | Contenido y lugar | Fotografía real en las 45 zonas, CTA parametrizado por zona, placeholder publicado en `/es/nosotros/estructura`, decisión sobre `built` y `destacados` | P1/P2 | A (el CTA depende de qué dato exista) |

## Secuencia acordada

**Frente 1: B + C juntos** — «detener el daño». Son los dos únicos frentes mecánicos:
no piden criterio de diseño, se verifican objetivamente y hoy están costando catálogo y
exposición legal cada día. Spec propio en
`2026-08-06-frente-b-c-rutas-y-atribucion-design.md`.

El orden posterior se decide al cerrar el primer frente. La recomendación de partida,
sujeta a revisión: **A** (sostiene la única ventaja diferenciada del producto y desbloquea
G), luego **D** (mayor alcance por páginas, con la victoria más barata del informe: un
token de color arregla 45 páginas), luego **F**, **G** y **E**.

## Enfoque de remediación, común a todos los frentes

Aprobado el 6-ago-2026: **parche con red de seguridad**. Cada corrección va acompañada de
la prueba que la habría atrapado, escrita antes del arreglo y observada fallar.

El argumento sale de la propia auditoría. La regla de no nombrar proveedores de datos ya
existía, documentada y con un grep prescrito para verificarla antes de publicar; aun así
llegó a producción. La compuerta de visibilidad ya existe y la respetan quince páginas;
el sitemap no la consulta. En los dos casos la idea era correcta y lo que faltaba era algo
que verificara su aplicación. Parchear el síntoma sin dejar el verificador es firmar el
mismo hallazgo dentro de seis meses.

## Entrega

Rama propia por sub-frente desde `main` actualizado, merge incremental, verificación en
producción antes de pasar al siguiente. Producción despliega por push a `main` con pull
por cron: una pieza no se da por cerrada hasta que su comprobación pasa **sobre
propyte.com**, no sobre local.

## Correcciones al informe publicado

Dos hallazgos del informe se afinaron al investigar el código, y el spec del frente B+C
parte de la versión corregida:

1. `/es/built` y `/es/destacados` **no son rutas rotas.** Existen, están commiteadas en
   `origin/main` y devuelven 404 a propósito: `assertPageVisible()` las apaga según una
   compuerta gobernada desde el Hub. El defecto real es que `sitemap.ts` no consulta esa
   compuerta y anuncia páginas que el sitio 404ea deliberadamente.
2. Los enlaces «Preventa» y «Terrenos» del pie apuntan a `/propiedades?stage=preventa` y
   `?type=terreno`, **no** a las facetas vacías. El informe afirmaba que las facetas
   estaban enlazadas desde el pie; no lo están.

## Hallazgos descartados

Seis afirmaciones no sobrevivieron a la verificación y no deben arreglarse. Están listadas
con su motivo en la última sección del informe navegable: el sticky de 464 px del blog es
un CTA lateral y no un solapamiento; las cifras del INEGI son idénticas en tres cargas; el
«texto sospechoso» en 58 páginas eran falsos positivos de la expresión regular de medición;
el error de consola en las 92 páginas es un aviso benigno de CSP en modo report-only; la
contradicción de plazos en `/es/contacto` no es reproducible; y el `border-l-4` de
`PricePin` es el triángulo CSS del pin de precio.
