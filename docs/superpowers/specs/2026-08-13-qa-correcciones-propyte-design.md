# Correcciones QA propyte.com — Diseño

**Fecha:** 2026-08-13
**Fuente:** `Correcciones_PROPYTE.pdf` (~40 hallazgos de QA, revisión en móvil y desktop, ES y EN)
**Rama:** `fix/qa-correcciones-2026-08` desde `origin/main` (`9d9c772`)

---

## 1. Tesis

El PDF lista ~40 problemas. Leyendo el código, colapsan en **seis causas raíz** más una
docena de fixes sueltos. Corregir por causa, no por síntoma, es la diferencia entre 40
tickets y 9 fases.

| Causa raíz | Síntomas del PDF que explica |
|---|---|
| `useFilters` mergea params en vez de reemplazar | links del footer que combinan Tulum+Preventa+Terrenos; «Todas las propiedades» no limpia |
| Modal de filtros móvil sin estado borrador y con 2 de 11 filtros | «OK no sirve»; «Limpiar todo no sirve»; falta de filtros en móvil |
| Header sticky sin offset | breadcrumbs invisibles en móvil; header pegado a la barra del navegador; letras del glosario tapadas |
| Filtros del blog sin cierre ni ancho estable | se quedan abiertos; se «mueven»; se encima uno sobre otro |
| Texto que viene de la BD, no de i18n | «Cancha», «Área de Yoga», «Entrega: Invierno 2027», roles del equipo, Oferta vs Demanda |
| `mailto:` sin cliente de correo en PC | «Enviar mi CV» no hace nada; correo de Contacto no hace nada |

## 2. Dos hallazgos que contradicen el documento

### 2.1 El botón OK no está roto

`src/components/marketplace/AdvancedFilters.tsx:70-75` tiene los handlers correctos: `OK`
llama `onClose`, `Limpiar todo` llama `onClear`. Lo que falla es la **semántica**: el modal
aplica cada cambio en vivo vía `onFilterChange`, sin estado borrador. QA describió el
comportamiento con precisión —«se cambian en el fondo… queda inútil el botón si no es
necesario darle click»— y de ahí dedujo, razonablemente pero mal, que el handler estaba roto.

Consecuencia de diseño: **la paridad de filtros y el «OK inútil» se arreglan con el mismo
trabajo.** Un drawer con estado borrador le da sentido al OK y es el lugar natural donde
entran los nueve filtros que faltan. No son dos tareas.

### 2.2 «Cancha» y «Director General» no son etiquetas sin traducir

`"delivery": "Delivery:"` sí existe en `en.json:732`. Lo que llega en español es el **valor**
(«Invierno 2027», «Entrega y escrituración inmediata»), servido por Supabase. Igual para
amenidades y roles del equipo. Ningún cambio en `en.json` los arregla; requieren catálogo de
mapeo en el mapper (decisión tomada) y, para los roles, captura bilingüe.

## 3. Decisiones tomadas

1. **Traducción de datos de BD → catálogo de mapeo en el código.** Diccionario es→en aplicado
   en el mapper. No toca Supabase ni el Hub, se despliega con el sitio. Descartada la opción
   de columnas `_en` por requerir DDL en prod y recaptura de contenido.
2. **Filtros móviles → bugs + paridad completa.** Se construye el drawer nuevo.
3. **Sugerencias de rediseño → solo las baratas.** Entran hover en chips y desambiguar los
   emojis de rapidez. Quedan fuera, documentadas en §6: paginación de la tabla de
   amortización y ajuste de las barras del simulador.
4. **Rama nueva desde `origin/main`**, para no acoplar el despliegue de las correcciones al
   de la LP de lotes.

## 4. Fases

Ordenadas por relación valor/riesgo. **F1–F3 resuelven más quejas del PDF que F4 sola y son
mucho más baratas**; se recomienda desplegarlas antes de abrir F4.

### F1 · Fixes atómicos
Sin dependencias entre sí, sin riesgo de regresión.
- `apple-icon` 404: verificar si es petición real o sondeo de Safari a `/apple-icon` sin extensión.
- Link de Facebook: `Footer.tsx:24` (`FALLBACK_FACEBOOK`); comprobar si el Hub trae override.
- «Carreras» → «Reclutamiento» (`es.json:1400` + `en.json`); mismo destino, mismo nombre.
- «28 de Junio» → «28 de Julio» (dato de zona en Mercado).
- Traducciones que **sí** viven en i18n: «Cliente internacional» → *International client*,
  «EE.UU.» → *USA*, categorías del blog («Para inversionistas», «Guías de compra»), párrafo
  de Mortgage en Financiamiento.
- Teléfono: los 4 campos **ya tienen `type="tel"`** (verificado 2026-08-14). Falta
  `inputMode="numeric"` y validación en submit. Ver divergencia §5.4 sobre el `alert`.
- Hover en los chips de filtro.
- Emojis de rapidez → etiqueta textual («Inmediato», «6–36 meses»).

### F2 · `useFilters`: la URL es fuente de verdad
`src/hooks/useFilters.ts:117-124`. Reemplazar el estado desde los params en lugar de
mergear; tratar «sin params» como «todos los defaults» en vez de como «no hagas nada».
Existe `useFilters.test.ts` → **tests primero**, incluido el caso de navegar a `/propiedades`
pelón y esperar cero filtros activos.

### F3 · Header sticky: offset y anclas
Una sola corrección de offset resuelve cuatro quejas. `safe-area-inset-top` para el header en
móvil y `scroll-margin-top` en los anclas de letra del glosario y en los breadcrumbs.
Medir con `getComputedStyle`, no leyendo el JSX.

