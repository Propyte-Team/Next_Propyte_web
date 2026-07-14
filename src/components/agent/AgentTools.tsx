'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { buildPropertySearchUrl, type PropertySearchArgs } from '@/lib/agent/build-search-url';

/**
 * WebMCP — API imperativa.
 *
 * Registra herramientas que un agente de IA en el navegador puede invocar.
 * Hoy solo existe en Chrome bajo origin trial (ver src/types/webmcp.d.ts);
 * en el resto de navegadores `modelContext` es undefined y este componente
 * es un no-op — NO rompe nada.
 *
 * Es puramente client-side (useEffect) → no afecta prerender/ISR.
 * Se monta una vez, en [locale]/layout.tsx.
 */
export default function AgentTools() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // navigator.modelContext deprecado en Chrome 150 → document.modelContext primero.
    const mc =
      (typeof document !== 'undefined' && document.modelContext) ||
      (typeof navigator !== 'undefined' && navigator.modelContext) ||
      null;
    if (!mc) return;

    // AbortController = mecanismo oficial para desregistrar la tool al desmontar.
    const controller = new AbortController();

    try {
      mc.registerTool(
        {
          name: 'buscar_propiedades',
          description:
            'Busca desarrollos e inmuebles en venta y preventa en el catálogo de Propyte ' +
            '(Riviera Maya, Tulum, Cancún, Playa del Carmen, Mérida, CDMX y más). Aplica ' +
            'filtros de ciudad, zona, tipo, rango de precio en MXN, recámaras, etapa de obra ' +
            'y uso, y muestra al usuario la página de resultados con esos filtros.',
          inputSchema: {
            type: 'object',
            properties: {
              search: {
                type: 'string',
                description: 'Texto libre: nombre de desarrollo, desarrolladora, ciudad o zona.',
              },
              city: {
                type: 'string',
                description: 'Ciudad. Ej.: "Tulum", "Cancún", "Playa del Carmen", "Mérida", "Ciudad de México".',
              },
              zone: {
                type: 'string',
                description: 'Zona o colonia dentro de la ciudad. Ej.: "Aldea Zamá", "La Veleta", "Puerto Cancún".',
              },
              type: {
                type: 'string',
                description: 'Tipo de inmueble. Ej.: "departamento", "casa", "villa", "terreno".',
              },
              bedrooms: {
                type: 'number',
                description: 'Número mínimo de recámaras. El valor 4 significa "4 o más".',
              },
              priceMin: { type: 'number', description: 'Precio mínimo en pesos mexicanos (MXN).' },
              priceMax: { type: 'number', description: 'Precio máximo en pesos mexicanos (MXN).' },
              roiMin: {
                type: 'number',
                description: 'Retorno de inversión anual mínimo estimado, en porcentaje (ej.: 8 = 8%).',
              },
              stage: {
                type: 'string',
                enum: ['preventa', 'construccion', 'entrega_inmediata'],
                description: 'Etapa de la obra.',
              },
              usage: {
                type: 'string',
                enum: ['residencial', 'vacacional', 'renta', 'mixto'],
                description: 'Uso previsto del inmueble.',
              },
            },
          },
          execute: (args) => {
            const url = buildPropertySearchUrl(locale, args as PropertySearchArgs);
            router.push(url);
            return `Mostrando los resultados de búsqueda en Propyte con los filtros aplicados (${url}).`;
          },
        },
        { signal: controller.signal }
      );
    } catch (err) {
      // La firma de registerTool aún cambia en el origin trial; si falla,
      // no debe afectar la app.
      // eslint-disable-next-line no-console
      console.warn('[WebMCP] registerTool falló:', err);
    }

    return () => controller.abort();
  }, [router, locale]);

  return null;
}
