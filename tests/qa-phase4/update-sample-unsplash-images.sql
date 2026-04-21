-- ============================================================
-- UPDATE — Reemplaza picsum URLs del SAMPLE con Unsplash reales
-- ============================================================
-- Actualiza 1 desarrollo "AZUL VIVO" + 6 unidades.
-- DOMINIO: images.unsplash.com (ya autorizado en next.config.ts remotePatterns)
--
-- COMO CORRER:
--   Supabase Dashboard → SQL Editor → pegar → Run
-- ============================================================

-- ---------- DESARROLLO AZUL VIVO ----------
UPDATE real_estate_hub."Propyte_desarrollos"
SET fotos_desarrollo = ARRAY[
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80'
]::TEXT[],
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000001';

-- ---------- UNIDAD A101 (1BR) ----------
UPDATE real_estate_hub."Propyte_unidades"
SET fotos_unidad = ARRAY[
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80'
]::TEXT[],
foto_portada_unidad = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80',
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000101';

-- ---------- UNIDAD A102 (2BR) ----------
UPDATE real_estate_hub."Propyte_unidades"
SET fotos_unidad = ARRAY[
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80',
  'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=1600&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80'
]::TEXT[],
foto_portada_unidad = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80',
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000102';

-- ---------- UNIDAD A103 (2BR+) ----------
UPDATE real_estate_hub."Propyte_unidades"
SET fotos_unidad = ARRAY[
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=80'
]::TEXT[],
foto_portada_unidad = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80',
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000103';

-- ---------- UNIDAD A104 (3BR) ----------
UPDATE real_estate_hub."Propyte_unidades"
SET fotos_unidad = ARRAY[
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&q=80',
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80'
]::TEXT[],
foto_portada_unidad = 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&q=80',
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000104';

-- ---------- UNIDAD PH501 (Penthouse) ----------
UPDATE real_estate_hub."Propyte_unidades"
SET fotos_unidad = ARRAY[
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&q=80',
  'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1600&q=80',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=80'
]::TEXT[],
foto_portada_unidad = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80',
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000105';

-- ---------- UNIDAD ST001 (Studio) ----------
UPDATE real_estate_hub."Propyte_unidades"
SET fotos_unidad = ARRAY[
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1600&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=1600&q=80'
]::TEXT[],
foto_portada_unidad = 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1600&q=80',
updated_at = NOW()
WHERE id = '5a4e4a4e-0000-0000-0000-000000000106';

-- ---------- VERIFICACIÓN ----------
-- SELECT id, slug, fotos_desarrollo[1] AS first_photo
-- FROM real_estate_hub."Propyte_desarrollos"
-- WHERE id = '5a4e4a4e-0000-0000-0000-000000000001';
--
-- SELECT id, slug_unidad, foto_portada_unidad
-- FROM real_estate_hub."Propyte_unidades"
-- WHERE slug_unidad LIKE 'sample-%'
-- ORDER BY slug_unidad;
