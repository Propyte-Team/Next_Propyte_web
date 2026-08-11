-- ============================================================
-- LP lotes Playa del Carmen · cambios de DATOS pendientes de autorización
--
-- El código de la landing ya está aplicado y no necesita nada de esto para
-- funcionar: sin estos cambios la página publica gates en vez de cifras. Lo
-- que estos UPDATE desbloquean es la mensualidad, que es la cifra de mayor
-- palanca de conversión de la página.
--
-- NO EJECUTAR sin autorización explícita de Luis. Son escrituras en prod
-- sobre el registro que alimenta una landing con tráfico pagado.
--
-- Unidad: ca6fffe4-3a0d-4ab2-82f7-5789fcb8bdc7
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BLOQUE A · Desbloquea el plan de pagos (bugs B-1 y B-3)
-- ────────────────────────────────────────────────────────────
--
-- CAUSA RAÍZ: no faltaban datos. `v_units` resuelve los campos fin_* con un
-- gate de herencia:
--
--     CASE WHEN u.financiamiento_propio OR u.id_desarrollo IS NULL
--          THEN u.<campo>          -- la unidad, que SÍ tiene los datos
--          ELSE d.<campo>          -- el desarrollo, que los tiene todos NULL
--     END
--
-- La unidad tiene `financiamiento_propio = false` y sí tiene desarrollo, así
-- que la vista lee del desarrollo vacío y devuelve NULL en fin_esquema,
-- fin_meses_opciones y fin_tasa. Por eso el hero mostraba «sin dato» mientras
-- la ficha, que lee `fin_enganche_pct` por otra vía, sí publicaba el enganche.
--
-- A.1 · Hace que la vista lea los campos de la unidad. Es el uso previsto del
--       flag, no un rodeo: el financiamiento de este lote está capturado en la
--       unidad, no en el desarrollo.
UPDATE real_estate_hub."Propyte_unidades"
SET financiamiento_propio = true
WHERE id = 'ca6fffe4-3a0d-4ab2-82f7-5789fcb8bdc7';

-- A.2 · La tasa. ESTE ES EL ÚNICO DATO QUE DE VERDAD FALTA.
--
--       DECISIÓN DE LUIS, no automática. La unidad declara los plazos como
--       "47 MSI + 1 mensualidad final / 59 MSI + 1 mensualidad final". MSI es
--       "meses sin intereses", así que la evidencia de 0% es fuerte — pero es
--       prosa, no un dato declarado, y `construirPlan` exige el 0 explícito
--       justamente para no publicar una mensualidad por inferencia.
--
--       Con `ext_tasa_interes = 0` la página empieza a publicar la palabra
--       "sin intereses" y una mensualidad concreta. Si el desarrollador cobra
--       algún interés, eso sería publicidad engañosa. Confirmar por escrito
--       antes de ejecutar.
UPDATE real_estate_hub."Propyte_unidades"
SET ext_tasa_interes = 0
WHERE id = 'ca6fffe4-3a0d-4ab2-82f7-5789fcb8bdc7';

-- Lo que la página publicaría tras A.1 + A.2, sobre precio 1,010,880 MXN y
-- esquema "20% enganche + 60% mensualidades + 20% contraentrega":
--
--   Enganche (20%) .................  202,176 MXN
--   Mensualidad 48 meses (47 pagos) . 12,904.85 MXN
--   Mensualidad 60 meses (59 pagos) . 10,280.14 MXN
--   Contraentrega (20%) ............  202,176 MXN
--
-- OJO: el brief de la capa de emoción publicaba "$13,478 al mes · 60 meses".
-- Esa cifra es incorrecta: sale de dividir el 80% del precio entre 60 pagos,
-- ignorando la contraentrega del 20% y que el último mes no es mensualidad.
-- La cifra correcta a 60 meses es 10,280.14. El brief también daba por no
-- publicada la mensualidad final: sí está publicada, es el 20% (202,176).


-- ────────────────────────────────────────────────────────────
-- BLOQUE B · Acentos en el bloque de costos (bug B-5)
-- ────────────────────────────────────────────────────────────
--
-- Cosmético y reversible. Se reescriben sólo los cuatro textos con acentos
-- faltantes; el resto del JSONB queda intacto. Las claves `_*` (que contienen
-- el nombre del desarrollador) no se tocan y la landing nunca las lee.
UPDATE real_estate_hub."Propyte_unidades"
SET costos_adicionales = jsonb_set(
      costos_adicionales,
      '{cargos_unicos}',
      jsonb_build_array(
        jsonb_build_object(
          'concepto', 'Depósito al Fondo de Administración',
          'monto', '6 cuotas de mantenimiento',
          'momento', 'al escriturar',
          'reembolsable', true
        ),
        jsonb_build_object(
          'concepto', 'Cuota del Comité de Arquitectura',
          'monto', 'por definir',
          'momento', 'al iniciar obra',
          'reembolsable', false
        ),
        jsonb_build_object(
          'concepto', 'Fondo de garantía de obra',
          'monto', '465 salarios mínimos',
          'momento', 'al iniciar obra',
          'reembolsable', true
        )
      )
    )
WHERE id = 'ca6fffe4-3a0d-4ab2-82f7-5789fcb8bdc7';


-- ────────────────────────────────────────────────────────────
-- VERIFICACIÓN tras ejecutar
-- ────────────────────────────────────────────────────────────
-- Los tres campos deben dejar de ser NULL:
--
--   SELECT fin_tasa, fin_esquema, fin_meses_opciones
--   FROM real_estate_hub.v_units
--   WHERE slug = 'lote-residencial-en-comunidad-privada';
--
-- Esperado: 0 | "20% de enganche + 60% en mensualidades + 20% contraentrega" | {48,60}
--
-- La landing tiene ISR de 5 minutos: el cambio aparece solo, sin deploy.