### F4 · Drawer de filtros móvil con paridad completa
La fase grande. Reescribir `AdvancedFilters` como drawer con:
- **estado borrador**: los cambios no aplican hasta OK — esto es lo que le da sentido al botón;
- los **11 filtros** de desktop (búsqueda, ciudad, zona, tipo, precio, recámaras, etapa, uso,
  ROI, tipo de desarrollo);
- «Limpiar todo» que limpia borrador y chips;
- scroll interno propio, que subsume el bug del dropdown «Tipo» en desktop.

Verificación en dispositivo real, no solo en emulación de devtools.

### F5 · Filtros del blog
Cerrar al aplicar, cerrar al abrir otro, cerrar al click fuera. Ancho estable para que dejen
de moverse al cambiar de opción. Revisar la latencia percibida en móvil que empuja al usuario
a hacer spam de clicks.

### F6 · Catálogo de traducción de datos
**Corrección 2026-08-14: el catálogo ya existe.** `src/components/property/AmenityList.tsx:24-52`
tiene 21 amenidades con `es`, `en`, icono y regex de match. «Cancha» y «Área de Yoga»
simplemente no están en la lista y caen al fallback de la línea 72, que pinta el string crudo
con icono genérico. El screenshot del PDF lo confirma solo: los dos textos sin traducir son
exactamente los dos con icono de palomita. **Son dos entradas nuevas, no una fase.**

Queda de F6: Mercado («Oferta vs Demanda», «Índice Propyte») que son literales en JSX y se
mueven a i18n — `SupplyDemandIndicator.tsx`, `ZoneScoreCard.tsx`,
`RentalAnalysisDashboard.tsx`. Los testimonios y las categorías del blog sí son datos del Hub.
Los roles del equipo van aparte: texto libre capturado a mano, necesitan decisión de formato.

### F7 · `mailto:` y CTAs muertos
- «Enviar mi CV» (`UnetePageContent.tsx:590`) y correo de Contacto: en PC sin cliente de
  correo configurado, `mailto:` no hace nada. Añadir copiar-al-portapapeles como fallback
  visible.
- CTA «Contactar asesor» dentro de la propia página de Contacto: ocultar el bloque ahí.
- «Explorar con simulador» ancla al simulador, no a `/propiedades`.

### F8 · Layout y espacios
Espacio muerto en Inicio antes de FAQ (+ separador) · Exclusivos · Brokers «Próximamente»
amontonado · Reclutamiento pegado al borde · footer sin centrar · zoom raro en Financiamiento
en móvil · elemento cortado en Mercado (solo en español).

### F8b · Hallazgos nuevos del PDF v2 (2026-08-14)
- **Barra de búsqueda: elegir «Desarrollos»/«Propiedades» no navega.**
  `src/components/layout/SearchBubble.tsx:88-93` y `:100-105` — el `onClick` solo hace
  `setType` + cerrar. `handleSubmit:41` **ya resuelve** el caso de query vacío
  (`router.push(/${locale}/${path})`); falta invocarlo también al elegir del menú.
- **Correos de Privacidad, Términos y Cookies muertos en PC.** Mismo `mailto:` de F7, en
  `legal/PrivacidadContent.tsx:27,65,83` · `TerminosContent.tsx:74` · `CookiesContent.tsx:69`
  · `LegalPage.tsx:59`. **Subir prioridad**: son la vía para ejercer derechos ARCO; que no
  funcionen es cumplimiento, no UX. Total: 6 sitios con `mailto:` → un solo componente.

### F9 · Mapa de Propiedades en móvil
Gravedad Alta y **causa desconocida** — el propio PDF duda («puede que sea cosa del
internet»). Reproducir antes de tocar código; sin reproducción confirmada no se abre.

## 5. Divergencias deliberadas del PDF

1. **El skip link no se quita.** `src/app/[locale]/layout.tsx:79`. Es el enlace de salto de
   accesibilidad, obligatorio para WCAG; aparece al navegar con teclado. QA lo detectó porque
   tabuló tras abrir la consola. Se documenta, no se elimina.
2. **Imágenes lentas en desktop**: hipótesis conocida del repo — `sizes="100vw"` hace que el
   navegador pida el candidato de 3840px. Se ataca eso primero.
3. **La verificación no puede ser una sola petición a producción.** El deploy de Hostinger
   compila en el servidor y la CDN sirve viejo y nuevo mezclado unos minutos. Medir varias
   veces antes de declarar algo arreglado o roto.
4. **El teléfono no bloquea teclas ni lanza un `alert`.** El PDF lo pide tres veces
   (Desarrolladores, Brokers, Proveedores). Se implementa como `inputMode="numeric"` —que en
   móvil abre el teclado numérico, que es el 90% del beneficio— más validación en submit.
   Bloquear teclas rompe entradas legítimas (`+52`, espacios, paréntesis, pegar desde el
   portapapeles) y un `alert` por tecla es hostil. El objetivo de QA —que no entren letras—
   se cumple; el mecanismo que propone, no.

## 6. Fuera de alcance (propuestas, sin tarea)

- Paginar la tabla de amortización de Financiamiento a 12 meses con navegación lateral.
- Ensanchar las barras del simulador de Cómo Invertir moviendo las etiquetas a la izquierda.
- Traducción de roles del equipo en la fuente de captura (depende de F6).

## 7. Criterio de cierre

Cada fase cierra con: el síntoma del PDF reproducido antes del cambio, ausente después,
verificado en el viewport donde fue reportado (móvil real para lo de móvil), y en los dos
idiomas cuando el hallazgo mencionaba EN.
