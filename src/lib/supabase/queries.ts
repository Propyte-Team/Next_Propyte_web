import type { SupabaseClient } from '@supabase/supabase-js';
import { RENT_BOUNDS, MARKET_SUBMARKET_TO_ZONE } from '@/lib/calculator';
import { cleanListingName } from '@/lib/formatters';
import { toProxyImages, type ResourceType } from '@/lib/images/proxyUrl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;

// PostgREST `.or()` / `.filter()` strings use `,` `(` `)` `*` `%` `:` `\` as
// syntactic separators. When user input flows into one of these strings we
// must strip those characters first to prevent filter-clause injection that
// would let a caller bypass the `approved_at` gate on the underlying view/table.
function sanitizePostgrestFilter(input: string, maxLen = 80): string {
  return input.replace(/[,()*%\\:]/g, '').trim().slice(0, maxLen);
}

// Slugs are restricted to URL-safe characters; anything else is a router
// artefact or an attempt to inject filter syntax. Caps at 200 chars.
function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 200);
}

// Strip seed prefixes ([SAMPLE], [DEMO], [TEST]) from row.name on read.
// Applied at the query layer so every consumer sees clean display names
// without mutating Supabase data.
function normalizeNames<T extends { name?: string | null } | null>(rows: T[] | null | undefined): T[] | null {
  if (!rows) return rows ?? null;
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const n = (row as { name?: string | null }).name;
    if (typeof n !== 'string') return row;
    return { ...(row as object), name: cleanListingName(n) } as T;
  });
}

// Rewrites every Supabase storage URL inside `images[]` to a proxy URL
// (/propyte-media/<type>/<uuid>/<idx>.<ext>) so the browser never sees the
// real host or filename. Non-Supabase URLs pass through. Applied at the
// query boundary so every consumer (cards, gallery, OG images, PDF) gets
// the masked URL without each call site needing to know about it.
function maskRow<T extends { id?: string | null; images?: string[] | null } | null>(
  row: T,
  type: ResourceType,
): T {
  if (!row || typeof row !== 'object') return row;
  const r = row as { id?: string | null; images?: string[] | null };
  if (!r.id || !Array.isArray(r.images)) return row;
  return { ...(row as object), images: toProxyImages(r.images, type, r.id) } as T;
}

function maskRows<T extends { id?: string | null; images?: string[] | null } | null>(
  rows: T[] | null | undefined,
  type: ResourceType,
): T[] | null {
  if (!rows) return rows ?? null;
  return rows.map((r) => maskRow(r, type));
}

/**
 * Schema helpers — tables live in different Postgres schemas in Propyte Supabase.
 * All three must be added to PostgREST → Exposed Schemas in Supabase dashboard
 * or queries will fail with PGRST002.
 */
const hub = (c: Client) => c.schema('real_estate_hub' as 'public');
const inv = (c: Client) => c.schema('investment_analytics' as 'public');
const crm = (c: Client) => c.schema('propyte_crm' as 'public');

// ============================================================
// DEVELOPMENT QUERIES (replaces old property queries)
// ============================================================

export interface DevelopmentFilters {
  city?: string;
  zone?: string;
  zoneId?: string;
  plaza?: string;
  type?: string;        // property_types contains
  stage?: string;
  minPrice?: number;
  maxPrice?: number;
  minRoi?: number;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'price_asc' | 'price_desc' | 'newest' | 'roi' | 'units';
}

// Canonical public gate (alineado con Propyte_hub 2026-05-13).
//
// La verdad canónica del gate público es `web_status='published'`. El trigger
// SQL `fn_sync_ext_publicado` (real_estate_hub) garantiza:
//   web_status='published'  ⟺  ext_publicado=true  ⟺  approved_at IS NOT NULL
// y limpia approved_at/ext_publicado cuando web_status pasa a 'draft'.
//
// Como las views v_units/v_developments NO exponen web_status pero SÍ
// approved_at, filtrar por `approved_at IS NOT NULL` captura completamente
// el gate. El antiguo filtro `zoho_pipeline_status IN ('published')` quedó
// obsoleto: zoho_pipeline_status es el pipeline interno de Zoho CRM, no
// controla la visibilidad web (ver comentario del trigger SQL).
//
// Incidente que motivó la limpieza (2026-05-13): unidades duplicadas en Hub
// quedan con zoho_pipeline_status='draft' por seguridad. Al aprobar en Hub,
// web_status pasa a 'published' (trigger setea approved_at) pero
// zoho_pipeline_status sigue en 'draft' → el sitio las ocultaba aunque el
// Hub mostraba el badge "Sitio: ✓ publicado".
//
// Source of truth: Propyte_hub/src/lib/status-canonical.ts
// + scripts/sql/add-web-status.sql (trigger fn_sync_ext_publicado).
//
// @deprecated — usar `applyPublicGate(query)` o agregar `.not('approved_at', 'is', null)`.
// Se mantiene exportado por consumidores externos (page.tsx).
export const APPROVED_STATUSES = ['published'] as const;

