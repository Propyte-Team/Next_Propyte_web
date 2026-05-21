import SchemaMarkup from '@/components/shared/SchemaMarkup';
import { HelpCircle } from '@/lib/icons';

interface UnitFAQsProps {
  locale: string;
  unitName: string;
  city: string;
  price: number;
  downPaymentMin: number;
  /** FAQs editoriales desde Hub (BD). Cuando vienen ≥3 items, sustituyen
   *  el set genérico hardcoded. */
  customFaqs?: Array<{ q: string; a: string }>;
}

export default function UnitFAQs({ locale, unitName, city, price, downPaymentMin, customFaqs }: UnitFAQsProps) {
  const isEn = locale === 'en';
  const formattedDown = downPaymentMin > 0 ? downPaymentMin : 20;

  const fallbackFaqs = isEn
    ? [
        { q: `What is the minimum down payment for ${unitName}?`, a: `The typical down payment for units in ${city} starts at ${formattedDown}% of the sale price. Financing plans are available through Propyte's partner banks and directly with the developer.` },
        { q: 'Can I use this unit as a vacation rental (Airbnb)?', a: `Yes. ${city} is one of Mexico's top short-term rental markets. Units in this development are licensed for vacation rental and typically achieve 65-85% occupancy with market data-backed ADR estimates.` },
        { q: 'What closing costs should I budget?', a: 'Closing costs in Quintana Roo and Yucatán average 6-8% of the sale price and cover notary, title, ISABI tax, and certified appraisal. Propyte includes an itemized estimate in the investment calculator above.' },
        { q: 'Can foreigners buy in Mexico?', a: 'Yes. Non-Mexican buyers purchase coastal property through a fideicomiso (bank trust), which provides full ownership rights. Inland properties are bought directly. Propyte coordinates the entire legal process.' },
        { q: 'What is included in the HOA?', a: 'HOA fees typically cover common amenity maintenance (pool, gym, security, gardens), lobby staff, and 24/7 surveillance. Exact monthly amount is provided in the detailed brochure.' },
        { q: 'Is the projected ROI guaranteed?', a: 'No. ROI projections are estimates based on historical data, market data benchmarks, and comparable rental analysis. Actual returns vary with occupancy, maintenance, and market conditions. Our calculator above lets you adjust assumptions.' },
      ]
    : [
        { q: `¿Cuál es el enganche mínimo para ${unitName}?`, a: `El enganche típico para unidades en ${city} comienza en ${formattedDown}% del precio de venta. Hay planes de financiamiento disponibles a través de bancos aliados de Propyte y directamente con el desarrollador.` },
        { q: '¿Puedo usar esta unidad para renta vacacional (Airbnb)?', a: `Sí. ${city} es uno de los mercados top de renta corta en México. Las unidades de este desarrollo están autorizadas para renta vacacional y típicamente logran ocupación del 65-85% con estimaciones de ADR basadas en datos de mercado.` },
        { q: '¿Qué gastos de escrituración debo presupuestar?', a: 'Los gastos de escrituración en Quintana Roo y Yucatán promedian 6-8% del precio de venta y cubren notaría, título, ISABI y avalúo certificado. Propyte incluye un estimado detallado en la calculadora de inversión arriba.' },
        { q: '¿Pueden los extranjeros comprar en México?', a: 'Sí. Compradores extranjeros adquieren propiedad costera a través de un fideicomiso (trust bancario), el cual otorga derechos plenos de propiedad. Propiedades en tierra firme se compran directamente. Propyte coordina todo el proceso legal.' },
        { q: '¿Qué incluye el mantenimiento mensual?', a: 'El mantenimiento típicamente cubre el cuidado de amenidades comunes (alberca, gym, seguridad, jardines), personal de lobby y vigilancia 24/7. El monto exacto se especifica en el brochure detallado.' },
        { q: '¿El ROI proyectado es garantizado?', a: 'No. Las proyecciones de ROI son estimaciones basadas en datos históricos, benchmarks de mercado y análisis de comparables de renta. Los rendimientos reales varían con la ocupación, mantenimiento y condiciones de mercado. La calculadora arriba te permite ajustar los supuestos.' },
      ];

  const faqs = customFaqs && customFaqs.length >= 3 ? customFaqs : fallbackFaqs;

  return (
    <div>
      <SchemaMarkup
        type="faq"
        data={{
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <h2 className="text-xl font-bold text-[#2C2C2C] mb-4 flex items-center gap-2">
        <HelpCircle size={22} className="text-[#0E7490]" />
        {locale === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
      </h2>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors">
              <span className="text-sm font-semibold text-[#2C2C2C] pr-4">{f.q}</span>
              <span className="text-[#0E7490] text-lg font-bold group-open:rotate-45 transition-transform inline-block shrink-0">+</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
          </details>
        ))}
      </div>
      {price > 0 && (
        <p className="text-2xs text-gray-600 mt-3">
          {isEn
            ? `Have a different question? Our advisors respond in under 5 minutes via WhatsApp.`
            : `¿Tienes otra pregunta? Nuestros asesores responden en menos de 5 minutos por WhatsApp.`}
        </p>
      )}
    </div>
  );
}
