-- ============================================================
-- SEED — Developer "Avica Inmobiliaria" (real, verificado)
-- + link al sample development
-- ============================================================
-- CREA: 1 desarrollador real (Avica Inmobiliaria) en real_estate_hub
-- LINKEA: sample-azul-vivo → Avica
-- PURPOSE: Desbloquear audit del Developer card en Commit 1d
--
-- Nota: Avica NO lleva prefijo [SAMPLE] — es un desarrollador real
-- verificado de Mérida/Tulum. Solo el desarrollo AZUL VIVO y sus
-- unidades son sample. El link sample→real es para validar el
-- render del componente — una vez verificado, Luis puede reassignar
-- a un dev real de Avica (Yaxnáh, Nativa Tulum, Real Caucel).
--
-- COMO CORRER:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run
--
-- ROLLBACK al final del archivo (comentado).
-- ============================================================

-- UUID fijo para Avica: a6ca0000-0000-0000-0000-000000000001

-- ---------- 1. DESARROLLADOR ----------
INSERT INTO real_estate_hub."Propyte_desarrolladores" (
  id,
  nombre_desarrollador,
  ext_slug_desarrollador,
  logo,
  sitio_web,
  descripcion,
  ext_descripcion_en,
  telefono,
  email,
  es_verificado,
  ext_ciudad,
  ext_estado,
  nombre_contacto,
  redes_sociales,
  anos_experiencia,
  proyectos_entregados,
  unidades_entregadas,
  proyectos_activos,
  calificacion,
  ext_publicado,
  approved_at,
  zoho_pipeline_status,
  created_at,
  updated_at
) VALUES (
  'a6ca0000-0000-0000-0000-000000000001',
  'Avica Inmobiliaria',
  'avica-inmobiliaria',
  NULL,
  'https://avicainmobiliaria.com.mx',
  'Desarrolladora inmobiliaria mexicana con sede en Mérida, Yucatán, fundada en 2013. Con más de 10 años de experiencia, ha construido más de 1,500 viviendas y 7 proyectos de obra civil, posicionándose como referente en la Península de Yucatán. Nacieron como alternativa para generar vivienda accesible para el sector medio y medio-bajo en Yucatán, expandiéndose hacia proyectos de mayor valor en Tulum, Quintana Roo. Diferenciadores: construcción integral con estándares de calidad, diseño funcional, casas amigables con el medio ambiente, reforestación con árboles nativos, e infraestructura propia para planear, diseñar y construir sin depender de terceros. Aceptan INFONAVIT, créditos hipotecarios bancarios, pago de contado y financiamiento propio.',
  'Mexican real estate developer headquartered in Mérida, Yucatán, founded in 2013. With over 10 years of experience, Avica has built more than 1,500 homes and 7 civil works projects, positioning itself as a leader in the Yucatán Peninsula. Originally founded to provide accessible housing for the middle and lower-middle market segment in Yucatán, the company has expanded into higher-value projects in Tulum, Quintana Roo. Differentiators: integral construction with quality standards, functional design, environmentally-friendly homes, native tree reforestation, and in-house infrastructure to plan, design, and build without third-party dependencies. Accepts INFONAVIT, bank mortgages, cash payment, and in-house financing.',
  '+52 999 406 5309',
  'contacto@avicainmobiliaria.com.mx',
  TRUE,
  'Mérida',
  'Yucatán',
  'Ventas Avica',
  -- ext_publicado=TRUE es CRÍTICO: RLS policy "select_published" bloquea anon cuando es null/false
  -- (added 2026-04-19 tras debugging de Fase 4 1e)
  jsonb_build_object(
    'facebook',  'https://www.facebook.com/avicainmobiliaria',
    'instagram', 'https://www.instagram.com/avicainmobiliaria',
    'linkedin',  'https://www.linkedin.com/company/avicainmobiliaria',
    'youtube',   'https://www.youtube.com/@avicainmobiliaria',
    'tiktok',    'https://www.tiktok.com/@avicainmobiliaria',
    'phone_alt', '+52 999 368 4863',
    'address',   'Calle 25 x 114, Piedra Norte, Caucel, Mérida, Yucatán'
  ),
  13,
  7,
  1500,
  3,
  4.7,
  TRUE,         -- ext_publicado: required por RLS policy "select_published"
  NOW(),
  'aprobado',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nombre_desarrollador   = EXCLUDED.nombre_desarrollador,
  ext_slug_desarrollador = EXCLUDED.ext_slug_desarrollador,
  sitio_web              = EXCLUDED.sitio_web,
  descripcion            = EXCLUDED.descripcion,
  ext_descripcion_en     = EXCLUDED.ext_descripcion_en,
  telefono               = EXCLUDED.telefono,
  email                  = EXCLUDED.email,
  es_verificado          = EXCLUDED.es_verificado,
  ext_ciudad             = EXCLUDED.ext_ciudad,
  ext_estado             = EXCLUDED.ext_estado,
  nombre_contacto        = EXCLUDED.nombre_contacto,
  redes_sociales         = EXCLUDED.redes_sociales,
  anos_experiencia       = EXCLUDED.anos_experiencia,
  proyectos_entregados   = EXCLUDED.proyectos_entregados,
  unidades_entregadas    = EXCLUDED.unidades_entregadas,
  proyectos_activos      = EXCLUDED.proyectos_activos,
  calificacion           = EXCLUDED.calificacion,
  ext_publicado          = EXCLUDED.ext_publicado,
  approved_at            = EXCLUDED.approved_at,
  zoho_pipeline_status   = EXCLUDED.zoho_pipeline_status,
  updated_at             = NOW();

-- ---------- 2. LINKEAR SAMPLE DEV A AVICA ----------
UPDATE real_estate_hub."Propyte_desarrollos"
SET id_desarrollador = 'a6ca0000-0000-0000-0000-000000000001',
    updated_at       = NOW()
WHERE ext_slug_desarrollo = 'sample-azul-vivo-5a4e4a4e';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT id, name, slug, website, city, state, verified, years_experience,
--        delivered_projects, delivered_units, active_projects, rating,
--        approved_at, zoho_pipeline_status
-- FROM real_estate_hub.v_developers
-- WHERE slug = 'avica-inmobiliaria';
--
-- SELECT slug, name, city, developer_id, developer_name, developer_slug
-- FROM real_estate_hub.v_developments
-- WHERE slug = 'sample-azul-vivo-5a4e4a4e';

-- ============================================================
-- ROLLBACK (descomentar si quieres revertir)
-- ============================================================
-- UPDATE real_estate_hub."Propyte_desarrollos"
-- SET id_desarrollador = NULL, updated_at = NOW()
-- WHERE ext_slug_desarrollo = 'sample-azul-vivo-5a4e4a4e';
--
-- DELETE FROM real_estate_hub."Propyte_desarrolladores"
-- WHERE ext_slug_desarrollador = 'avica-inmobiliaria';
