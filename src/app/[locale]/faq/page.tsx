'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const categoriesEs = ['Todas', 'Compra', 'Inversión', 'Financiamiento', 'Renta', 'Plataforma'];
const categoriesEn = ['All', 'Buying', 'Investment', 'Financing', 'Rental', 'Platform'];

const faqsEs = [
  { cat: 'Compra', q: '¿Puedo comprar propiedad en México siendo extranjero?', a: 'Sí. Los extranjeros pueden comprar propiedad en México. En zonas restringidas (50 km de la costa, 100 km de fronteras), se requiere un fideicomiso bancario que te otorga los mismos derechos que un propietario mexicano.' },
  { cat: 'Compra', q: '¿Cuánto cuestan los gastos de escrituración?', a: 'Los gastos de escrituración varían por estado: 6-8% del valor de la propiedad en Quintana Roo (Cancún, Tulum, Playa del Carmen) y 5-7% en Yucatán (Mérida). Incluyen impuesto de adquisición, honorarios notariales y derechos de registro.' },
  { cat: 'Compra', q: '¿Cuánto tiempo tarda el proceso de compra?', a: 'El proceso completo toma entre 30-90 días dependiendo del tipo de propiedad y financiamiento. Compras de contado son más rápidas (30-45 días). Con crédito hipotecario puede extenderse a 60-90 días.' },
  { cat: 'Compra', q: '¿Qué es un fideicomiso bancario?', a: 'Es un instrumento legal donde un banco mexicano mantiene la propiedad a nombre del comprador extranjero. Te otorga derechos completos de uso, renta, venta y herencia. Se renueva cada 50 años automáticamente.' },
  { cat: 'Inversión', q: '¿Qué ROI puedo esperar en la Riviera Maya?', a: 'El ROI varía según la estrategia: plusvalía en preventa 20-40% (2-3 años), renta residencial 5-8% anual, y renta vacacional 8-14% anual. Usamos datos reales de AirDNA y comparables del mercado para estimar rendimientos.' },
  { cat: 'Inversión', q: '¿Qué es mejor: renta residencial o vacacional?', a: 'Depende de tu perfil. La renta residencial ofrece ingresos estables con menor esfuerzo de gestión. La vacacional genera más ingresos pero requiere administración activa o un property manager (15-25% de comisión).' },
  { cat: 'Inversión', q: '¿Cómo se calcula el Cap Rate?', a: 'Cap Rate = (Ingreso Neto Anual / Precio de Compra) × 100. Es la tasa de retorno si compras de contado, sin considerar financiamiento. Un Cap Rate de 6-8% se considera bueno para el mercado mexicano.' },
  { cat: 'Financiamiento', q: '¿Puedo obtener un crédito hipotecario como extranjero?', a: 'Algunos bancos mexicanos ofrecen hipotecas a extranjeros con FM2/FM3 (residencia temporal o permanente). Los requisitos suelen ser más estrictos y las tasas ligeramente más altas que para nacionales.' },
  { cat: 'Financiamiento', q: '¿Qué es el financiamiento directo del desarrollador?', a: 'Es un plan de pago donde pagas directamente al desarrollador en mensualidades durante la construcción, típicamente a 0% de interés. Requiere un enganche del 20-30% y el saldo se cubre en 12-36 meses.' },
  { cat: 'Renta', q: '¿Cuánto puedo ganar rentando en Airbnb en Tulum?', a: 'Un departamento de 1 recámara en Tulum puede generar entre $15,000-$30,000 MXN/mes en renta vacacional con ocupación del 60-75%. Un 2 recámaras puede alcanzar $25,000-$50,000 MXN/mes. Usamos datos de AirDNA para estimaciones precisas.' },
  { cat: 'Renta', q: '¿Necesito un administrador de propiedades?', a: 'Para renta vacacional, es altamente recomendable. Un property manager se encarga de check-in/check-out, limpieza, mantenimiento y comunicación con huéspedes. La comisión típica es 15-25% del ingreso bruto.' },
  { cat: 'Plataforma', q: '¿Propyte cobra comisión a los compradores?', a: 'No. Nuestro servicio es gratuito para compradores e inversionistas. Trabajamos con desarrolladores que cubren nuestros honorarios como parte de su estrategia de venta.' },
  { cat: 'Plataforma', q: '¿De dónde salen los datos de mercado?', a: 'Nuestros análisis combinan datos de AirDNA (ocupación, ADR, RevPAR), comparables de renta de portales inmobiliarios, y modelos de machine learning propios. Los datos se actualizan semanalmente.' },
  { cat: 'Plataforma', q: '¿Qué es la búsqueda con IA?', a: 'Es nuestro buscador inteligente que entiende lenguaje natural. Puedes escribir "departamento en Tulum con alberca, menos de 3 millones, bueno para Airbnb" y el sistema filtra automáticamente las mejores opciones.' },
];

