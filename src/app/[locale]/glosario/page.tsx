import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'Real Estate Glossary | Propyte' : 'Glosario Inmobiliario | Propyte',
    description: isEn
      ? 'Complete glossary of real estate and investment terms. Learn what ROI, Cap Rate, IRR, and more mean.'
      : 'Glosario completo de términos inmobiliarios y de inversión. Aprende qué significan ROI, Cap Rate, IRR y más.',
    alternates: {
      canonical: `/${locale}/glosario`,
      languages: { es: '/es/glosario', en: '/en/glosario', 'x-default': '/es/glosario' },
    },
  };
}

const termsEs = [
  { term: 'ADR (Average Daily Rate)', def: 'Tarifa promedio diaria de renta vacacional. Se calcula dividiendo el ingreso total entre las noches ocupadas.' },
  { term: 'Amenidades', def: 'Instalaciones y servicios compartidos en un desarrollo: alberca, gimnasio, rooftop, seguridad, etc.' },
  { term: 'Cap Rate (Tasa de Capitalización)', def: 'Ingreso neto anual de renta dividido entre el precio de compra. Un Cap Rate de 6-8% es bueno en el mercado mexicano.', link: '/como-invertir' },
  { term: 'Cash-on-Cash Return', def: 'Rendimiento anual en efectivo sobre el dinero realmente invertido (enganche + costos de cierre), sin considerar plusvalía.' },
  { term: 'Crédito Puente', def: 'Financiamiento temporal para comprar una propiedad antes de vender otra. Plazos de 6-12 meses.', link: '/financiamiento' },
  { term: 'DSCR (Debt Service Coverage Ratio)', def: 'Ratio que mide si el ingreso de renta cubre el pago de la hipoteca. DSCR > 1.25 es ideal para calificación bancaria.' },
  { term: 'Enganche', def: 'Pago inicial al comprar una propiedad. En México típicamente es 10-30% del valor según el tipo de financiamiento.', link: '/financiamiento' },
  { term: 'Entrega Inmediata', def: 'Propiedad terminada y lista para habitar o rentar, sin periodo de espera de construcción.' },
  { term: 'Escrituración', def: 'Proceso legal de transferir la propiedad ante notario público. Los costos incluyen impuestos, honorarios notariales y registro.', link: '/como-comprar' },
  { term: 'Fideicomiso Bancario', def: 'Instrumento legal que permite a extranjeros "poseer" propiedad en zonas restringidas de México a través de un banco. Se renueva cada 50 años.' },
  { term: 'IRR (Tasa Interna de Retorno)', def: 'Rendimiento anualizado que considera el valor del dinero en el tiempo. Incluye plusvalía, rentas y costos a lo largo de los años.' },
  { term: 'NOI (Net Operating Income)', def: 'Ingreso neto operativo: renta bruta menos gastos operativos (mantenimiento, administración, seguros). No incluye pago de hipoteca.' },
  { term: 'Ocupación', def: 'Porcentaje de noches que una propiedad vacacional está rentada. En Riviera Maya el promedio es 60-75%.' },
  { term: 'Plusvalía', def: 'Incremento en el valor de una propiedad con el tiempo. En zonas de alta demanda como Tulum puede ser 10-20% anual.' },
  { term: 'Preventa', def: 'Etapa donde se venden unidades antes de comenzar la construcción. Ofrece los mejores precios (20-40% menos que entrega inmediata).' },
  { term: 'Property Manager', def: 'Persona o empresa que administra una propiedad de renta vacacional: check-in/check-out, limpieza, mantenimiento. Comisión típica: 15-25%.' },
  { term: 'RevPAR (Revenue per Available Room)', def: 'Ingreso por noche disponible = ADR × Tasa de Ocupación. Métrica clave para comparar rendimiento entre propiedades o zonas.' },
  { term: 'ROI (Return on Investment)', def: 'Retorno sobre inversión: rendimiento total (renta + plusvalía) relativo al monto invertido, expresado como porcentaje anual.', link: '/como-invertir' },
  { term: 'UF (Unidad de Fomento)', def: 'Unidad monetaria indexada a la inflación usada en Chile para cotizar propiedades. En México se usa el peso (MXN) o dólar (USD).' },
  { term: 'Yield (Rendimiento)', def: 'Ingreso anual de renta como porcentaje del valor de la propiedad. Gross yield = renta bruta, Net yield = después de gastos.' },
  { term: 'Zona Restringida', def: 'Franja de 50 km desde la costa y 100 km desde fronteras de México donde extranjeros requieren fideicomiso para comprar propiedad.' },
];

