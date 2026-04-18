import Link from 'next/link';
import { TrendingUp, Home, Palmtree, BarChart3, ArrowRight, ShieldCheck, Clock, DollarSign } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'How to Invest in Real Estate in Mexico | Propyte' : 'Cómo Invertir en Bienes Raíces en México | Propyte',
    description: isEn
      ? 'Learn investment strategies for Mexican real estate: capital gains, residential rental, and vacation rental. Understand ROI by construction stage.'
      : 'Aprende estrategias de inversión inmobiliaria en México: plusvalía, renta residencial y renta vacacional. Conoce el ROI por etapa de construcción.',
    alternates: {
      canonical: `/${locale}/como-invertir`,
      languages: { es: '/es/como-invertir', en: '/en/como-invertir', 'x-default': '/es/como-invertir' },
    },
  };
}

const strategiesEs = [
  {
    icon: TrendingUp,
    title: 'Plusvalía (Capital Gains)',
    desc: 'Compra en preventa a precio de lanzamiento y vende al momento de la entrega. El valor se aprecia entre 20-40% durante la construcción en zonas de alta demanda como Tulum y Playa del Carmen.',
    roi: '20-40%',
    horizon: '2-3 años',
    risk: 'Medio',
  },
  {
    icon: Home,
    title: 'Renta Residencial',
    desc: 'Adquiere propiedades en zonas con alta demanda de renta a largo plazo. Ingreso mensual estable con contratos de 6-12 meses. Menor riesgo, menor rendimiento pero flujo constante.',
    roi: '5-8% anual',
    horizon: '5+ años',
    risk: 'Bajo',
  },
  {
    icon: Palmtree,
    title: 'Renta Vacacional (Airbnb)',
    desc: 'Maximiza ingresos con renta a corto plazo en destinos turísticos. Mayor rendimiento pero requiere administración activa o un property manager. Ocupación promedio 60-75% en Riviera Maya.',
    roi: '8-14% anual',
    horizon: '3+ años',
    risk: 'Medio-Alto',
  },
];

const strategiesEn = [
  {
    icon: TrendingUp,
    title: 'Capital Gains (Appreciation)',
    desc: 'Buy at pre-sale launch price and sell at delivery. Property value appreciates 20-40% during construction in high-demand zones like Tulum and Playa del Carmen.',
    roi: '20-40%',
    horizon: '2-3 years',
    risk: 'Medium',
  },
  {
    icon: Home,
    title: 'Residential Rental',
    desc: 'Acquire properties in areas with high long-term rental demand. Stable monthly income with 6-12 month contracts. Lower risk, lower returns but consistent cash flow.',
    roi: '5-8% annual',
    horizon: '5+ years',
    risk: 'Low',
  },
  {
    icon: Palmtree,
    title: 'Vacation Rental (Airbnb)',
    desc: 'Maximize income with short-term rentals in tourist destinations. Higher returns but requires active management or a property manager. Average 60-75% occupancy in Riviera Maya.',
    roi: '8-14% annual',
    horizon: '3+ years',
    risk: 'Medium-High',
  },
];

const roiByStage = [
  { stage: 'Preventa / Pre-sale', discount: '20-40%', risk: '⬆️', delivery: '24-36 meses', ideal: { es: 'Inversionistas con horizonte largo', en: 'Long-horizon investors' } },
  { stage: 'Construcción / Under Construction', discount: '10-20%', risk: '➡️', delivery: '12-24 meses', ideal: { es: 'Balance riesgo-retorno', en: 'Risk-return balance' } },
  { stage: 'Entrega Inmediata / Ready to Move', discount: '0-5%', risk: '⬇️', delivery: 'Inmediato', ideal: { es: 'Renta inmediata, bajo riesgo', en: 'Immediate rental, low risk' } },
];

export default async function ComoInvertirPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const strategies = isEn ? strategiesEn : strategiesEs;

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A2F3F] py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'How to Invest in Real Estate' : 'Cómo Invertir en Bienes Raíces'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {isEn
              ? 'Three proven strategies to build wealth through Mexican real estate investment.'
              : 'Tres estrategias probadas para construir patrimonio a través de inversión inmobiliaria en México.'}
          </p>
        </div>
      </section>

      {/* 3 Strategies */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-10 text-center">
            {isEn ? 'Investment Strategies' : 'Estrategias de Inversión'}
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {strategies.map((s) => (
              <div key={s.title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-4">
                  <s.icon size={24} className="text-[#5CE0D2]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2F3F] mb-3">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{s.desc}</p>
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-400 uppercase">ROI</div>
                    <div className="text-sm font-bold text-[#5CE0D2]">{s.roi}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{isEn ? 'Horizon' : 'Horizonte'}</div>
                    <div className="text-sm font-bold text-gray-700">{s.horizon}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{isEn ? 'Risk' : 'Riesgo'}</div>
                    <div className="text-sm font-bold text-gray-700">{s.risk}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI by Stage Table */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {isEn ? 'ROI by Construction Stage' : 'ROI por Etapa de Construcción'}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">{isEn ? 'Stage' : 'Etapa'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Potential Discount' : 'Descuento Potencial'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Risk' : 'Riesgo'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Delivery' : 'Entrega'}</th>
                  <th className="px-4 py-3">{isEn ? 'Ideal For' : 'Ideal Para'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roiByStage.map((row) => (
                  <tr key={row.stage} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{row.stage}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#5CE0D2]">{row.discount}</td>
                    <td className="px-4 py-3 text-center">{row.risk}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{row.delivery}</td>
                    <td className="px-4 py-3 text-gray-600">{isEn ? row.ideal.en : row.ideal.es}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {isEn ? 'Key Metrics to Evaluate' : 'Métricas Clave para Evaluar'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: 'ROI', desc: isEn ? 'Return on Investment — total return relative to amount invested' : 'Retorno sobre Inversión — rendimiento total relativo al monto invertido' },
              { icon: DollarSign, title: 'Cap Rate', desc: isEn ? 'Capitalization Rate — annual net income / property price' : 'Tasa de Capitalización — ingreso neto anual / precio de la propiedad' },
              { icon: Clock, title: 'IRR', desc: isEn ? 'Internal Rate of Return — annualized return considering time value of money' : 'Tasa Interna de Retorno — rendimiento anualizado considerando el valor del dinero en el tiempo' },
              { icon: ShieldCheck, title: 'Cash-on-Cash', desc: isEn ? 'Annual cash return on actual cash invested (down payment + costs)' : 'Retorno anual en efectivo sobre el dinero realmente invertido (enganche + costos)' },
            ].map((metric) => (
              <div key={metric.title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-[#5CE0D2]/10 rounded-lg flex items-center justify-center mb-3">
                  <metric.icon size={20} className="text-[#5CE0D2]" />
                </div>
                <h3 className="font-bold text-[#1A2F3F] mb-2">{metric.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isEn ? 'Start Analyzing Investments' : 'Comienza a Analizar Inversiones'}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">
            {isEn
              ? 'Use our financial simulator to calculate ROI, Cap Rate, and IRR for any property.'
              : 'Usa nuestro simulador financiero para calcular ROI, Cap Rate e IRR de cualquier propiedad.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/propiedades`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-xl transition-colors"
            >
              {isEn ? 'Explore with Simulator' : 'Explorar con Simulador'}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={`/${locale}/rentas`}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors"
            >
              {isEn ? 'Rental Analytics' : 'Análisis de Rentas'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
