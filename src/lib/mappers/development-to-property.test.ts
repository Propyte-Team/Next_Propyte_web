import { describe, it, expect } from 'vitest';
import { mapDevelopmentToProperty, resolveSpecType, type DevelopmentRow } from './development-to-property';

/**
 * Row mínima: solo los campos que `mapDevelopmentToProperty` necesita para no
 * explotar (buildRichContent, price, etc. toleran ausencia/null). El index
 * signature de `DevelopmentRow` no vuelve opcionales a los campos nombrados,
 * así que casteamos igual que `useFilters.test.ts` hace con `Property`.
 */
function baseRow(overrides: Partial<DevelopmentRow> = {}): DevelopmentRow {
  return {
    id: 'dev-1',
    slug: 'dev-1',
    name: 'Dev 1',
    publication_title: null,
    city: null,
    zone: null,
    neighborhood: null,
    state: null,
    country: null,
    municipality: null,
    lat: null,
    lng: null,
    address: null,
    zip_code: null,
    maps_url: null,
    beach_distance: null,
    airport_name: null,
    airport_distance: null,
    price_min_mxn: 1_000_000,
    price_max_mxn: null,
    currency: 'MXN',
    stage: 'preventa',
    development_type: null,
    property_types: null,
    usage: null,
    amenities: null,
    badge: null,
    featured: false,
    plaza: null,
    images: null,
    virtual_tour_url: null,
    video_url: null,
    brochure_url: null,
    masterplan: null,
    price_list_url: null,
    drive_url: null,
    total_units: null,
    available_units: null,
    reserved_units: null,
    sold_units: null,
    estimated_delivery: null,
    delivery_text: null,
    construction_progress: null,
    roi_projected: null,
    roi_rental_monthly: null,
    roi_appreciation: null,
    financing_down_payment: null,
    financing_months: null,
    financing_interest: null,
    description_es: null,
    description_en: null,
    created_at: null,
    updated_at: null,
    approved_at: null,
    zoho_pipeline_status: null,
    developer_id: null,
    developer_name: null,
    developer_slug: null,
    ...overrides,
  } as unknown as DevelopmentRow;
}

describe('mapDevelopmentToProperty — unitTypes', () => {
  it('el override manual (property_types) gana sobre el inventario cargado', () => {
    // Caso real 2026-08-20: be171d56-df41-48d4-9bdb-d70bf6f62b00 trae
    // ext_property_types=['Departamento','Casa','Villa'] pero solo tiene
    // unidades de Departamento cargadas. La faceta server-side (que lee la
    // vista) cuenta 5 casas y 2 villas; el chip del cliente antes solo
    // contaba lo que había en v_units y perdía Casa y Villa por completo.
    const row = baseRow({
      property_types: ['Departamento', 'Casa', 'Villa'],
      // Simula lo que attachDevelopmentUnitAggregates habría escrito si el
      // mapper todavía lo leyera: inventario mucho más angosto que el
      // override. El mapper YA NO debe leer este campo.
      unit_types: ['departamento'],
    } as Partial<DevelopmentRow> & { unit_types?: string[] });

    const property = mapDevelopmentToProperty(row);

    expect(property.unitTypes).toEqual(['departamento', 'casa', 'villa']);
  });

  it('el otro desarrollo del defecto: override de lotes/casa/comercial sobre inventario solo-lote', () => {
    // e539ee7c-4a7e-4b0b-b26c-2bc73260593a: override ['Lote','Casa','Lote
    // comercial'], unidades cargadas solo de tipo Lote.
    const row = baseRow({
      property_types: ['Lote', 'Casa', 'Lote comercial'],
      unit_types: ['terreno'],
    } as Partial<DevelopmentRow> & { unit_types?: string[] });

    const property = mapDevelopmentToProperty(row);

    // Orden de catálogo (PRODUCT_TYPES): departamento, penthouse, casa, villa,
    // terreno, macrolote, comercial.
    expect(property.unitTypes).toEqual(['casa', 'terreno', 'comercial']);
  });

  it('sin property_types resoluble, cae a specType (fallback intacto)', () => {
    const row = baseRow({ property_types: null, development_type: 'lotes' });

    const property = mapDevelopmentToProperty(row);

    expect(resolveSpecType(null, 'lotes')).toBe('terreno');
    expect(property.unitTypes).toEqual(['terreno']);
  });

  it('grafías no catalogadas en property_types no aportan tipo; una sola válida sobrevive', () => {
    const row = baseRow({ property_types: ['Nave industrial', 'Casa'] });

    const property = mapDevelopmentToProperty(row);

    expect(property.unitTypes).toEqual(['casa']);
  });
});