const termsEn = [
  { term: 'ADR (Average Daily Rate)', def: 'Average vacation rental rate per night. Calculated by dividing total income by occupied nights.' },
  { term: 'Amenities', def: 'Shared facilities and services in a development: pool, gym, rooftop, security, etc.' },
  { term: 'Cap Rate (Capitalization Rate)', def: 'Annual net rental income divided by purchase price. A 6-8% Cap Rate is considered good in the Mexican market.', link: '/como-invertir' },
  { term: 'Cash-on-Cash Return', def: 'Annual cash return on actual cash invested (down payment + closing costs), not considering appreciation.' },
  { term: 'Bridge Loan (Crédito Puente)', def: 'Temporary financing to buy a property before selling another. Terms of 6-12 months.', link: '/financiamiento' },
  { term: 'DSCR (Debt Service Coverage Ratio)', def: 'Ratio measuring whether rental income covers mortgage payment. DSCR > 1.25 is ideal for bank qualification.' },
  { term: 'Down Payment (Enganche)', def: 'Initial payment when buying a property. In Mexico, typically 10-30% of value depending on financing type.', link: '/financiamiento' },
  { term: 'Ready to Move In (Entrega Inmediata)', def: 'Completed property ready to inhabit or rent, with no construction waiting period.' },
  { term: 'Title Transfer (Escrituración)', def: 'Legal process of transferring property before a notary public. Costs include taxes, notary fees, and registration.', link: '/como-comprar' },
  { term: 'Bank Trust (Fideicomiso)', def: 'Legal instrument allowing foreigners to "own" property in restricted zones of Mexico through a bank. Renews every 50 years.' },
  { term: 'IRR (Internal Rate of Return)', def: 'Annualized return considering the time value of money. Includes appreciation, rental income, and costs over time.' },
  { term: 'NOI (Net Operating Income)', def: 'Gross rental income minus operating expenses (maintenance, management, insurance). Does not include mortgage payment.' },
  { term: 'Occupancy Rate', def: 'Percentage of nights a vacation property is rented. In Riviera Maya, the average is 60-75%.' },
  { term: 'Appreciation (Plusvalía)', def: 'Increase in property value over time. In high-demand zones like Tulum, it can be 10-20% annually.' },
  { term: 'Pre-sale (Preventa)', def: 'Stage where units are sold before construction begins. Offers the best prices (20-40% less than ready-to-move-in).' },
  { term: 'Property Manager', def: 'Person or company managing a vacation rental: check-in/check-out, cleaning, maintenance. Typical commission: 15-25%.' },
  { term: 'RevPAR (Revenue per Available Room)', def: 'Revenue per available night = ADR × Occupancy Rate. Key metric for comparing performance between properties or zones.' },
  { term: 'ROI (Return on Investment)', def: 'Total return (rental + appreciation) relative to amount invested, expressed as an annual percentage.', link: '/como-invertir' },
  { term: 'UF (Unidad de Fomento)', def: 'Inflation-indexed monetary unit used in Chile for property pricing. In Mexico, MXN (peso) or USD (dollar) is used.' },
  { term: 'Yield', def: 'Annual rental income as a percentage of property value. Gross yield = gross rent, Net yield = after expenses.' },
  { term: 'Restricted Zone', def: 'Strip of 50 km from the coast and 100 km from Mexico\'s borders where foreigners need a trust (fideicomiso) to buy property.' },
];

export default async function GlosarioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const terms = isEn ? termsEn : termsEs;

  // Group by first letter
  const grouped: Record<string, typeof terms> = {};
  for (const t of terms) {
    const letter = t.term[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(t);
  }
  const letters = Object.keys(grouped).sort();

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A2F3F] py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'Real Estate Glossary' : 'Glosario Inmobiliario'}
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            {isEn
              ? 'Key terms and concepts for real estate investment in Mexico.'
              : 'Términos y conceptos clave para inversión inmobiliaria en México.'}
          </p>
        </div>
      </section>

      {/* Letter navigation */}
      <section className="py-4 border-b bg-white sticky top-16 z-10">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-9 h-9 flex items-center justify-center text-sm font-bold text-[#1A2F3F] bg-gray-100 hover:bg-[#5CE0D2] hover:text-white rounded-lg transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-10">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <h2 className="text-3xl font-bold text-[#5CE0D2] mb-4 border-b border-gray-100 pb-2">{letter}</h2>
                <dl className="space-y-4">
                  {grouped[letter].map((t) => (
                    <div key={t.term} className="bg-white p-4 rounded-xl border border-gray-100">
                      <dt className="font-bold text-[#1A2F3F] mb-1">{t.term}</dt>
                      <dd className="text-sm text-gray-600 leading-relaxed">
                        {t.def}
                        {'link' in t && t.link && (
                          <Link href={`/${locale}${t.link}`} className="ml-2 text-[#5CE0D2] hover:underline text-xs font-semibold">
                            {isEn ? 'Learn more →' : 'Saber más →'}
                          </Link>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
