-- ============================================================
-- SEED — Sample Development + Units para audit de Fase 4 1c
-- ============================================================
-- CREA: 1 desarrollo "AZUL VIVO" + 6 unidades en real_estate_hub
-- DÓNDE: Playa del Carmen (lat 20.6303, lng -87.0739)
-- MARCADO: nombre con prefijo "[SAMPLE]" + slug con prefijo "sample-"
-- PURPOSE: Desbloquear audit end-to-end de UnitDetailPage + Dual Investment Calculator
--
-- COMO CORRER:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run
--
-- ROLLBACK (al final del archivo, comentado):
--   Borrar las 7 rows (1 dev + 6 units) con LIKE 'sample-%'
-- ============================================================

-- UUIDs fijos para referencia estable (slug suffix = primeros 8 chars)
-- Desarrollo:
--   id: 5a4e4a4e-0000-0000-0000-000000000001  → slug sample-azul-vivo-5a4e4a4e
-- Unidades:
--   id: 5a4e4a4e-0000-0000-0000-000000000101  → A101 (1BR disponible)
--   id: 5a4e4a4e-0000-0000-0000-000000000102  → A102 (2BR disponible)
--   id: 5a4e4a4e-0000-0000-0000-000000000103  → A103 (2BR+ disponible)
--   id: 5a4e4a4e-0000-0000-0000-000000000104  → A104 (3BR disponible)
--   id: 5a4e4a4e-0000-0000-0000-000000000105  → PH501 (penthouse reservado)
--   id: 5a4e4a4e-0000-0000-0000-000000000106  → ST001 (studio vendido)