export async function getDevelopments(client: Client, filters: DevelopmentFilters = {}) {
  const hub = client.schema('real_estate_hub' as 'public');
  let query = hub
    .from('v_developments')
    .select('*', { count: 'exact' })
    .not('approved_at', 'is', null)
    .is('deleted_at', null);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.zone) query = query.eq('zone', filters.zone);
  if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);
  if (filters.plaza) query = query.eq('plaza', filters.plaza);
  if (filters.type) query = query.contains('property_types', [filters.type]);
  if (filters.stage) query = query.eq('stage', filters.stage);
  if (filters.minPrice) query = query.gte('price_min_mxn', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_min_mxn', filters.maxPrice);
  if (filters.minRoi) query = query.gte('roi_projected', filters.minRoi);
  if (filters.featured) query = query.eq('featured', true);

  if (filters.search) {
    const q = sanitizePostgrestFilter(filters.search);
    if (q) query = query.or(`name.ilike.*${q}*,city.ilike.*${q}*,zone.ilike.*${q}*`);
  }

  switch (filters.orderBy) {
    case 'price_asc':
      query = query.order('price_min_mxn', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price_min_mxn', { ascending: false });
      break;
    case 'roi':
      query = query.order('roi_projected', { ascending: false, nullsFirst: false });
      break;
    case 'units':
      query = query.order('available_units', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const res = await query;
  return { ...res, data: maskRows(normalizeNames(res.data), 'd') };
}

// Aplica la prioridad de display name del Hub editorial:
//   publication_title (editable Identidad) → meta_title (SEO) → nombre_desarrollo limpio.
// Nunca expone nombre_desarrollo crudo si hay editorial disponible.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDisplayName<T extends { name?: string | null; publication_title?: string | null; meta_title?: string | null } | null>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const r = row as { name?: string | null; publication_title?: string | null; meta_title?: string | null };
  const displayName = r.publication_title
    || r.meta_title
    || (typeof r.name === 'string' ? cleanListingName(r.name) : r.name ?? null);
  return { ...(row as object), name: displayName } as T;
}

export async function getDevelopmentBySlug(client: Client, slug: string) {
  const res = await client
    .schema('real_estate_hub' as 'public')
    .from('v_developments')
    .select('*')
    .eq('slug', slug)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = res.data as any;
  return { ...res, data: maskRow(applyDisplayName(raw), 'd') };
}

export async function getDevelopmentWithUnits(client: Client, slug: string) {
  const hub = client.schema('real_estate_hub' as 'public');
  const { data: dev, error: devError } = await hub
    .from('v_developments')
    .select('*')
    .eq('slug', slug)
    .single();

  if (devError || !dev) return { data: null, error: devError };

  // Solo unidades con web_status='published' (capturado vía approved_at IS NOT NULL
  // por trigger fn_sync_ext_publicado). Previene fuga de unidades draft o
  // duplicadas accidentales (slugs `-copy-`) al detail page del desarrollo.
  const { data: units, error: unitsError } = await hub
    .from('v_units')
    .select('*')
    .eq('development_id', (dev as { id: string }).id)
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .order('unit_number', { ascending: true });

  const devRow = dev as { id?: string | null; name?: string | null; publication_title?: string | null; meta_title?: string | null; images?: string[] | null };
  const maskedDev = maskRow(applyDisplayName(devRow), 'd');
  const normalizedUnits = maskRows(normalizeNames(units), 'u') ?? [];

  return {
    data: { ...maskedDev, units: normalizedUnits },
    error: unitsError,
  };
}

/**
 * 5-level fallback for similar developments. Returns the first non-empty bucket.
 *   L1: same property_type + same zone
 *   L2: same zone (any type)
 *   L3: same city (any type)
 *   L4: featured developments (any city)
 *   L5: any approved development (guaranteed non-empty if any other dev exists)
 */
export async function getSimilarDevelopments(
  client: Client,
  seed: { id: string; city: string; zone: string | null; property_type: string | null },
  limit = 4,
) {
  const base = () =>
    hub(client)
      .from('v_developments')
      .select('id, slug, name, city, zone, images, price_min_mxn, price_max_mxn, stage, property_types, developer_name, discounted_units_count')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .neq('id', seed.id)
      .limit(limit);

  if (seed.zone && seed.property_type) {
    const r = await base().eq('zone', seed.zone).contains('property_types', [seed.property_type]);
    if (r.data && r.data.length > 0) return maskRows(r.data, 'd') ?? [];
  }
  if (seed.zone) {
    const r = await base().eq('zone', seed.zone);
    if (r.data && r.data.length > 0) return maskRows(r.data, 'd') ?? [];
  }
  if (seed.city) {
    const r = await base().eq('city', seed.city);
    if (r.data && r.data.length > 0) return maskRows(r.data, 'd') ?? [];
  }
  const featured = await base().eq('featured', true).order('created_at', { ascending: false });
  if (featured.data && featured.data.length > 0) return maskRows(featured.data, 'd') ?? [];

  const any = await base().order('created_at', { ascending: false });
  return maskRows(any.data, 'd') || [];
}

export async function getFeaturedDevelopments(client: Client, limit = 6) {
  // Data vive en schema real_estate_hub (view v_developments).
  // Gate público: approved_at IS NOT NULL ⟺ web_status='published' (vía trigger
  // fn_sync_ext_publicado). zoho_pipeline_status NO controla visibilidad web.
  const hub = client.schema('real_estate_hub' as 'public');

  const featured = await hub
    .from('v_developments')
    .select('*')
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  const featuredRows = (featured.data || []) as Array<{ id: string; name?: string | null }>;

  // Si featured llenó la grid, devolver tal cual (normalizado).
  if (featuredRows.length >= limit) {
    return { ...featured, data: maskRows(normalizeNames(featured.data), 'd') };
  }

  // Llenar el resto con los más recientes aprobados no-featured (calca WP featured-properties.php).
  const fillLimit = limit - featuredRows.length;
  const featuredIds = featuredRows.map((r) => r.id);
  let recentQuery = hub
    .from('v_developments')
    .select('*')
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(fillLimit);

  if (featuredIds.length > 0) {
    recentQuery = recentQuery.not('id', 'in', `(${featuredIds.map((id) => `"${id}"`).join(',')})`);
  }

  const recent = await recentQuery;
  const merged = [...featuredRows, ...((recent.data || []) as typeof featuredRows)];
  return {
    data: maskRows(normalizeNames(merged), 'd'),
    error: featured.error || recent.error,
    count: featuredRows.length + (recent.data?.length || 0),
  };
}

export async function getDevelopmentsByCity(client: Client, city: string) {
  const res = await client
    .schema('real_estate_hub' as 'public')
    .from('v_developments')
    .select('*', { count: 'exact' })
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .eq('city', city)
    .order('created_at', { ascending: false });
  return { ...res, data: maskRows(res.data, 'd') };
}

export async function getCityCounts(client: Client) {
  // Returns count of developments per city
  return client
    .schema('real_estate_hub' as 'public')
    .from('v_developments')
    .select('city', { count: 'exact', head: false })
    .not('approved_at', 'is', null)
    .is('deleted_at', null);
}

export async function getGlobalStats(client: Client) {
  const hub = client.schema('real_estate_hub' as 'public');
  const [devsRes, unitsRes] = await Promise.all([
    hub
      .from('v_developments')
      .select('*', { count: 'exact' })
      .not('approved_at', 'is', null)
      .is('deleted_at', null),
    hub
      .from('v_units')
      .select('id', { count: 'exact', head: true })
      .not('approved_at', 'is', null)
      .is('deleted_at', null),
  ]);

  const devs = (devsRes.data || []) as Array<Record<string, unknown>>;
  const cities = new Set(devs.map(d => d.city as string).filter(Boolean));
  const zones = new Set(devs.map(d => d.zone as string).filter(Boolean));

  // Count by property type (flatten arrays)
  const typeCounts: Record<string, number> = {};
  for (const d of devs) {
    if (d.property_types && Array.isArray(d.property_types)) {
      for (const t of d.property_types) {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }
    }
  }

  return {
    developments: devsRes.count || devs.length,
    units: unitsRes.count || 0,
    cities: cities.size,
    zones: zones.size,
    typeCounts,
  };
}

export async function getBatchFinancials(client: Client, developmentIds: string[]) {
  if (developmentIds.length === 0) return [];
  const { data } = await inv(client)
    .from('development_financials')
    .select('development_id, cap_rate, estimated_rent_residencial, roi_annual_pct')
    .in('development_id', developmentIds);
  return data || [];
}

// ============================================================
// SLUG REDIRECTS (SEO preservation)
// ============================================================

/**
 * Lookup a permanent redirect for a slug that no longer exists.
 * Returns the current slug to redirect to, or null if no redirect is registered.
 */
export async function getSlugRedirect(
  client: Client,
  entityType: 'development' | 'unit',
  oldSlug: string,
): Promise<string | null> {
  const { data, error } = await client
    .schema('real_estate_hub' as 'public')
    .from('slug_redirects')
    .select('new_slug')
    .eq('entity_type', entityType)
    .eq('old_slug', oldSlug)
    .maybeSingle();

  if (error) {
    console.error('getSlugRedirect failed:', error);
    return null;
  }
  return (data as { new_slug: string } | null)?.new_slug ?? null;
}

// ============================================================
// UNIT QUERIES
// ============================================================

export async function getUnitBySlug(client: Client, slug: string) {
  const res = await client
    .schema('real_estate_hub' as 'public')
    .from('v_units')
    .select('*')
    .eq('slug', slug)
    .single();
  return { ...res, data: maskRow(res.data as { id?: string | null; images?: string[] | null } | null, 'u') };
}

export interface UnitFilters {
  city?: string;
  zone?: string;
  unitType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  availabilityStatus?: string;
  developmentId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'price_asc' | 'price_desc' | 'newest' | 'area_desc';
}

export async function getUnits(client: Client, filters: UnitFilters = {}) {
  let query = hub(client)
    .from('v_units')
    .select('*', { count: 'exact' })
    .not('approved_at', 'is', null)
    .is('deleted_at', null);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.zone) query = query.eq('zone', filters.zone);
  if (filters.unitType) query = query.eq('unit_type', filters.unitType);
  if (filters.minPrice) query = query.gte('price_mxn', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_mxn', filters.maxPrice);
  if (filters.minBedrooms) query = query.gte('bedrooms', filters.minBedrooms);
  if (filters.availabilityStatus) query = query.eq('availability_status', filters.availabilityStatus);
  if (filters.developmentId) query = query.eq('development_id', filters.developmentId);

  if (filters.search) {
    const q = sanitizePostgrestFilter(filters.search);
    if (q) query = query.or(`name.ilike.*${q}*,city.ilike.*${q}*,zone.ilike.*${q}*,development_name.ilike.*${q}*`);
  }

  switch (filters.orderBy) {
    case 'price_asc':
      query = query.order('price_mxn', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price_mxn', { ascending: false });
      break;
    case 'area_desc':
      query = query.order('area_m2', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const res = await query;
  return { ...res, data: maskRows(res.data, 'u') };
}

/**
 * Unidades con descuento activo. Source: v_units.is_discount_active.
 * Filtra approved + no eliminado + descuento vigente (server-side via view).
 * Usado en /promociones y en la sección "Unidades con descuento" del home.
 */
export async function getDiscountedUnits(client: Client, limit = 12) {
  const res = await hub(client)
    .from('v_units')
    .select('*')
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .eq('is_discount_active', true)
    .order('discount_pct', { ascending: false, nullsFirst: false })
    .limit(limit);
  return { ...res, data: maskRows(res.data, 'u') };
}

export async function getAvailableUnits(client: Client, developmentId: string) {
  return crm(client)
    .from('units')
    .select('*')
    .eq('development_id', developmentId)
    .eq('status', 'disponible')
    .is('deleted_at', null)
    .order('price_mxn', { ascending: true });
}

/**
 * 4-level fallback for similar units. Returns the first non-empty bucket.
 *   L1: same unit_type + same zone
 *   L2: same zone (any type)
 *   L3: same city (any type)
 *   L4: featured units (any city)
 */
export async function getSimilarUnits(
  client: Client,
  seed: { id: string; city: string; zone: string | null; unit_type: string | null },
  limit = 4
) {
  // Filtro canónico (idéntico a getSimilarDevelopments, getUnits, getGlobalStats):
  // approved_at IS NOT NULL ⟺ web_status='published' (vía trigger). Previene fuga
  // de unidades draft, duplicadas (slugs `-copy-`) o de developments unpublished
  // a la sección "Propiedades similares" del detail page.
  const base = () =>
    hub(client)
      .from('v_units')
      .select('id, slug, name, unit_number, development_name, city, zone, images, price_mxn, bedrooms, bathrooms, area_m2, unit_type')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .neq('id', seed.id)
      .limit(limit);

  if (seed.zone && seed.unit_type) {
    const r = await base().eq('zone', seed.zone).eq('unit_type', seed.unit_type);
    if (r.data && r.data.length > 0) return maskRows(r.data, 'u') ?? [];
  }
  if (seed.zone) {
    const r = await base().eq('zone', seed.zone);
    if (r.data && r.data.length > 0) return maskRows(r.data, 'u') ?? [];
  }
  if (seed.city) {
    const r = await base().eq('city', seed.city);
    if (r.data && r.data.length > 0) return maskRows(r.data, 'u') ?? [];
  }
  const r = await base().order('created_at', { ascending: false });
  return maskRows(r.data, 'u') || [];
}

// ============================================================
// CONTACT/LEAD QUERIES (unified)
// ============================================================

export async function createContact(client: Client, data: Record<string, unknown>) {
  return crm(client).from('contacts').insert(data).select().single();
}

export async function getContacts(client: Client, filters: { status?: string; temperature?: string; limit?: number; offset?: number } = {}) {
  let query = crm(client)
    .from('contacts')
    .select('*, developments:source_development_id(name, slug, city)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.temperature) query = query.eq('temperature', filters.temperature);

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  return query;
}

export async function updateContactStatus(client: Client, id: string, status: string) {
  return crm(client).from('contacts').update({ status }).eq('id', id);
}

// ============================================================
// DEVELOPER QUERIES
// ============================================================

/**
 * Fetch a developer's record from `Propyte_desarrolladores` by id. Returns
 * a normalized shape with English-aliased keys, since the base table uses
 * Spanish column names (nombre_desarrollador, ext_slug_desarrollador, logo).
 * Used as a fallback when `v_developments.developer_name` comes back null
 * (the view does not always expose the joined fields).
 */
export interface DeveloperRecord {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  website: string | null;
  verified: boolean;
  rating: number | null;
  activeProjects: number | null;
  yearsExperience: number | null;
  projectsDelivered: number | null;
  unitsDelivered: number | null;
}

export async function getDeveloperById(client: Client, developerId: string): Promise<DeveloperRecord | null> {
  if (!developerId) return null;

  // Primary: v_developers (English-aliased view with anon GRANT — preferred
  // for public consumption, not subject to per-row policies on the base table).
  try {
    const { data: v } = await hub(client)
      .from('v_developers')
      .select('*')
      .eq('id', developerId)
      .maybeSingle();
    if (v) {
      const d = v as Record<string, unknown>;
      const name = (d.name as string | null) || (d.nombre_desarrollador as string | null) || '';
      if (name) {
        return {
          id: d.id as string,
          name,
          slug: (d.slug as string | null) || (d.ext_slug_desarrollador as string | null) || null,
          logoUrl: (d.logo_url as string | null) || (d.logo as string | null) || null,
          descriptionEs: (d.description_es as string | null) || (d.descripcion as string | null) || null,
          descriptionEn: (d.description_en as string | null) || (d.ext_descripcion_en as string | null) || null,
          website: (d.website as string | null) || (d.sitio_web as string | null) || null,
          verified: !!(d.verified ?? d.es_verificado),
          rating: (d.rating as number | null) ?? (d.calificacion as number | null) ?? null,
          activeProjects: (d.active_projects as number | null) ?? (d.proyectos_activos as number | null) ?? null,
          yearsExperience: (d.years_experience as number | null) ?? (d.anos_experiencia as number | null) ?? null,
          projectsDelivered: (d.delivered_projects as number | null)
            ?? (d.projects_delivered as number | null)
            ?? (d.proyectos_entregados as number | null)
            ?? null,
          unitsDelivered: (d.delivered_units as number | null)
            ?? (d.units_delivered as number | null)
            ?? (d.unidades_entregadas as number | null)
            ?? null,
        };
      }
    }
  } catch {
    // fall through to base table fallback
  }

  // Fallback: Propyte_desarrolladores (Spanish columns, RLS-gated).
  try {
    const { data } = await hub(client)
      .from('Propyte_desarrolladores')
      .select('id, nombre_desarrollador, ext_slug_desarrollador, logo, descripcion, ext_descripcion_en, sitio_web, es_verificado, calificacion, proyectos_activos, anos_experiencia, proyectos_entregados, unidades_entregadas')
      .eq('id', developerId)
      .maybeSingle();
    if (!data) return null;
    const d = data as Record<string, unknown>;
    const name = (d.nombre_desarrollador as string | null) || '';
    if (!name) return null;
    return {
      id: d.id as string,
      name,
      slug: (d.ext_slug_desarrollador as string | null) || null,
      logoUrl: (d.logo as string | null) || null,
      descriptionEs: (d.descripcion as string | null) || null,
      descriptionEn: (d.ext_descripcion_en as string | null) || null,
      website: (d.sitio_web as string | null) || null,
      verified: !!d.es_verificado,
      rating: (d.calificacion as number | null) ?? null,
      activeProjects: (d.proyectos_activos as number | null) ?? null,
      yearsExperience: (d.anos_experiencia as number | null) ?? null,
      projectsDelivered: (d.proyectos_entregados as number | null) ?? null,
      unitsDelivered: (d.unidades_entregadas as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Count of approved developments for a given developer.
 * Runs during ISR revalidate — cost is amortized across 3600s.
 * Returns 0 on error or if developerId is falsy.
 */
export async function getDeveloperProjectCount(client: Client, developerId: string): Promise<number> {
  if (!developerId) return 0;
  try {
    const { count } = await hub(client)
      .from('v_developments')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', developerId)
      .not('approved_at', 'is', null)
      .is('deleted_at', null);
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getDevelopers(client: Client) {
  return client
    .schema('real_estate_hub' as 'public')
    .from('v_developers')
    .select('*')
    .not('approved_at', 'is', null)
    .order('name');
}

export interface DeveloperDevelopment {
  id: string;
  slug: string;
  name: string;
  images: string[] | null;
  min_price_mxn: number | null;
  price_mxn: number | null;
  stage: string | null;
  city: string | null;
  zone: string | null;
}

export async function getDeveloperDevelopments(
  client: Client,
  developerId: string,
): Promise<DeveloperDevelopment[]> {
  if (!developerId) return [];
  try {
    const { data, error } = await hub(client)
      .from('v_developments')
      .select('id, slug, name, images, min_price_mxn, price_mxn, stage, city, zone')
      .eq('developer_id', developerId)
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .order('name');
    if (error) { console.error('[getDeveloperDevelopments]', error.message); return []; }
    return (maskRows(data ?? [], 'd') ?? []) as unknown as DeveloperDevelopment[];
  } catch {
    return [];
  }
}

export async function getDeveloperBySlug(
  client: Client,
  slug: string,
): Promise<DeveloperRecord | null> {
  if (!slug) return null;
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) return null;
  try {
    const { data: v } = await hub(client)
      .from('v_developers')
      .select('*')
      .or(`slug.eq.${safeSlug},ext_slug_desarrollador.eq.${safeSlug}`)
      .maybeSingle();
    if (!v) return null;
    const d = v as Record<string, unknown>;
    const name = (d.name as string | null) || (d.nombre_desarrollador as string | null) || '';
    if (!name) return null;
    return {
      id: d.id as string,
      name,
      slug: (d.slug as string | null) || (d.ext_slug_desarrollador as string | null) || null,
      logoUrl: (d.logo_url as string | null) || (d.logo as string | null) || null,
      descriptionEs: (d.description_es as string | null) || (d.descripcion as string | null) || null,
      descriptionEn: (d.description_en as string | null) || (d.ext_descripcion_en as string | null) || null,
      website: (d.website as string | null) || (d.sitio_web as string | null) || null,
      verified: !!(d.verified ?? d.es_verificado),
      rating: (d.rating as number | null) ?? null,
      activeProjects: (d.active_projects as number | null) ?? null,
      yearsExperience: (d.years_experience as number | null) ?? null,
      projectsDelivered: (d.delivered_projects as number | null) ?? null,
      unitsDelivered: (d.delivered_units as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

// ============================================================
// TEAM MEMBERS (real_estate_hub.v_team_members)
// ============================================================

export type TeamLevel = 'ceo' | 'director' | 'department' | 'member';

export interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  city: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  photo_url: string | null;
  bio_short: string | null;
  bio_long: string | null;
  bio_long_en: string | null;
  sort_order: number;
  level: TeamLevel;
  department_name: string | null;
  reports_to_id: string | null;
  role_code: string | null;
  role_color: string | null;
  is_corporate: boolean;
  is_vacant: boolean;
}

/**
 * Lista miembros del equipo comercial. La vista v_team_members ya
 * filtra active=true, level<>'department' y show_in_team_page=true.
 * Aquí descartamos vacantes (no muestran nombre real).
 * Source of truth: hub.propyte.com/equipo (toggle "Aparece en /equipo-comercial").
 */
export async function getTeamMembers(client: Client): Promise<TeamMemberRow[]> {
  if (!client) return [];
  try {
    const { data, error } = await hub(client)
      .from('v_team_members')
      .select('*')
      .eq('is_vacant', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('[getTeamMembers] error:', error.message);
      return [];
    }
    return (data ?? []) as TeamMemberRow[];
  } catch (e) {
    console.warn('[getTeamMembers] exception:', e);
    return [];
  }
}

// ============================================================
// ORG STRUCTURE (real_estate_hub.v_org_structure)
// ============================================================

export interface OrgNodeRow {
  id: string;
  name: string;
  role: string;
  level: TeamLevel;
  department_name: string | null;
  reports_to_id: string | null;
  icon_name: string | null;
  role_code: string | null;
  role_color: string | null;
  is_corporate: boolean;
  is_vacant: boolean;
  sort_order: number;
  photo_url: string | null;
  city: string | null;
  bio_long: string | null;
  bio_long_en: string | null;
}

/**
 * Trae todos los nodos del organigrama (CEO + directores + departamentos
 * + miembros activos). Source of truth: hub.propyte.com/equipo con campos
 * jerárquicos. Devuelve [] si falla.
 */
export async function getOrgStructure(client: Client): Promise<OrgNodeRow[]> {
  if (!client) return [];
  try {
    const { data, error } = await hub(client)
      .from('v_org_structure')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('[getOrgStructure] error:', error.message);
      return [];
    }
    return (data ?? []) as OrgNodeRow[];
  } catch (e) {
    console.warn('[getOrgStructure] exception:', e);
    return [];
  }
}

// ============================================================
// PAGE CONTENT (real_estate_hub.page_content)
// ============================================================

/**
 * Trae los textos editables de una página en un locale específico,
 * indexados como `${section}.${field}` para acceso fácil. Si la fila
 * no existe, el caller debe usar fallback i18n.
 */
export async function getPageContent(
  client: Client,
  pageKey: string,
  locale: string,
): Promise<Record<string, string>> {
  if (!client) return {};
  try {
    const { data, error } = await hub(client)
      .from('page_content')
      .select('section_key, field_key, value')
      .eq('page_key', pageKey)
      .eq('locale', locale);
    if (error) {
      console.warn('[getPageContent] error:', error.message);
      return {};
    }
    const out: Record<string, string> = {};
    for (const row of (data ?? []) as Array<{ section_key: string; field_key: string; value: string | null }>) {
      if (row.value != null) out[`${row.section_key}.${row.field_key}`] = row.value;
    }
    return out;
  } catch (e) {
    console.warn('[getPageContent] exception:', e);
    return {};
  }
}

// ============================================================
// PARTNERS (real_estate_hub.v_partners)
// ============================================================

export type PartnerCategory = 'developer' | 'bank' | 'notary' | 'insurance' | 'other';

export interface PartnerRow {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  category: PartnerCategory;
  sort_order: number;
}

/**
 * Lista logos de aliados (desarrolladoras/bancos/notarías/aseguradoras),
 * ordenados por sort_order asc. Lee de la vista `real_estate_hub.v_partners`
 * (filtra active=TRUE AND logo_url IS NOT NULL + GRANT anon explícito).
 * Source of truth: hub.propyte.com/aliados.
 *
 * Hide-when-empty: devuelve [] si la tabla no existe / no hay aliados activos
 * — el caller renderiza nada cuando length === 0.
 */
export async function getPartners(
  client: Client,
  category?: PartnerCategory,
): Promise<PartnerRow[]> {
  if (!client) return [];
  try {
    let query = hub(client)
      .from('v_partners')
      .select('id, name, logo_url, website_url, category, sort_order')
      .order('sort_order', { ascending: true });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) {
      console.warn('[getPartners] error:', error.message);
      return [];
    }
    return (data ?? []) as PartnerRow[];
  } catch (e) {
    console.warn('[getPartners] exception:', e);
    return [];
  }
}

// ============================================================
// CASE STUDIES (real_estate_hub.v_case_studies)
// ============================================================

export type CaseStudyAudience = 'developer' | 'broker' | 'investor';

export interface CaseStudyRow {
  id: string;
  slug: string | null;
  client_name: string;
  audience: CaseStudyAudience;
  image_url: string | null;
  title_es: string;
  title_en: string | null;
  summary_es: string | null;
  summary_en: string | null;
  metric1_label_es: string | null;
  metric1_label_en: string | null;
  metric1_value: string | null;
  metric2_label_es: string | null;
  metric2_label_en: string | null;
  metric2_value: string | null;
  metric3_label_es: string | null;
  metric3_label_en: string | null;
  metric3_value: string | null;
  sort_order: number;
}

/**
 * Lista casos de éxito activos, ordenados por sort_order asc.
 * Lee de `real_estate_hub.v_case_studies`. Hide-when-empty pattern.
 */
export async function getCaseStudies(
  client: Client,
  audience?: CaseStudyAudience,
): Promise<CaseStudyRow[]> {
  if (!client) return [];
  try {
    let query = hub(client)
      .from('v_case_studies')
      .select('*')
      .order('sort_order', { ascending: true });
    if (audience) query = query.eq('audience', audience);
    const { data, error } = await query;
    if (error) {
      console.warn('[getCaseStudies] error:', error.message);
      return [];
    }
    return (data ?? []) as CaseStudyRow[];
  } catch (e) {
    console.warn('[getCaseStudies] exception:', e);
    return [];
  }
}

// ============================================================
// BROKER COMMISSIONS (real_estate_hub.v_broker_commissions)
// ============================================================

export type CommissionPropertyType = 'residencial' | 'comercial' | 'terreno';
export type CommissionStage = 'preventa' | 'inmediata' | 'usada';

export interface BrokerCommissionRow {
  id: string;
  property_type: CommissionPropertyType;
  stage: CommissionStage;
  commission_pct: number;
  notes_es: string | null;
  notes_en: string | null;
  sort_order: number;
}

export async function getBrokerCommissions(client: Client): Promise<BrokerCommissionRow[]> {
  if (!client) return [];
  try {
    const { data, error } = await hub(client)
      .from('v_broker_commissions')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('[getBrokerCommissions] error:', error.message);
      return [];
    }
    return (data ?? []) as BrokerCommissionRow[];
  } catch (e) {
    console.warn('[getBrokerCommissions] exception:', e);
    return [];
  }
}

// ============================================================
// ANALYTICS: WEB EVENTS
// ============================================================

export async function trackWebEvent(
  client: Client,
  developmentId: string,
  eventType: string,
  _locale = 'es',
) {
  // Aggregate into fact_web_events (daily)
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart(new Date()).toISOString().slice(0, 10);

  const columnMap: Record<string, string> = {
    view: 'page_views',
    whatsapp_click: 'whatsapp_clicks',
    call_click: 'call_clicks',
    form_submit: 'form_submissions',
    share: 'shares',
    save: 'saves',
  };

  const column = columnMap[eventType] || 'page_views';

  // Try upsert with increment
  const { error } = await client.rpc('increment_web_event', {
    p_event_date: today,
    p_week_start: weekStart,
    p_development_id: developmentId,
    p_column: column,
  });

  // Fallback: direct insert if RPC not available
  if (error) {
    return client.from('fact_web_events').upsert({
      event_date: today,
      week_start: weekStart,
      development_id: developmentId,
      page_type: 'detail',
      [column]: 1,
    }, { onConflict: 'event_date,development_id,page_type' });
  }
}

// ============================================================
// ANALYTICS: DASHBOARD QUERIES
// ============================================================

export async function getInventorySnapshot(client: Client, developmentId: string, weeks = 12) {
  return client
    .from('fact_inventory_weekly')
    .select('*')
    .eq('development_id', developmentId)
    .order('week_start', { ascending: false })
    .limit(weeks);
}

export async function getLeadsByWeek(client: Client, zoneId?: string, weeks = 12) {
  let query = client
    .from('fact_leads')
    .select('week_start, channel_id, qualified, converted')
    .gte('week_start', getWeeksAgo(weeks).toISOString().slice(0, 10));

  if (zoneId) query = query.eq('zone_id', zoneId);

  return query;
}

export async function getMarketingSpend(client: Client, weeks = 12) {
  return client
    .from('fact_marketing_spend')
    .select('*')
    .gte('week_start', getWeeksAgo(weeks).toISOString().slice(0, 10))
    .order('week_start', { ascending: false });
}

export async function getMmmData(client: Client, zoneId?: string) {
  let query = client
    .from('mv_mmm_weekly')
    .select('*')
    .order('week_start', { ascending: true });

  if (zoneId) query = query.eq('zone_id', zoneId);

  return query;
}

// ============================================================
// RENTAL ESTIMATE QUERIES
// ============================================================

export interface RentalEstimate {
  city: string;
  zone: string | null;
  property_type: string;
  bedrooms: number | null;
  rental_type: string;
  sample_size: number;
  median_rent_mxn: number;
  avg_rent_mxn: number;
  p25_rent_mxn: number;
  p75_rent_mxn: number;
  min_rent_mxn: number;
  max_rent_mxn: number;
  avg_rent_per_m2: number | null;
  last_updated: string;
}

/**
 * Get rental estimate by querying rental_comparables directly.
 * Computes aggregates in JS since Supabase REST doesn't support percentile_cont.
 * Falls back: zone+type+beds → city+type+beds → city+type → city.
 */
export async function getRentalEstimate(
  client: Client,
  city: string,
  propertyType?: string | null,
  bedrooms?: number | null,
  zone?: string | null,
  rentalType: string = 'residencial',
): Promise<{ data: RentalEstimate | null; fallback: boolean }> {
  const MIN_SAMPLE = 3;

  // Normalize property type: penthouse → departamento for comparables search
  const normalizedType = propertyType === 'penthouse' ? 'departamento' : propertyType;

  // Build queries in fallback order
  const attempts: Array<{ filter: Record<string, unknown>; isFallback: boolean }> = [];

  if (zone && normalizedType && bedrooms) {
    attempts.push({ filter: { city, zone, property_type: normalizedType, bedrooms, rental_type: rentalType }, isFallback: false });
  }
  if (normalizedType && bedrooms) {
    attempts.push({ filter: { city, property_type: normalizedType, bedrooms, rental_type: rentalType }, isFallback: true });
  }
  if (normalizedType) {
    attempts.push({ filter: { city, property_type: normalizedType, rental_type: rentalType }, isFallback: true });
  }
  attempts.push({ filter: { city, rental_type: rentalType }, isFallback: true });

  // Data cleaning bounds (mirrors Python pipeline)
  const AREA_MIN = 15;
  const AREA_MAX = 800;
  const RENT_PER_M2_MAX = 2000;

  for (const attempt of attempts) {
    let query = inv(client)
      .from('rental_comparables')
      .select('monthly_rent_mxn, area_m2, bedrooms, zone')
      .eq('active', true)
      .gte('monthly_rent_mxn', RENT_BOUNDS.MIN)
      .lte('monthly_rent_mxn', RENT_BOUNDS.MAX);

    for (const [key, value] of Object.entries(attempt.filter)) {
      if (value != null) {
        query = query.eq(key, value);
      }
    }

    const { data } = await query.order('monthly_rent_mxn', { ascending: true });

    if (data && data.length >= MIN_SAMPLE) {
      // Clean: filter invalid areas and extreme rent/m² before computing stats
      const cleaned = data.filter((d: { monthly_rent_mxn: number; area_m2: number | null }) => {
        if (d.area_m2 != null && d.area_m2 > 0) {
          if (d.area_m2 < AREA_MIN || d.area_m2 > AREA_MAX) return false;
          const rpm2 = d.monthly_rent_mxn / d.area_m2;
          if (rpm2 > RENT_PER_M2_MAX) return false;
        }
        return true;
      });
      if (cleaned.length < MIN_SAMPLE) continue;

      // IQR outlier removal within this group
      const allRents = cleaned.map((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn).sort((a: number, b: number) => a - b);
      const q1 = allRents[Math.floor(allRents.length * 0.25)];
      const q3 = allRents[Math.floor(allRents.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 2.5 * iqr;
      const upper = q3 + 2.5 * iqr;
      const filtered = iqr > 0
        ? cleaned.filter((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn >= lower && d.monthly_rent_mxn <= upper)
        : cleaned;
      if (filtered.length < MIN_SAMPLE) continue;

      const prices = filtered.map((d: { monthly_rent_mxn: number }) => d.monthly_rent_mxn).sort((a: number, b: number) => a - b);
      const areas = filtered
        .filter((d: { area_m2: number | null }) => d.area_m2 && d.area_m2 >= AREA_MIN)
        .map((d: { area_m2: number; monthly_rent_mxn: number }) => d.monthly_rent_mxn / d.area_m2);

      const median = prices[Math.floor(prices.length / 2)];
      const p25 = prices[Math.floor(prices.length * 0.25)];
      const p75 = prices[Math.floor(prices.length * 0.75)];
      const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
      const avgPerM2 = areas.length >= 3
        ? Math.round((areas.reduce((a: number, b: number) => a + b, 0) / areas.length) * 100) / 100
        : null;

      return {
        data: {
          city,
          zone: zone || null,
          property_type: propertyType || 'departamento',
          bedrooms: bedrooms || null,
          rental_type: rentalType,
          sample_size: prices.length,
          median_rent_mxn: median,
          avg_rent_mxn: avg,
          p25_rent_mxn: p25,
          p75_rent_mxn: p75,
          min_rent_mxn: prices[0],
          max_rent_mxn: prices[prices.length - 1],
          avg_rent_per_m2: avgPerM2,
          last_updated: new Date().toISOString(),
        },
        fallback: attempt.isFallback,
      };
    }
  }

  return { data: null, fallback: true };
}

/**
 * Get both residential and vacation rental estimates.
 */
export async function getRentalEstimates(
  client: Client,
  city: string,
  propertyType?: string | null,
  bedrooms?: number | null,
  zone?: string | null,
): Promise<{ residencial: RentalEstimate | null; vacacional: RentalEstimate | null }> {
  const [residencial, vacacional] = await Promise.all([
    getRentalEstimate(client, city, propertyType, bedrooms, zone, 'residencial'),
    getRentalEstimate(client, city, propertyType, bedrooms, zone, 'vacacional'),
  ]);

  return {
    residencial: residencial.data,
    vacacional: vacacional.data,
  };
}

// ============================================================
// ML RENTAL ESTIMATES & DEVELOPMENT FINANCIALS
// ============================================================

export async function getDevelopmentFinancials(client: Client, developmentId: string) {
  const { data, error } = await inv(client)
    .from('development_financials')
    .select('*')
    .eq('development_id', developmentId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getMlRentalEstimates(client: Client, developmentId: string) {
  const { data } = await inv(client)
    .from('rental_ml_estimates')
    .select('*')
    .eq('development_id', developmentId)
    .order('bedrooms', { ascending: true });

  return data || [];
}

export async function getMlRentalEstimateForUnit(
  client: Client,
  developmentId: string,
  unitType: string,
  bedrooms: number,
) {
  const { data } = await inv(client)
    .from('rental_ml_estimates')
    .select('*')
    .eq('development_id', developmentId)
    .eq('unit_type', unitType)
    .eq('bedrooms', bedrooms)
    .single();

  return data || null;
}

// ============================================================
// AIRDNA MARKET DATA
// ============================================================

export interface AirdnaZoneSummary {
  zone: string;
  submarket: string;
  occupancy: number | null;
  adr: number | null;
}

export interface AirdnaMarketSummary {
  current_occupancy: number | null;
  avg_occupancy_12m: number | null;
  current_adr: number | null;
  adr_by_beds: Record<string, number>;
  active_listings: number | null;
  rate_tiers: Record<string, number>;
  latest_date: string | null;
  occupancy_trend: Array<{ date: string; value: number }>;
  zones: AirdnaZoneSummary[];
}

export async function getAirdnaMarketSummary(
  client: Client,
  market: string,
): Promise<AirdnaMarketSummary | null> {
  if (!market) return null;

  // Fetch latest data points in parallel
  const [occResult, adrResult, adrBedsResult, listingsResult, tiersResult] = await Promise.all([
    // Occupancy trend (last 12 unique dates, market-level)
    inv(client).from('airdna_metrics')
      .select('metric_date, metric_value')
      .eq('market', market).eq('section', 'occupancy').eq('chart', 'chart_1').eq('metric_name', 'occupancy')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(12),
    // ADR overall
    inv(client).from('airdna_metrics')
      .select('metric_value, metric_date')
      .eq('market', market).eq('section', 'rates').eq('chart', 'chart_1').eq('metric_name', 'daily_rate')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(1),
    // ADR by bedrooms (latest)
    inv(client).from('airdna_metrics')
      .select('metric_name, metric_value, metric_date')
      .eq('market', market).eq('section', 'rates').eq('chart', 'chart_2')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(12),
    // Listings by bedrooms (latest)
    inv(client).from('airdna_metrics')
      .select('metric_name, metric_value, metric_date')
      .eq('market', market).eq('section', 'listings').eq('chart', 'chart_1')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(6),
    // Rate tiers (latest)
    inv(client).from('airdna_metrics')
      .select('metric_name, metric_value')
      .eq('market', market).eq('section', 'rates').eq('chart', 'chart_3')
      .is('submarket', null)
      .order('metric_date', { ascending: false }).limit(5),
  ]);

  const occData = occResult.data || [];
  if (occData.length === 0) return null; // No AirDNA data for this market

  // Deduplicate occupancy by date (take first per date)
  const seenDates = new Set<string>();
  const uniqueOcc: Array<{ date: string; value: number }> = [];
  for (const r of occData) {
    if (r.metric_value != null && !seenDates.has(r.metric_date)) {
      seenDates.add(r.metric_date);
      uniqueOcc.push({ date: r.metric_date, value: r.metric_value });
    }
  }

  const currentOcc = uniqueOcc[0]?.value ?? null;
  const avgOcc = uniqueOcc.length > 0
    ? Math.round((uniqueOcc.reduce((s, r) => s + r.value, 0) / uniqueOcc.length) * 100) / 100
    : null;

  // ADR by bedrooms — deduplicate by metric_name (take latest per name)
  const adrByBeds: Record<string, number> = {};
  for (const r of (adrBedsResult.data || [])) {
    if (r.metric_value != null && !adrByBeds[r.metric_name]) {
      adrByBeds[r.metric_name] = Math.round(r.metric_value);
    }
  }

  // Total listings
  const totalListings = (listingsResult.data || [])
    .filter((r, i, arr) => {
      // Take latest date only
      const latestDate = arr[0]?.metric_date;
      return r.metric_date === latestDate && r.metric_value != null;
    })
    .reduce((sum, r) => sum + (r.metric_value || 0), 0);

  // Rate tiers
  const rateTiers: Record<string, number> = {};
  for (const r of (tiersResult.data || [])) {
    if (r.metric_value != null && !rateTiers[r.metric_name]) {
      rateTiers[r.metric_name] = Math.round(r.metric_value);
    }
  }

  return {
    current_occupancy: currentOcc,
    avg_occupancy_12m: avgOcc,
    current_adr: adrResult.data?.[0]?.metric_value ? Math.round(adrResult.data[0].metric_value) : null,
    adr_by_beds: adrByBeds,
    active_listings: totalListings || null,
    rate_tiers: rateTiers,
    latest_date: uniqueOcc[0]?.date ?? null,
    occupancy_trend: uniqueOcc.reverse(),
    zones: await fetchSubmarketZones(client, market),
  };
}

async function fetchSubmarketZones(
  client: Client,
  market: string,
): Promise<AirdnaZoneSummary[]> {
  // Get latest occupancy and ADR per submarket
  const { data } = await inv(client)
    .from('airdna_metrics')
    .select('submarket, section, chart, metric_name, metric_value, metric_date')
    .eq('market', market)
    .not('submarket', 'is', null)
    .in('section', ['occupancy', 'rates'])
    .order('metric_date', { ascending: false })
    .limit(2000);

  if (!data || data.length === 0) return [];

  // Group by submarket, take latest occupancy and ADR
  const bySubmarket: Record<string, { occupancy: number | null; adr: number | null }> = {};
  for (const r of data) {
    const sub = r.submarket!;
    if (!bySubmarket[sub]) bySubmarket[sub] = { occupancy: null, adr: null };
    if (r.section === 'occupancy' && r.chart === 'chart_1' && r.metric_name === 'occupancy' && bySubmarket[sub].occupancy === null) {
      bySubmarket[sub].occupancy = r.metric_value;
    }
    if (r.section === 'rates' && r.chart === 'chart_1' && r.metric_name === 'daily_rate' && bySubmarket[sub].adr === null) {
      bySubmarket[sub].adr = r.metric_value ? Math.round(r.metric_value) : null;
    }
  }

  return Object.entries(bySubmarket)
    .map(([submarket, vals]) => ({
      zone: MARKET_SUBMARKET_TO_ZONE[submarket] || submarket.toUpperCase(),
      submarket,
      occupancy: vals.occupancy,
      adr: vals.adr,
    }))
    .sort((a, b) => (b.adr || 0) - (a.adr || 0));
}

// ============================================================
// ADMIN: DEVELOPMENT CRUD
// ============================================================

export async function createDevelopment(client: Client, data: Record<string, unknown>) {
  return crm(client).from('developments').insert(data).select().single();
}

export async function updateDevelopment(client: Client, id: string, data: Record<string, unknown>) {
  return crm(client).from('developments').update(data).eq('id', id).select().single();
}

export async function deleteDevelopment(client: Client, id: string) {
  // Soft delete
  return crm(client).from('developments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
}

export async function bulkInsertDevelopments(client: Client, developments: Record<string, unknown>[]) {
  return crm(client).from('developments').insert(developments).select();
}

// ============================================================
// ADMIN: UNIT CRUD
// ============================================================

export async function createUnit(client: Client, data: Record<string, unknown>) {
  return crm(client).from('units').insert(data).select().single();
}

export async function updateUnit(client: Client, id: string, data: Record<string, unknown>) {
  return crm(client).from('units').update(data).eq('id', id).select().single();
}

export async function bulkInsertUnits(client: Client, units: Record<string, unknown>[]) {
  return crm(client).from('units').insert(units).select();
}

// ============================================================
// AUTH HELPERS
// ============================================================

export async function getCurrentProfile(client: Client) {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

// ============================================================
// HELPERS
// ============================================================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function getWeeksAgo(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return getWeekStart(d);
}

// ============================================================
// ANALYTICS: ZONE SCORES
// ============================================================

export interface ZoneScore {
  id: number;
  city: string;
  zone: string;
  score: number | null;
  yield_component: number | null;
  occupancy_component: number | null;
  adr_growth_component: number | null;
  supply_pressure_component: number | null;
  revpar: number | null;
  price_to_rent_ratio: number | null;
  yield_spread: number | null;
  supply_demand_ratio: number | null;
  active_listings: number | null;
  median_adr: number | null;
  median_occupancy: number | null;
  median_rent: number | null;
  cluster_label: string | null;
  computed_at: string;
}

// Zone names that are DB slugs, not real geography
const INVALID_ZONE_PATTERNS = [
  /^SUBMARKET_/i,
  /^ZONA_/i,
  /^zona_/,
  /^submarket_/,
];
const INVALID_ZONE_NAMES = new Set([
  'Venta', 'Villa', 'Piso', 'Casa', 'Departamento', 'Penthouse',
  'venta', 'villa', 'piso', 'casa', 'departamento', 'penthouse',
]);

function isValidZoneName(zone: string): boolean {
  if (!zone || zone.length > 50) return false;
  if (INVALID_ZONE_NAMES.has(zone)) return false;
  if (INVALID_ZONE_PATTERNS.some((p) => p.test(zone))) return false;
  // Single word that looks like a listing title (contains uppercase + lowercase mix with spaces)
  if (zone.includes('RENTA') || zone.includes('VENTA')) return false;
  return true;
}

export async function getZoneScores(client: Client, city?: string) {
  let query = client
    .from('zone_scores')
    .select('*')
    .order('computed_at', { ascending: false });

  if (city) query = query.eq('city', city);

  // Get latest snapshot: deduplicate by zone
  const { data, error } = await query.limit(5000);
  if (error) { console.error('[getZoneScores] Supabase error:', error.code, error.message, error.details); return []; }
  if (!data) { console.warn('[getZoneScores] No data returned (null)'); return []; }

  // Keep only latest per (city, zone)
  const seen = new Set<string>();
  const deduplicated = data.filter((row: ZoneScore) => {
    const key = `${row.city}:${row.zone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as ZoneScore[];

  // Filter out invalid zone names (DB slugs, listing titles, generic words)
  const validZones = deduplicated.filter((row) => isValidZoneName(row.zone));

  // Filter out cities with corrupt data (>50% identical scores or 0% occupancy)
  const cityGroups = new Map<string, ZoneScore[]>();
  for (const row of validZones) {
    const list = cityGroups.get(row.city) || [];
    list.push(row);
    cityGroups.set(row.city, list);
  }

  const cleanZones: ZoneScore[] = [];
  for (const [, zones] of cityGroups) {
    // Check if >50% have identical scores (fallback data)
    const scoreCounts = new Map<number, number>();
    for (const z of zones) {
      const s = Math.round(z.score ?? 0);
      scoreCounts.set(s, (scoreCounts.get(s) || 0) + 1);
    }
    const maxSameScore = Math.max(...scoreCounts.values());
    if (maxSameScore / zones.length > 0.5 && zones.length > 5) continue; // Skip corrupt city

    // Check if avg occupancy is 0 (no real data)
    const avgOcc = zones.reduce((a, z) => a + (z.median_occupancy ?? 0), 0) / zones.length;
    if (avgOcc < 1) continue; // Skip city with 0% occupancy

    cleanZones.push(...zones);
  }

  return cleanZones;
}

export async function getZoneDetail(client: Client, city: string, zone: string) {
  // Zone score
  const { data: scoreData } = await client
    .from('zone_scores')
    .select('*')
    .eq('city', city)
    .eq('zone', zone)
    .order('computed_at', { ascending: false })
    .limit(1);

  const score = scoreData?.[0] || null;

  // Get zone's submarket code for AirDNA lookups
  const submarkets = MARKET_SUBMARKET_TO_ZONE;
  const zoneSubmarkets = Object.entries(submarkets)
    .filter(([, z]) => z === zone)
    .map(([sub]) => sub);

  return { score, submarkets: zoneSubmarkets };
}

// ============================================================
// ANALYTICS: FORECASTS
// ============================================================

export interface MetricForecast {
  market: string;
  submarket: string | null;
  metric_name: string;
  forecast_date: string;
  predicted_value: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  model_type: string | null;
}

export async function getForecasts(
  client: Client,
  market: string,
  submarket?: string | null,
  metricName?: string,
): Promise<MetricForecast[]> {
  let query = client
    .from('metric_forecasts')
    .select('*')
    .eq('market', market)
    .order('forecast_date', { ascending: true });

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }
  if (metricName) query = query.eq('metric_name', metricName);

  const { data } = await query.limit(100);
  return (data || []) as MetricForecast[];
}

// ============================================================
// ANALYTICS: SEASONAL INDICES
// ============================================================

export interface SeasonalIndex {
  market: string;
  submarket: string | null;
  metric_name: string;
  month: number;
  seasonal_factor: number;
}

export async function getSeasonalIndices(
  client: Client,
  market: string,
  submarket?: string | null,
  metricName?: string,
): Promise<SeasonalIndex[]> {
  let query = client
    .from('seasonal_indices')
    .select('market,submarket,metric_name,month,seasonal_factor')
    .eq('market', market)
    .order('month', { ascending: true });

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }
  if (metricName) query = query.eq('metric_name', metricName);

  const { data } = await query.limit(100);
  return (data || []) as SeasonalIndex[];
}

// ============================================================
// ANALYTICS: MARKET ALERTS
// ============================================================

export interface MarketAlert {
  id: number;
  alert_type: string;
  city: string | null;
  zone: string | null;
  market: string | null;
  metric_name: string | null;
  current_value: number | null;
  expected_value: number | null;
  deviation_pct: number | null;
  severity: string;
  message: string | null;
  detected_at: string;
  resolved_at: string | null;
}

export async function getActiveAlerts(
  client: Client,
  city?: string,
  severity?: string,
): Promise<MarketAlert[]> {
  let query = client
    .from('market_alerts')
    .select('*')
    .is('resolved_at', null)
    .order('detected_at', { ascending: false });

  if (city) query = query.eq('city', city);
  if (severity) query = query.eq('severity', severity);

  const { data } = await query.limit(50);
  return (data || []) as MarketAlert[];
}

// ============================================================
// ANALYTICS: OCCUPANCY TREND (extended for charts)
// ============================================================

export async function getOccupancyTrend(
  client: Client,
  market: string,
  submarket?: string | null,
  months = 24,
): Promise<Array<{ date: string; value: number }>> {
  let query = inv(client)
    .from('airdna_metrics')
    .select('metric_date, metric_value')
    .eq('market', market)
    .eq('section', 'occupancy')
    .eq('chart', 'chart_1')
    .eq('metric_name', 'occupancy')
    .order('metric_date', { ascending: true })
    .limit(months);

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }

  const { data } = await query;
  if (!data) return [];

  const seen = new Set<string>();
  return data
    .filter((r: { metric_date: string; metric_value: number | null }) => {
      if (r.metric_value == null || seen.has(r.metric_date)) return false;
      seen.add(r.metric_date);
      return true;
    })
    .map((r: { metric_date: string; metric_value: number }) => ({
      date: r.metric_date,
      value: r.metric_value,
    }));
}

export async function getADRTrend(
  client: Client,
  market: string,
  submarket?: string | null,
  months = 24,
): Promise<Array<{ date: string; value: number }>> {
  let query = inv(client)
    .from('airdna_metrics')
    .select('metric_date, metric_value')
    .eq('market', market)
    .eq('section', 'rates')
    .eq('chart', 'chart_1')
    .eq('metric_name', 'daily_rate')
    .order('metric_date', { ascending: true })
    .limit(months);

  if (submarket) {
    query = query.eq('submarket', submarket);
  } else {
    query = query.is('submarket', null);
  }

  const { data } = await query;
  if (!data) return [];

  const seen = new Set<string>();
  return data
    .filter((r: { metric_date: string; metric_value: number | null }) => {
      if (r.metric_value == null || seen.has(r.metric_date)) return false;
      seen.add(r.metric_date);
      return true;
    })
    .map((r: { metric_date: string; metric_value: number }) => ({
      date: r.metric_date,
      value: Math.round(r.metric_value),
    }));
}

// ============================================================
// BACKWARD COMPAT: old function names mapping to new
// ============================================================

/** @deprecated Use getDevelopments() */
export const getProperties = getDevelopments;
/** @deprecated Use getDevelopmentBySlug() */
export const getPropertyBySlug = getDevelopmentBySlug;
/** @deprecated Use getSimilarDevelopments() */
export const getSimilarProperties = getSimilarDevelopments;
/** @deprecated Use getFeaturedDevelopments() */
export const getFeaturedProperties = getFeaturedDevelopments;
/** @deprecated Use createContact() */
export const createLead = createContact;
/** @deprecated Use getContacts() */
export const getLeads = getContacts;
/** @deprecated Use createDevelopment() */
export const createProperty = createDevelopment;
/** @deprecated Use updateDevelopment() */
export const updateProperty = updateDevelopment;
/** @deprecated Use deleteDevelopment() */
export const deleteProperty = deleteDevelopment;
/** @deprecated Use bulkInsertDevelopments() */
export const bulkInsertProperties = bulkInsertDevelopments;

// ============================================================
// BLOG QUERIES (public schema)
// ============================================================

export type BlogPost = {
  id: string;
  slug: string;
  locale: string;
  status: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  tags: string[];
  featured_image: string | null;
  author_name: string;
  author_image: string | null;
  read_time_min: number;
  meta_title: string | null;
  meta_description: string | null;
  related_city: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const BLOG_SELECT = `
  id, slug, locale, status, title, excerpt, content, category, tags,
  featured_image, author_name, author_image, read_time_min,
  meta_title, meta_description, related_city, published_at, created_at, updated_at
`.trim();

// En dev.propyte.com (Vercel), poner BLOG_INCLUDE_STAGED=true para ver posts en staging.
// En propyte.com (Hostinger) no definir la variable → solo muestra 'published'.
const includeStaged = process.env.BLOG_INCLUDE_STAGED === 'true';

export async function getBlogPosts(
  c: Client,
  opts: { locale?: string; category?: string; categories?: string[]; limit?: number; page?: number } = {}
): Promise<{ posts: BlogPost[]; total: number }> {
  const { locale = 'es', category, categories, limit = 9, page = 1 } = opts;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = c
    .from('blog_posts')
    .select(BLOG_SELECT, { count: 'exact' })
    .eq('locale', locale)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (includeStaged) {
    q = q.in('status', ['published', 'staged']);
  } else {
    q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  }

  if (category) q = q.eq('category', category);
  else if (categories && categories.length) q = q.in('category', categories);

  const { data, count, error } = await q;
  if (error) { console.error('[getBlogPosts]', error.message); return { posts: [], total: 0 }; }
  return { posts: (data as unknown as BlogPost[]) ?? [], total: count ?? 0 };
}

export async function getBlogPost(c: Client, slug: string, locale: string): Promise<BlogPost | null> {
  let q = c
    .from('blog_posts')
    .select(BLOG_SELECT)
    .eq('slug', slug)
    .eq('locale', locale);

  if (includeStaged) {
    q = q.in('status', ['published', 'staged']);
  } else {
    q = q.eq('status', 'published');
  }

  const { data, error } = await q.single();
  if (error) { console.error('[getBlogPost]', error.message); return null; }
  return data as unknown as BlogPost;
}

export async function getRelatedPosts(
  c: Client,
  opts: { category: string; excludeSlug: string; locale: string; limit?: number }
): Promise<BlogPost[]> {
  const { category, excludeSlug, locale, limit = 3 } = opts;

  let q = c
    .from('blog_posts')
    .select(BLOG_SELECT)
    .eq('locale', locale)
    .eq('category', category)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (includeStaged) {
    q = q.in('status', ['published', 'staged']);
  } else {
    q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  }

  const { data, error } = await q;
  if (error) { console.error('[getRelatedPosts]', error.message); return []; }
  return (data as unknown as BlogPost[]) ?? [];
}

export async function getBlogCategories(c: Client, locale: string): Promise<string[]> {
  let q = c
    .from('blog_posts')
    .select('category')
    .eq('locale', locale)
    .order('category');

  if (includeStaged) {
    q = q.in('status', ['published', 'staged']);
  } else {
    q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  }

  const { data, error } = await q;
  if (error) { console.error('[getBlogCategories]', error.message); return []; }
  const seen = new Set<string>();
  (data ?? []).forEach((r: { category: string }) => seen.add(r.category));
  return Array.from(seen);
}

export async function getBlogPostSlugs(c: Client): Promise<{ slug: string; locale: string }[]> {
  let q = c
    .from('blog_posts')
    .select('slug, locale');

  if (includeStaged) {
    q = q.in('status', ['published', 'staged']);
  } else {
    q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  }

  const { data, error } = await q;
  if (error) { console.error('[getBlogPostSlugs]', error.message); return []; }
  return (data ?? []) as unknown as { slug: string; locale: string }[];
}
