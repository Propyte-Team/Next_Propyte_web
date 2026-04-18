'use client';

import { useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import type { TabId } from '@/lib/rental-data/types';

interface MethodologySectionProps {
  activeTab: TabId;
  locale: string;
}

export function MethodologySection({ activeTab, locale }: MethodologySectionProps) {
  const [open, setOpen] = useState(false);
  const isEn = locale === 'en';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-[#F4F6F8] rounded-xl p-7">
        {/* Summary */}
        <div className="flex items-start gap-3 mb-3">
          <Info size={18} className="text-[#1A2F3F] mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[#1A2F3F] mb-1">
              {isEn ? 'Methodology' : 'Metodología'}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {activeTab === 'vacacional'
                ? isEn
                  ? 'The Propyte Index ranks each zone on a 0-100 scale using four weighted factors: Occupancy (30%), Rate Growth (25%), RevPAR (25%), and Competition (20%). Higher scores indicate stronger rental markets for short-term vacation rentals.'
                  : 'El Índice Propyte clasifica cada zona en una escala de 0 a 100 usando cuatro factores ponderados: Ocupación (30%), Crecimiento de tarifa (25%), RevPAR (25%) y Competencia (20%). Puntuaciones más altas indican mercados de renta vacacional más fuertes.'
                : isEn
                  ? 'Our traditional rental analysis aggregates data from 7 real estate sources covering 62+ cities in Mexico. Rents are normalized, filtered for outliers, and segmented by zone, property type, and bedrooms to provide accurate market benchmarks.'
                  : 'Nuestro análisis de renta tradicional agrega datos de 7 fuentes inmobiliarias que cubren 62+ ciudades en México. Las rentas se normalizan, se filtran valores atípicos, y se segmentan por zona, tipo de propiedad y recámaras para proveer benchmarks precisos del mercado.'
              }
            </p>
          </div>
        </div>

        {/* Expandable detail */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#5CE0D2] hover:text-[#0D9488] transition-colors ml-7"
        >
          {isEn ? 'See full methodology' : 'Ver metodología completa'}
          <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>

        {open && (
          <div className="mt-4 ml-7 bg-white rounded-lg border border-gray-200 p-5 text-sm text-gray-600 leading-relaxed space-y-3">
            {activeTab === 'vacacional' ? (
              <>
                <p className="font-semibold text-[#1A2F3F]">
                  {isEn ? 'Propyte Index Formula' : 'Fórmula del Índice Propyte'}
                </p>
                <div className="bg-[#F4F6F8] rounded-lg p-4 font-mono text-xs">
                  Score = (Occupancy × 0.30) + (Rate Growth × 0.25) + (RevPAR × 0.25) + (Competition × 0.20)
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>{isEn ? 'Occupancy (30%)' : 'Ocupación (30%)'}</strong> —{' '}
                    {isEn
                      ? 'Average annual occupancy rate relative to the market median. Zones with sustained high occupancy score better.'
                      : 'Tasa de ocupación promedio anual relativa a la mediana del mercado. Zonas con ocupación alta sostenida puntúan mejor.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Rate Growth (25%)' : 'Crecimiento de tarifa (25%)'}</strong> —{' '}
                    {isEn
                      ? 'Year-over-year ADR (Average Daily Rate) growth. Captures zones with increasing pricing power.'
                      : 'Crecimiento interanual del ADR (Tarifa Diaria Promedio). Captura zonas con poder de fijación de precios creciente.'}
                  </li>
                  <li>
                    <strong>RevPAR (25%)</strong> —{' '}
                    {isEn
                      ? 'Revenue Per Available Room, combining occupancy and rate into a single metric of revenue potential.'
                      : 'Ingreso por Habitación Disponible, combinando ocupación y tarifa en una sola métrica de potencial de ingresos.'}
                  </li>
                  <li>
                    <strong>{isEn ? 'Competition (20%)' : 'Competencia (20%)'}</strong> —{' '}
                    {isEn
                      ? 'Inverse supply saturation score. Fewer active listings relative to demand results in a higher score.'
                      : 'Puntuación inversa de saturación de oferta. Menos listings activos relativos a la demanda resultan en mayor puntuación.'}
                  </li>
                </ul>
                <p className="text-xs text-gray-400">
                  {isEn
                    ? 'Data sourced from AirDNA with monthly updates. Scores are recalculated on the 1st of each month.'
                    : 'Datos provenientes de AirDNA con actualizaciones mensuales. Los scores se recalculan el 1ero de cada mes.'}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[#1A2F3F]">
                  {isEn ? 'Data Sources (7)' : 'Fuentes de datos (7)'}
                </p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>{isEn ? 'Inmuebles24 — Largest Mexican real estate portal' : 'Inmuebles24 — Portal inmobiliario más grande de México'}</li>
                  <li>{isEn ? 'Segundamano — Classified listings marketplace' : 'Segundamano — Marketplace de anuncios clasificados'}</li>
                  <li>{isEn ? 'Propiedades.com — Premium property listings' : 'Propiedades.com — Listados de propiedades premium'}</li>
                  <li>{isEn ? 'Lamudi — Pan-Latin American portal' : 'Lamudi — Portal panamericano'}</li>
                  <li>{isEn ? 'Vivanuncios — OLX-powered marketplace' : 'Vivanuncios — Marketplace impulsado por OLX'}</li>
                  <li>{isEn ? 'EasyBroker — MLS agent network' : 'EasyBroker — Red MLS de agentes'}</li>
                  <li>{isEn ? 'TheRedSearch — Syndicated listing aggregator' : 'TheRedSearch — Agregador de listados sindicados'}</li>
                </ul>
                <p className="font-semibold text-[#1A2F3F] mt-4">
                  {isEn ? 'Processing Pipeline' : 'Proceso de datos'}
                </p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>{isEn ? 'Daily scraping of active rental listings across all sources' : 'Scraping diario de listados de renta activos en todas las fuentes'}</li>
                  <li>{isEn ? 'Zone normalization using canonical zone mapping (150+ zones)' : 'Normalización de zonas usando mapeo canónico (150+ zonas)'}</li>
                  <li>{isEn ? 'Outlier removal: rentals below $5,000 or above $500,000 MXN/month excluded' : 'Eliminación de valores atípicos: rentas por debajo de $5,000 o arriba de $500,000 MXN/mes excluidas'}</li>
                  <li>{isEn ? 'Statistical computation: median, average, percentiles by segment' : 'Cálculo estadístico: mediana, promedio, percentiles por segmento'}</li>
                  <li>{isEn ? 'ML-based rent estimation for each development using comparable matching' : 'Estimación de renta con ML para cada desarrollo usando comparables similares'}</li>
                  <li>{isEn ? 'ROI, IRR, cap rate and cash flow projections computed per property' : 'ROI, TIR, cap rate y proyecciones de flujo calculadas por propiedad'}</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  {isEn
                    ? 'Data is refreshed daily. Financial projections are estimates and do not guarantee returns.'
                    : 'Los datos se actualizan diariamente. Las proyecciones financieras son estimaciones y no garantizan rendimientos.'}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
