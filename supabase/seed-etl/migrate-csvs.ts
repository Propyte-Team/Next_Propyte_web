/**
 * ETL Script: Migrate all CSV data sources into centralized Supabase schema
 *
 * Sources:
 *   1. lanzamientos.csv     → developments (1,006 rows)
 *   2. redsearch_marketplace.csv → developments + enrichment (100 rows)
 *   3. proyectos.csv        → developments enrichment (40 rows)
 *   4. inventario.csv       → units (372 rows)
 *
 * Usage:
 *   npx tsx propyte-web/supabase/seed-etl/migrate-csvs.ts
 *
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ============================================================
// Config
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ROOT = resolve(__dirname, "../../../");

// ============================================================
// CSV Parser
// ============================================================

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================================================
// Helpers
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parsePrice(text: string): number | null {
  if (!text) return null;
  // "Desde $2,727,000 MXN" → 2727000
  const cleaned = text.replace(/[^0-9.]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function parseStage(
  etapa: string
): "proximamente" | "preventa" | "construccion" | "entrega_inmediata" {
  const lower = (etapa || "").toLowerCase().trim();
  if (lower.includes("próximamente") || lower.includes("proximamente"))
    return "proximamente";
  if (lower.includes("preventa") || lower.includes("lanzamiento"))
    return "preventa";
  if (lower.includes("construc")) return "construccion";
  if (
    lower.includes("entrega") ||
    lower.includes("inmediata") ||
    lower.includes("terminado")
  )
    return "entrega_inmediata";
  return "preventa";
}

function parseDate(text: string): string | null {
  if (!text) return null;
  // Handle: "2027-Q1" → "2027-01-01", "2025-Q4" → "2025-10-01"
  const qMatch = text.match(/(\d{4})-Q(\d)/);
  if (qMatch) {
    const month = (parseInt(qMatch[2]) - 1) * 3 + 1;
    return `${qMatch[1]}-${String(month).padStart(2, "0")}-01`;
  }
  // "2023-01" → "2023-01-01"
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  // "2023-07-01" → as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  // "Entrega inmediata" → null (handled by stage)
  return null;
}

function parseCommission(text: string): number | null {
  if (!text) return null;
  const num = parseFloat(text.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

function parseUnits(text: string): number | null {
  if (!text) return null;
  const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) || num === 0 ? null : num;
}

function normalizeCity(city: string): string {
  const c = city.trim();
  const map: Record<string, string> = {
    "playa del carmen": "Playa del Carmen",
    pdc: "Playa del Carmen",
    tulum: "Tulum",
    cancun: "Cancún",
    cancún: "Cancún",
    merida: "Mérida",
    mérida: "Mérida",
    guadalajara: "Guadalajara",
    monterrey: "Monterrey",
    "ciudad de mexico": "Ciudad de México",
    "ciudad de méxico": "Ciudad de México",
    cdmx: "Ciudad de México",
    queretaro: "Querétaro",
    querétaro: "Querétaro",
    puebla: "Puebla",
    "san miguel de allende": "San Miguel de Allende",
    vallarta: "Puerto Vallarta",
    "puerto vallarta": "Puerto Vallarta",
    leon: "León",
    león: "León",
  };
  return map[c.toLowerCase()] || c;
}

function guessZoneId(city: string, zone?: string): string | null {
  const c = normalizeCity(city).toLowerCase();
  const z = (zone || "").toLowerCase();

  if (c.includes("playa")) {
    if (z.includes("coco")) return "pdc-cocobeach";
    if (z.includes("playacar")) return "pdc-playacar";
    if (z.includes("centro")) return "pdc-centro";
    if (z.includes("gonzalo")) return "pdc-gonzaloGuerrero";
    if (z.includes("ejidal")) return "pdc-ejidal";
    return "pdc-other";
  }
  if (c.includes("tulum")) {
    if (z.includes("aldea") || z.includes("zamá") || z.includes("zama"))
      return "tulum-aldea-zama";
    if (z.includes("centro")) return "tulum-centro";
    if (z.includes("hotel")) return "tulum-hotelera";
    if (z.includes("region") || z.includes("región")) return "tulum-region15";
    return "tulum-other";
  }
  if (c.includes("cancún") || c.includes("cancun")) {
    if (z.includes("puerto")) return "cancun-puertoCancun";
    if (z.includes("hotel")) return "cancun-zonaHotelera";
    return "cancun-other";
  }
  if (c.includes("mérida") || c.includes("merida")) {
    if (z.includes("norte")) return "merida-norte";
    if (z.includes("centro")) return "merida-centro";
    return "merida-other";
  }
  return null;
}

function guessPlaza(
  city: string
): "PDC" | "TULUM" | "MERIDA" | "CANCUN" | "OTRO" {
  const c = normalizeCity(city).toLowerCase();
  if (c.includes("playa")) return "PDC";
  if (c.includes("tulum")) return "TULUM";
  if (c.includes("mérida") || c.includes("merida")) return "MERIDA";
  if (c.includes("cancún") || c.includes("cancun")) return "CANCUN";
  return "OTRO";
}

function guessPropertyTypes(
  tipo: string
): string[] {
  const t = (tipo || "").toLowerCase();
  const types: string[] = [];
  if (t.includes("departamento") || t.includes("depto")) types.push("departamento");
  if (t.includes("penthouse") || t.includes("ph")) types.push("penthouse");
  if (t.includes("casa") || t.includes("townhome") || t.includes("townhouse"))
    types.push("casa");
  if (t.includes("terreno") || t.includes("lote")) types.push("terreno");
  if (t.includes("macrolote")) types.push("macrolote");
  if (t.includes("studio") || t.includes("estudio")) types.push("studio");
  if (types.length === 0) types.push("departamento");
  return types;
}

// ============================================================
// ETL 1: lanzamientos.csv → developments
// ============================================================

async function migrateLanzamientos() {
  console.log("\n=== ETL 1: lanzamientos.csv → developments ===");
  const csv = readFileSync(resolve(ROOT, "lanzamientos.csv"), "utf-8");
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows`);

  // First, create developers (deduplicate)
  const developerMap = new Map<string, string>(); // name → slug
  const uniqueDevs = new Map<string, { name: string; slug: string }>();

  for (const row of rows) {
    const devName = (row.desarrolladora || "").trim();
    if (devName && !uniqueDevs.has(devName.toLowerCase())) {
      const slug = slugify(devName);
      uniqueDevs.set(devName.toLowerCase(), { name: devName, slug });
      developerMap.set(devName.toLowerCase(), slug);
    }
  }

  console.log(`Found ${uniqueDevs.size} unique developers`);

  // Upsert developers
  const devInserts = Array.from(uniqueDevs.values()).map((d) => ({
    name: d.name,
    slug: d.slug,
  }));

  if (devInserts.length > 0) {
    for (let i = 0; i < devInserts.length; i += 100) {
      const batch = devInserts.slice(i, i + 100);
      const { error } = await supabase
        .from("developers")
        .upsert(batch, { onConflict: "slug" });
      if (error) console.error(`Developer batch ${i} error:`, error.message);
    }
  }

  // Fetch developer IDs
  const { data: devData } = await supabase
    .from("developers")
    .select("id, slug");
  const devIdMap = new Map<string, string>();
  for (const d of devData || []) {
    devIdMap.set(d.slug, d.id);
  }

  // Build developments
  const developments: any[] = [];
  const slugSet = new Set<string>();

  for (const row of rows) {
    const name = (row.nombre_proyecto || "").trim();
    if (!name) continue;

    const city = normalizeCity(row.ciudad || "");
    if (!city) continue;

    let slug = slugify(`${name}-${city}`);
    // Ensure uniqueness
    if (slugSet.has(slug)) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    slugSet.add(slug);

    const devName = (row.desarrolladora || "").trim();
    const devSlug = devName ? slugify(devName) : null;
    const developerId = devSlug ? devIdMap.get(devSlug) : null;

    const state = (row.estado_republica || "").trim() || "Quintana Roo";
    const zone = (row.zona || "").trim() || null;

    developments.push({
      slug,
      name,
      developer_id: developerId,
      city,
      zone,
      state,
      zone_id: guessZoneId(city, zone || undefined),
      plaza: guessPlaza(city),
      development_type: (row.tipo_desarrollo || "").trim() || null,
      property_types: guessPropertyTypes(row.tipo_unidades || ""),
      stage: parseStage(row.etapa || ""),
      price_min_mxn: parsePrice(row.rango_precios || ""),
      total_units: parseUnits(row.num_unidades || ""),
      estimated_delivery: parseDate(row.fecha_entrega_estimada || ""),
      delivery_text: (row.fecha_entrega_estimada || "").trim() || null,
      detection_source: (row.portal_fuente || "").trim() || null,
      source_url: (row.url_fuente || "").trim() || null,
      detected_at: row.fecha_deteccion
        ? `${row.fecha_deteccion}T00:00:00Z`
        : null,
      // Publish QRoo/Yucatan developments for SEO
      published:
        state === "Quintana Roo" ||
        state === "Yucatán" ||
        state === "Yucatan",
      featured: false,
    });
  }

  console.log(`Inserting ${developments.length} developments...`);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < developments.length; i += 50) {
    const batch = developments.slice(i, i + 50);
    const { error, data } = await supabase
      .from("developments")
      .upsert(batch, { onConflict: "slug" });
    if (error) {
      console.error(`Batch ${i} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`✓ Inserted: ${inserted}, Errors: ${errors}`);

  // Log as market signals (new_launch for each)
  const { data: allDevs } = await supabase
    .from("developments")
    .select("id, zone_id, detected_at, detection_source")
    .not("detected_at", "is", null);

  if (allDevs && allDevs.length > 0) {
    const signals = allDevs.map((d: any) => ({
      occurred_at: d.detected_at,
      week_start: d.detected_at
        ? new Date(
            new Date(d.detected_at).getTime() -
              new Date(d.detected_at).getDay() * 86400000
          )
            .toISOString()
            .slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      signal_type: "new_launch",
      zone_id: d.zone_id,
      development_id: d.id,
      source: d.detection_source || "csv_import",
      confidence: 0.9,
    }));

    for (let i = 0; i < signals.length; i += 100) {
      await supabase
        .from("fact_market_signals")
        .insert(signals.slice(i, i + 100));
    }
    console.log(`✓ Logged ${signals.length} market signals`);
  }
}

// ============================================================
// ETL 2: redsearch_marketplace.csv → enrich developments
// ============================================================

async function migrateRedSearch() {
  console.log("\n=== ETL 2: redsearch_marketplace.csv → enrich developments ===");
  const csv = readFileSync(
    resolve(ROOT, "outputs/redsearch_marketplace.csv"),
    "utf-8"
  );
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows`);

  // Fetch existing developments for matching
  const { data: existingDevs } = await supabase
    .from("developments")
    .select("id, slug, name, city");

  const devBySlug = new Map<string, any>();
  for (const d of existingDevs || []) {
    devBySlug.set(d.slug, d);
    // Also index by name-city slug for fuzzy matching
    devBySlug.set(slugify(`${d.name}-${d.city}`), d);
  }

  let enriched = 0;
  let created = 0;

  for (const row of rows) {
    const name = (row.desarrollo || "").trim();
    if (!name) continue;

    const city = normalizeCity(row.ciudad || "");
    const zone = (row.barrio_colonia || "").trim();
    const lookupSlug = slugify(`${name}-${city}`);

    // Try to find existing development
    let existing = devBySlug.get(lookupSlug);

    // Also try just the name part
    if (!existing) {
      const nameSlug = slugify(name);
      for (const [slug, dev] of devBySlug) {
        if (slug.startsWith(nameSlug) && dev.city === city) {
          existing = dev;
          break;
        }
      }
    }

    const enrichment: any = {
      zone: zone || undefined,
      zone_id: guessZoneId(city, zone),
      drive_url: (row.url_drive || "").trim() || null,
      contact_name: (row.contacto || "").trim() || null,
      contact_phone: (row.numero_contacto || "").trim() || null,
      commission_rate: parseCommission(row.comision || ""),
      source_url: (row.url_listing || "").trim() || null,
      total_units: parseUnits(row.unidades_totales || ""),
      available_units: parseUnits(row.unidades_disponibles || ""),
      delivery_text: (row.fecha_entrega || "").trim() || null,
      stage: (row.fecha_entrega || "").toLowerCase().includes("inmediata")
        ? "entrega_inmediata"
        : undefined,
      sales_start_date: parseDate(row.inicio_ventas || ""),
    };

    // Remove undefined values
    Object.keys(enrichment).forEach((k) => {
      if (enrichment[k] === undefined || enrichment[k] === null)
        delete enrichment[k];
    });

    if (existing) {
      // Enrich existing
      const { error } = await supabase
        .from("developments")
        .update(enrichment)
        .eq("id", existing.id);
      if (!error) enriched++;
    } else {
      // Create new
      const slug = slugify(`${name}-${city}`);
      const { error } = await supabase.from("developments").upsert(
        {
          slug,
          name,
          city,
          state: "Quintana Roo",
          plaza: guessPlaza(city),
          detection_source: "TheRedSearch",
          published: true,
          ...enrichment,
        },
        { onConflict: "slug" }
      );
      if (!error) created++;
    }

    // Log detection source
    const devId = existing?.id;
    if (devId) {
      await supabase.from("detection_sources").upsert(
        {
          development_id: devId,
          source_portal: "TheRedSearch",
          source_url: (row.url_listing || "").trim(),
          raw_data: row,
        },
        { onConflict: "development_id,source_portal" }
      );
    }
  }

  console.log(`✓ Enriched: ${enriched}, Created: ${created}`);
}

// ============================================================
// ETL 3: proyectos.csv → enrich developments with Drive links
// ============================================================

async function migrateProyectos() {
  console.log("\n=== ETL 3: proyectos.csv → enrich developments ===");
  const csv = readFileSync(resolve(ROOT, "proyectos.csv"), "utf-8");
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows`);

  let enriched = 0;

  for (const row of rows) {
    const name = (row.nombre_proyecto || "").trim();
    const city = normalizeCity(row.ciudad || "");
    if (!name || !city) continue;

    const slug = slugify(`${name}-${city}`);

    const updates: any = {};
    if (row.url_carpeta_drive) updates.drive_url = row.url_carpeta_drive.trim();
    if (row.total_unidades) updates.total_units = parseUnits(row.total_unidades);
    if (row.inicio_ventas)
      updates.sales_start_date = parseDate(row.inicio_ventas);
    if (row.desarrolladora) {
      // Try to link developer
      const devSlug = slugify(row.desarrolladora.trim());
      const { data } = await supabase
        .from("developers")
        .select("id")
        .eq("slug", devSlug)
        .single();
      if (data) updates.developer_id = data.id;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("developments")
        .update(updates)
        .eq("slug", slug);
      if (!error) enriched++;
    }
  }

  console.log(`✓ Enriched: ${enriched} developments from proyectos.csv`);
}

// ============================================================
// ETL 4: inventario.csv → units
// ============================================================

async function migrateInventario() {
  console.log("\n=== ETL 4: inventario.csv → units ===");
  const csv = readFileSync(resolve(ROOT, "inventario.csv"), "utf-8");
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows`);

  // Group by project, find development IDs
  const projectGroups = new Map<string, any[]>();
  for (const row of rows) {
    const project = (row.proyecto || "").trim();
    if (!project) continue;
    if (!projectGroups.has(project)) projectGroups.set(project, []);
    projectGroups.get(project)!.push(row);
  }

  console.log(`Found ${projectGroups.size} projects in inventario`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (const [projectName, unitRows] of projectGroups) {
    // Find the development in the database
    const searchSlug = slugify(projectName);
    const { data: devs } = await supabase
      .from("developments")
      .select("id, city")
      .ilike("slug", `${searchSlug}%`)
      .limit(1);

    if (!devs || devs.length === 0) {
      console.warn(`  ⚠ Development not found for: "${projectName}"`);
      continue;
    }

    const devId = devs[0].id;

    const units: any[] = [];
    for (const row of unitRows) {
      const unitNumber = (row.unidad || "").trim();
      if (!unitNumber) continue;

      const status = (row.estado || "").toLowerCase();
      let unitStatus: "disponible" | "apartada" | "vendida" | "no_disponible" =
        "disponible";
      if (status.includes("vendid")) unitStatus = "vendida";
      else if (status.includes("apartad") || status.includes("reserv"))
        unitStatus = "apartada";
      else if (status.includes("no_disponible") || status.includes("no disponible"))
        unitStatus = "no_disponible";

      const priceMxn = parsePrice(row.precio_lista_mxn || "");
      const areaM2 = row.superficie_m2
        ? parseFloat(row.superficie_m2.replace(/,/g, ""))
        : null;
      const bedrooms = row.recamaras
        ? parseInt(row.recamaras, 10)
        : null;
      const floor = row.piso ? parseInt(row.piso, 10) : null;
      const hasPool =
        (row.alberca || "").toLowerCase() === "si" ||
        (row.alberca || "").toLowerCase() === "sí" ||
        (row.alberca || "").toLowerCase() === "true";

      const slug = slugify(`${projectName}-${unitNumber}`);

      units.push({
        development_id: devId,
        slug,
        unit_number: unitNumber,
        unit_type: guessUnitType(row.tipologia || row.tipo || ""),
        typology: (row.tipologia || "").trim() || null,
        floor: isNaN(floor!) ? null : floor,
        bedrooms: isNaN(bedrooms!) ? null : bedrooms,
        area_m2: isNaN(areaM2!) ? null : areaM2,
        has_pool: hasPool,
        price_mxn: priceMxn,
        status: unitStatus,
        published: unitStatus === "disponible",
      });
    }

    if (units.length > 0) {
      const { error } = await supabase
        .from("units")
        .upsert(units, { onConflict: "slug" });
      if (error) {
        console.error(`  ✗ ${projectName}: ${error.message}`);
        totalErrors += units.length;
      } else {
        totalInserted += units.length;
        console.log(`  ✓ ${projectName}: ${units.length} units`);
      }
    }
  }

  console.log(`✓ Total units inserted: ${totalInserted}, Errors: ${totalErrors}`);
}

function guessUnitType(
  tipologia: string
): "departamento" | "penthouse" | "casa" | "terreno" | "macrolote" | "studio" {
  const t = tipologia.toLowerCase();
  if (t.includes("penthouse") || t.includes("ph")) return "penthouse";
  if (t.includes("studio") || t.includes("estudio")) return "studio";
  if (t.includes("casa") || t.includes("townhouse") || t.includes("townhome"))
    return "casa";
  if (t.includes("terreno") || t.includes("lote")) return "terreno";
  if (t.includes("macrolote")) return "macrolote";
  return "departamento";
}

// ============================================================
// ETL 5: Seed initial fact_agent_runs log
// ============================================================

async function logMigrationRun() {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

  await supabase.from("fact_agent_runs").insert({
    occurred_at: new Date().toISOString(),
    week_start: weekStart.toISOString().slice(0, 10),
    agent_type: "csv_migration",
    source: "migrate-csvs.ts",
    status: "success",
    records_scanned: 1521, // total CSV rows
    records_new: 0, // will be updated
    records_updated: 0,
    records_failed: 0,
    completeness_score: 0.85,
  });
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("=================================================");
  console.log("Propyte ETL: CSV → Supabase Centralized Schema");
  console.log("=================================================");

  try {
    await migrateLanzamientos();
    await migrateRedSearch();
    await migrateProyectos();
    await migrateInventario();
    await logMigrationRun();

    // Trigger initial inventory snapshot
    console.log("\n=== Triggering initial inventory snapshot ===");
    const { error } = await supabase.rpc("fn_snapshot_inventory_weekly");
    if (error) {
      console.warn("Snapshot error (may need pg_cron):", error.message);
    } else {
      console.log("✓ Initial inventory snapshot created");
    }

    // Refresh materialized views
    console.log("\n=== Refreshing materialized views ===");
    const { error: mvError } = await supabase.rpc(
      "fn_refresh_materialized_views"
    );
    if (mvError) {
      console.warn("MV refresh warning:", mvError.message);
    } else {
      console.log("✓ Materialized views refreshed");
    }

    console.log("\n=================================================");
    console.log("ETL COMPLETE");
    console.log("=================================================");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

main();
