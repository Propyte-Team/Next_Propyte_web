-- ============================================================
-- DIAGNÓSTICO RLS: por qué anon no ve Avica
-- ============================================================

-- 1. Policies activas sobre Propyte_desarrolladores
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'real_estate_hub'
  AND tablename = 'Propyte_desarrolladores';

-- 2. ¿RLS está habilitado en la tabla?
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'real_estate_hub'
  AND tablename = 'Propyte_desarrolladores';

-- 3. Row completa de Avica (como owner / service_role) — para ver todos los campos
SELECT *
FROM real_estate_hub."Propyte_desarrolladores"
WHERE id = 'a6ca0000-0000-0000-0000-000000000001';

-- 4. Comparar con un dev que anon SÍ puede leer — trae 1 ejemplo
SELECT id, nombre_desarrollador, ext_slug_desarrollador, approved_at, zoho_pipeline_status,
       es_verificado, deleted_at, ext_publicado, created_at, updated_at
FROM real_estate_hub."Propyte_desarrolladores"
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 3;

-- 5. Probar anon directamente (este es el test definitivo)
SET ROLE anon;
SELECT id, nombre_desarrollador, approved_at, zoho_pipeline_status, es_verificado, deleted_at
FROM real_estate_hub."Propyte_desarrolladores"
WHERE id = 'a6ca0000-0000-0000-0000-000000000001';
RESET ROLE;

-- 6. Comparar con otro dev que sí es visible a anon
SET ROLE anon;
SELECT COUNT(*) AS anon_total_visible
FROM real_estate_hub."Propyte_desarrolladores";
RESET ROLE;

-- 7. Grants sobre la tabla
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'real_estate_hub'
  AND table_name = 'Propyte_desarrolladores'
  AND grantee IN ('anon', 'authenticated', 'service_role');