-- ---------- 1. DESARROLLO ----------
INSERT INTO real_estate_hub."Propyte_desarrollos" (
  id, nombre_desarrollo, ext_slug_desarrollo, tipo_desarrollo,
  etapa_construccion, avance_obra_porcentaje, fecha_entrega, ext_fecha_entrega_texto,
  unidades_totales, unidades_disponibles, ext_reserved_units, ext_sold_units,
  fotos_desarrollo, brochure_pdf, tour_virtual_desarrollo, video_desarrollo,
  ext_precio_min_mxn, ext_precio_max_mxn, ext_moneda,
  ext_roi_proyectado, ext_roi_renta_mensual, ext_roi_apreciacion,
  ext_enganche_porcentaje, ext_meses_financiamiento, ext_tasa_interes,
  ext_descripcion_es, ext_descripcion_en,
  ext_descripcion_corta_es, ext_descripcion_corta_en,
  ext_destacado, ext_publicado,
  estado, ciudad, colonia, calle, codigo_postal, latitud, longitud, zona,
  playa_distancia,
  ext_crm_relationship, ext_commission_rate,
  ext_property_types, ext_usage, ext_badge, ext_plaza,
  ext_contacto_nombre, ext_contacto_telefono,
  ext_detection_source, ext_source_url,
  approved_at, zoho_pipeline_status,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000001',
  '[SAMPLE] AZUL VIVO Residences',
  'sample-azul-vivo-5a4e4a4e',
  'mixto',
  'construccion', 45, '2027-09-30', 'Q3 2027',
  48, 44, 1, 1,
  ARRAY[
    'https://picsum.photos/seed/azulvivo-01/1600/900',
    'https://picsum.photos/seed/azulvivo-02/1600/900',
    'https://picsum.photos/seed/azulvivo-03/1600/900',
    'https://picsum.photos/seed/azulvivo-04/1600/900',
    'https://picsum.photos/seed/azulvivo-05/1600/900',
    'https://picsum.photos/seed/azulvivo-06/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-brochure/800/1130',
  'https://my.matterport.com/show/?m=SAMPLE_TOUR',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  3200000, 14500000, 'MXN',
  12.5, 0.85, 8.0,
  30, ARRAY[60, 120, 180, 240]::INT[], 12.0,
  '⚠️ DATOS DE PRUEBA (SAMPLE) — AZUL VIVO Residences es un desarrollo residencial boutique de 48 unidades ubicado en el corazón de Playa del Carmen, a 600 m de la Quinta Avenida y 5 min caminando a la playa. Amenidades premium: rooftop con alberca infinity, gimnasio, coworking, lobby, estacionamiento techado y seguridad 24/7. Diseño contemporáneo con acabados de lujo: pisos de mármol, cocina integral europea, electrodomésticos de acero inoxidable, ventanales piso-techo con vista al mar en niveles superiores. Excelente opción para vivienda o inversión en renta vacacional (Airbnb-friendly). Plusvalía estimada 8% anual, ROI proyectado 12.5%.',
  '⚠️ SAMPLE DATA — AZUL VIVO Residences is a boutique residential development with 48 units located in the heart of Playa del Carmen, 600 m from Fifth Avenue and a 5-minute walk to the beach. Premium amenities: rooftop infinity pool, gym, coworking, lobby, covered parking, and 24/7 security. Contemporary design with luxury finishes: marble floors, European integral kitchen, stainless-steel appliances, floor-to-ceiling windows with ocean view on upper levels. Excellent option for living or vacation rental investment (Airbnb-friendly). Estimated appreciation 8% annual, projected ROI 12.5%.',
  'Boutique residencial de 48 unidades a 600 m de la 5ta Avenida y la playa',
  'Boutique residential of 48 units 600 m from 5th Ave and the beach',
  TRUE, TRUE,
  'Quintana Roo', 'Playa del Carmen', 'Centro', 'Av. Constituyentes 123', '77710',
  20.6303, -87.0739, 'Playa del Carmen Centro',
  600,
  'direct', 3.5,
  ARRAY['departamento', 'penthouse', 'studio']::TEXT[],
  ARRAY['residencial', 'vacacional']::TEXT[],
  'construccion', 'riviera_maya',
  'Ventas Propyte', '+52 984 000 0000',
  'SAMPLE_SEED', 'https://propyte.com/samples/azul-vivo',
  NOW(), 'aprobado',
  NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nombre_desarrollo = EXCLUDED.nombre_desarrollo,
  approved_at = EXCLUDED.approved_at,
  zoho_pipeline_status = EXCLUDED.zoho_pipeline_status,
  updated_at = NOW();

-- ---------- 2. UNIDADES ----------

-- Unidad A101 — 1BR disponible (entry-level)
INSERT INTO real_estate_hub."Propyte_unidades" (
  id, id_desarrollo, slug_unidad, ext_numero_unidad, titulo_unidad, subtitulo_unidad,
  tipo_unidad, ext_tipologia, piso_numero, niveles_unidad,
  recamaras, banos_completos, medios_banos,
  superficie_total_m2, superficie_construida_m2,
  estacionamientos, orientacion, vista_unidad,
  amueblado, equipado, mascotas_permitidas, ext_tiene_alberca,
  precio_mxn, precio_usd, moneda_principal,
  enganche_porcentaje, ext_enganche_mxn, ext_mensualidad_mxn,
  roi_anual_porcentaje, renta_mensual_estimada_mxn, apreciacion_anual_porcentaje,
  descripcion_corta_unidad, descripcion_larga_unidad, ext_descripcion_en,
  fotos_unidad, foto_portada_unidad,
  estado_unidad, es_nueva_unidad, es_preventa, ext_publicado,
  approved_at, zoho_pipeline_status,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000101',
  '5a4e4a4e-0000-0000-0000-000000000001',
  'sample-azul-vivo-a101-5a4e4a4e',
  'A101', '[SAMPLE] AZUL VIVO — Unidad A101 (1BR)', '1 recámara · 58 m² · Planta baja',
  'departamento', '1BR/1BA', 1, 1,
  1, 1, 0,
  58, 54,
  1, 'sur', 'jardín',
  FALSE, TRUE, TRUE, TRUE,
  3200000, 180000, 'MXN',
  30, 960000, 32100,
  11.5, 18500, 8.0,
  '1 recámara · 58 m² a 600 m de la playa',
  '⚠️ SAMPLE — Unidad A101 es un departamento de 1 recámara con 58 m², ideal para parejas o inversión en renta vacacional. Cocina integral, baño completo con tina, clóset empotrado, acceso a amenidades del desarrollo (rooftop, gym, coworking). Balcón con vista al jardín interior.',
  '⚠️ SAMPLE — Unit A101 is a 1-bedroom apartment with 58 m², ideal for couples or vacation rental investment. Integral kitchen, full bathroom with tub, built-in closet, access to development amenities (rooftop, gym, coworking). Balcony with interior garden view.',
  ARRAY[
    'https://picsum.photos/seed/azulvivo-a101-01/1600/900',
    'https://picsum.photos/seed/azulvivo-a101-02/1600/900',
    'https://picsum.photos/seed/azulvivo-a101-03/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-a101-01/1600/900',
  'disponible', TRUE, TRUE, TRUE,
  NOW(), 'aprobado',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Unidad A102 — 2BR disponible
INSERT INTO real_estate_hub."Propyte_unidades" (
  id, id_desarrollo, slug_unidad, ext_numero_unidad, titulo_unidad, subtitulo_unidad,
  tipo_unidad, ext_tipologia, piso_numero, recamaras, banos_completos, medios_banos,
  superficie_total_m2, superficie_construida_m2, estacionamientos, orientacion, vista_unidad,
  amueblado, equipado, mascotas_permitidas, ext_tiene_alberca,
  precio_mxn, precio_usd, moneda_principal,
  enganche_porcentaje, ext_enganche_mxn, ext_mensualidad_mxn,
  roi_anual_porcentaje, renta_mensual_estimada_mxn, apreciacion_anual_porcentaje,
  descripcion_corta_unidad, descripcion_larga_unidad, ext_descripcion_en,
  fotos_unidad, foto_portada_unidad,
  estado_unidad, es_nueva_unidad, es_preventa, ext_publicado,
  approved_at, zoho_pipeline_status,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000102',
  '5a4e4a4e-0000-0000-0000-000000000001',
  'sample-azul-vivo-a102-5a4e4a4e',
  'A102', '[SAMPLE] AZUL VIVO — Unidad A102 (2BR)', '2 recámaras · 82 m² · Piso 2',
  'departamento', '2BR/2BA', 2,
  2, 2, 0,
  82, 76, 1, 'este', 'calle',
  FALSE, TRUE, TRUE, TRUE,
  4800000, 270000, 'MXN',
  30, 1440000, 48200,
  12.0, 27500, 8.0,
  '2 recámaras · 82 m² con balcón',
  '⚠️ SAMPLE — Unidad A102 con 2 recámaras (1 master + 1 secundaria), 2 baños completos, sala-comedor-cocina integral, balcón, 1 cajón de estacionamiento.',
  '⚠️ SAMPLE — Unit A102 with 2 bedrooms (1 master + 1 secondary), 2 full bathrooms, living-dining-kitchen area, balcony, 1 parking spot.',
  ARRAY[
    'https://picsum.photos/seed/azulvivo-a102-01/1600/900',
    'https://picsum.photos/seed/azulvivo-a102-02/1600/900',
    'https://picsum.photos/seed/azulvivo-a102-03/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-a102-01/1600/900',
  'disponible', TRUE, TRUE, TRUE,
  NOW(), 'aprobado',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Unidad A103 — 2BR + medio baño disponible
INSERT INTO real_estate_hub."Propyte_unidades" (
  id, id_desarrollo, slug_unidad, ext_numero_unidad, titulo_unidad, subtitulo_unidad,
  tipo_unidad, ext_tipologia, piso_numero, recamaras, banos_completos, medios_banos,
  superficie_total_m2, superficie_construida_m2, estacionamientos, orientacion, vista_unidad,
  amueblado, equipado, mascotas_permitidas, ext_tiene_alberca,
  precio_mxn, precio_usd, moneda_principal,
  enganche_porcentaje, ext_enganche_mxn, ext_mensualidad_mxn,
  roi_anual_porcentaje, renta_mensual_estimada_mxn, apreciacion_anual_porcentaje,
  descripcion_corta_unidad, descripcion_larga_unidad, ext_descripcion_en,
  fotos_unidad, foto_portada_unidad,
  estado_unidad, es_nueva_unidad, es_preventa, ext_publicado,
  approved_at, zoho_pipeline_status,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000103',
  '5a4e4a4e-0000-0000-0000-000000000001',
  'sample-azul-vivo-a103-5a4e4a4e',
  'A103', '[SAMPLE] AZUL VIVO — Unidad A103 (2BR+)', '2 recámaras + medio baño · 95 m² · Piso 3',
  'departamento', '2BR/2.5BA', 3,
  2, 2, 1,
  95, 89, 2, 'oeste', 'ciudad',
  FALSE, TRUE, TRUE, TRUE,
  6100000, 342000, 'MXN',
  30, 1830000, 61200,
  12.3, 35000, 8.0,
  '2BR + medio baño · 95 m² · 2 estacionamientos',
  '⚠️ SAMPLE — Unidad A103: 2 recámaras + medio baño de visitas, 95 m², 2 cajones de estacionamiento, cocina tipo barra americana, lavadora-secadora, bodega privada.',
  '⚠️ SAMPLE — Unit A103: 2 bedrooms + half bath, 95 sqm, 2 parking spots, American-style kitchen bar, washer-dryer, private storage.',
  ARRAY[
    'https://picsum.photos/seed/azulvivo-a103-01/1600/900',
    'https://picsum.photos/seed/azulvivo-a103-02/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-a103-01/1600/900',
  'disponible', TRUE, TRUE, TRUE,
  NOW(), 'aprobado',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Unidad A104 — 3BR disponible (familiar)
INSERT INTO real_estate_hub."Propyte_unidades" (
  id, id_desarrollo, slug_unidad, ext_numero_unidad, titulo_unidad, subtitulo_unidad,
  tipo_unidad, ext_tipologia, piso_numero, recamaras, banos_completos, medios_banos,
  superficie_total_m2, superficie_construida_m2, estacionamientos, orientacion, vista_unidad,
  amueblado, equipado, mascotas_permitidas, ext_tiene_alberca,
  precio_mxn, precio_usd, moneda_principal,
  enganche_porcentaje, ext_enganche_mxn, ext_mensualidad_mxn,
  roi_anual_porcentaje, renta_mensual_estimada_mxn, apreciacion_anual_porcentaje,
  descripcion_corta_unidad, descripcion_larga_unidad, ext_descripcion_en,
  fotos_unidad, foto_portada_unidad,
  estado_unidad, es_nueva_unidad, es_preventa, ext_publicado,
  approved_at, zoho_pipeline_status,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000104',
  '5a4e4a4e-0000-0000-0000-000000000001',
  'sample-azul-vivo-a104-5a4e4a4e',
  'A104', '[SAMPLE] AZUL VIVO — Unidad A104 (3BR)', '3 recámaras · 120 m² · Piso 4',
  'departamento', '3BR/2BA', 4,
  3, 2, 0,
  120, 112, 2, 'norte', 'ciudad',
  FALSE, TRUE, TRUE, TRUE,
  8200000, 460000, 'MXN',
  30, 2460000, 82300,
  11.8, 45000, 8.0,
  '3 recámaras · 120 m² · ideal para familia',
  '⚠️ SAMPLE — Unidad A104 de 3 recámaras (1 master con vestidor + 2 secundarias), 2 baños completos, sala-comedor amplia, estudio independiente, 2 cajones de estacionamiento. Ideal para familia.',
  '⚠️ SAMPLE — Unit A104 with 3 bedrooms (1 master with walk-in + 2 secondary), 2 full bathrooms, spacious living-dining, independent study, 2 parking spots. Ideal for family.',
  ARRAY[
    'https://picsum.photos/seed/azulvivo-a104-01/1600/900',
    'https://picsum.photos/seed/azulvivo-a104-02/1600/900',
    'https://picsum.photos/seed/azulvivo-a104-03/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-a104-01/1600/900',
  'disponible', TRUE, TRUE, TRUE,
  NOW(), 'aprobado',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Unidad PH501 — Penthouse reservado
INSERT INTO real_estate_hub."Propyte_unidades" (
  id, id_desarrollo, slug_unidad, ext_numero_unidad, titulo_unidad, subtitulo_unidad,
  tipo_unidad, ext_tipologia, piso_numero, recamaras, banos_completos, medios_banos,
  superficie_total_m2, superficie_construida_m2, estacionamientos, orientacion, vista_unidad,
  amueblado, equipado, mascotas_permitidas, ext_tiene_alberca,
  precio_mxn, precio_usd, moneda_principal,
  enganche_porcentaje, ext_enganche_mxn, ext_mensualidad_mxn,
  roi_anual_porcentaje, renta_mensual_estimada_mxn, apreciacion_anual_porcentaje,
  descripcion_corta_unidad, descripcion_larga_unidad, ext_descripcion_en,
  fotos_unidad, foto_portada_unidad,
  estado_unidad, es_nueva_unidad, es_preventa, ext_publicado,
  approved_at, zoho_pipeline_status,
  ext_reserved_at,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000105',
  '5a4e4a4e-0000-0000-0000-000000000001',
  'sample-azul-vivo-ph501-5a4e4a4e',
  'PH501', '[SAMPLE] AZUL VIVO — Penthouse PH501', 'Penthouse · 3 recámaras · 180 m² + 40 m² terraza',
  'penthouse', 'PH/3BR/3.5BA', 5,
  3, 3, 1,
  220, 180, 3, 'sur', 'mar',
  TRUE, TRUE, TRUE, TRUE,
  14500000, 815000, 'MXN',
  30, 4350000, 145400,
  13.5, 88000, 9.0,
  'Penthouse · 3BR · 180 m² + 40 m² terraza con vista al mar',
  '⚠️ SAMPLE — Penthouse PH501 exclusivo en nivel 5. 180 m² interiores + 40 m² de terraza privada con jacuzzi y vista al mar. 3 recámaras todas con baño propio, cocina gourmet, bar, 3 cajones de estacionamiento, bodega. Amueblado y equipado con acabados de lujo.',
  '⚠️ SAMPLE — Exclusive Penthouse PH501 on level 5. 180 sqm interior + 40 sqm private terrace with jacuzzi and ocean view. 3 bedrooms all en-suite, gourmet kitchen, bar, 3 parking spots, storage. Furnished and equipped with luxury finishes.',
  ARRAY[
    'https://picsum.photos/seed/azulvivo-ph501-01/1600/900',
    'https://picsum.photos/seed/azulvivo-ph501-02/1600/900',
    'https://picsum.photos/seed/azulvivo-ph501-03/1600/900',
    'https://picsum.photos/seed/azulvivo-ph501-04/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-ph501-01/1600/900',
  'reservado', FALSE, TRUE, TRUE,
  NOW(), 'aprobado',
  NOW() - INTERVAL '3 days',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Unidad ST001 — Studio vendido
INSERT INTO real_estate_hub."Propyte_unidades" (
  id, id_desarrollo, slug_unidad, ext_numero_unidad, titulo_unidad, subtitulo_unidad,
  tipo_unidad, ext_tipologia, piso_numero, recamaras, banos_completos, medios_banos,
  superficie_total_m2, superficie_construida_m2, estacionamientos, orientacion, vista_unidad,
  amueblado, equipado, mascotas_permitidas, ext_tiene_alberca,
  precio_mxn, precio_usd, moneda_principal,
  enganche_porcentaje, ext_enganche_mxn, ext_mensualidad_mxn,
  roi_anual_porcentaje, renta_mensual_estimada_mxn, apreciacion_anual_porcentaje,
  descripcion_corta_unidad, descripcion_larga_unidad, ext_descripcion_en,
  fotos_unidad, foto_portada_unidad,
  estado_unidad, es_nueva_unidad, es_preventa, ext_publicado,
  approved_at, zoho_pipeline_status,
  ext_sold_at, ext_precio_venta,
  created_at, updated_at
) VALUES (
  '5a4e4a4e-0000-0000-0000-000000000106',
  '5a4e4a4e-0000-0000-0000-000000000001',
  'sample-azul-vivo-st001-5a4e4a4e',
  'ST001', '[SAMPLE] AZUL VIVO — Studio ST001', 'Studio · 42 m² · Planta baja',
  'departamento', 'Studio/1BA', 1,
  0, 1, 0,
  42, 40, 1, 'este', 'jardín',
  FALSE, TRUE, TRUE, TRUE,
  2400000, 135000, 'MXN',
  30, 720000, 24100,
  10.8, 14500, 8.0,
  'Studio · 42 m² · entry-level',
  '⚠️ SAMPLE — Studio ST001 compacto y funcional de 42 m² con área integrada (cocina-sala-recámara), baño completo, balcón, 1 cajón. Ideal para inversión en renta.',
  '⚠️ SAMPLE — Compact functional Studio ST001, 42 sqm with integrated area (kitchen-living-bedroom), full bathroom, balcony, 1 parking spot. Ideal for rental investment.',
  ARRAY[
    'https://picsum.photos/seed/azulvivo-st001-01/1600/900',
    'https://picsum.photos/seed/azulvivo-st001-02/1600/900'
  ]::TEXT[],
  'https://picsum.photos/seed/azulvivo-st001-01/1600/900',
  'vendido', FALSE, FALSE, TRUE,
  NOW(), 'listo',
  NOW() - INTERVAL '30 days', 2350000,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICACIÓN (correr después del INSERT)
-- ============================================================
-- SELECT slug, name, city, total_units, available_units, approved_at, zoho_pipeline_status
-- FROM real_estate_hub.v_developments WHERE slug LIKE 'sample-%';
--
-- SELECT slug, unit_number, unit_type, bedrooms, area_m2, price_mxn, status, approved_at
-- FROM real_estate_hub.v_units WHERE slug LIKE 'sample-%'
-- ORDER BY unit_number;

-- ============================================================
-- ROLLBACK (descomentar y correr para borrar todo el sample)
-- ============================================================
-- DELETE FROM real_estate_hub."Propyte_unidades" WHERE slug_unidad LIKE 'sample-%';
-- DELETE FROM real_estate_hub."Propyte_desarrollos" WHERE ext_slug_desarrollo LIKE 'sample-%';