const faqsEn = [
  { cat: 'Buying', q: 'Can foreigners buy property in Mexico?', a: 'Yes. Foreigners can buy property in Mexico. In restricted zones (50 km from coast, 100 km from borders), a bank trust (fideicomiso) is required, which grants you the same rights as a Mexican owner.' },
  { cat: 'Buying', q: 'How much are closing costs?', a: 'Closing costs vary by state: 6-8% of property value in Quintana Roo (Cancún, Tulum, Playa del Carmen) and 5-7% in Yucatán (Mérida). This includes acquisition tax, notary fees, and registration fees.' },
  { cat: 'Buying', q: 'How long does the buying process take?', a: 'The complete process takes 30-90 days depending on property type and financing. Cash purchases are faster (30-45 days). With a mortgage it can extend to 60-90 days.' },
  { cat: 'Buying', q: 'What is a fideicomiso (bank trust)?', a: 'A legal instrument where a Mexican bank holds the property on behalf of the foreign buyer. It grants full rights of use, rental, sale, and inheritance. It renews automatically every 50 years.' },
  { cat: 'Investment', q: 'What ROI can I expect in the Riviera Maya?', a: 'ROI varies by strategy: pre-sale appreciation 20-40% (2-3 years), residential rental 5-8% annually, and vacation rental 8-14% annually. We use real AirDNA data and market comparables to estimate returns.' },
  { cat: 'Investment', q: 'Is residential or vacation rental better?', a: 'It depends on your profile. Residential rental offers stable income with less management effort. Vacation rental generates more income but requires active management or a property manager (15-25% commission).' },
  { cat: 'Investment', q: 'How is Cap Rate calculated?', a: 'Cap Rate = (Annual Net Income / Purchase Price) × 100. It\'s the return rate if you buy in cash, without considering financing. A 6-8% Cap Rate is considered good for the Mexican market.' },
  { cat: 'Financing', q: 'Can foreigners get a mortgage in Mexico?', a: 'Some Mexican banks offer mortgages to foreigners with FM2/FM3 (temporary or permanent residence). Requirements tend to be stricter and rates slightly higher than for nationals.' },
  { cat: 'Financing', q: 'What is developer financing?', a: 'A payment plan where you pay the developer directly in monthly installments during construction, typically at 0% interest. Requires a 20-30% down payment with the balance covered in 12-36 months.' },
  { cat: 'Rental', q: 'How much can I earn renting on Airbnb in Tulum?', a: 'A 1-bedroom apartment in Tulum can generate $15,000-$30,000 MXN/month in vacation rental at 60-75% occupancy. A 2-bedroom can reach $25,000-$50,000 MXN/month. We use AirDNA data for precise estimates.' },
  { cat: 'Rental', q: 'Do I need a property manager?', a: 'For vacation rental, it\'s highly recommended. A property manager handles check-in/check-out, cleaning, maintenance, and guest communication. Typical commission is 15-25% of gross income.' },
  { cat: 'Platform', q: 'Does Propyte charge buyers?', a: 'No. Our service is free for buyers and investors. We work with developers who cover our fees as part of their sales strategy.' },
  { cat: 'Platform', q: 'Where does the market data come from?', a: 'Our analyses combine AirDNA data (occupancy, ADR, RevPAR), rental comparables from real estate portals, and proprietary machine learning models. Data is updated weekly.' },
  { cat: 'Platform', q: 'What is AI Search?', a: 'Our smart search engine understands natural language. You can type "apartment in Tulum with pool, under 3 million, good for Airbnb" and the system automatically filters the best options.' },
];

export default function FAQPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const categories = isEn ? categoriesEn : categoriesEs;
  const faqs = isEn ? faqsEn : faqsEs;

  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = activeCategory === categories[0]
    ? faqs
    : faqs.filter(f => f.cat === activeCategory);

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A2F3F] py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            {isEn
              ? 'Everything you need to know about buying, investing, and renting property in Mexico.'
              : 'Todo lo que necesitas saber sobre comprar, invertir y rentar propiedad en México.'}
          </p>
        </div>
      </section>

      {/* Category tabs */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#5CE0D2] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-[#1A2F3F] pr-4">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-500 mb-4">
              {isEn ? 'Still have questions?' : '¿Aún tienes preguntas?'}
            </p>
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-xl transition-colors"
            >
              {isEn ? 'Contact Us' : 'Contáctanos'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
