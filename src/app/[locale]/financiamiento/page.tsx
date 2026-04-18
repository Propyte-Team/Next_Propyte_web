import Link from 'next/link';
import { Landmark, Banknote, Building2, ArrowLeftRight, ArrowRight, CheckCircle } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'Financing Options | Propyte' : 'Opciones de Financiamiento | Propyte',
    description: isEn
      ? 'Compare financing options for buying property in Mexico: mortgages, cash payment, developer financing, and bridge loans.'
      : 'Compara opciones de financiamiento para comprar propiedad en México: hipotecario, contado, financiamiento del desarrollador y crédito puente.',
    alternates: {
      canonical: `/${locale}/financiamiento`,
      languages: { es: '/es/financiamiento', en: '/en/financiamiento', 'x-default': '/es/financiamiento' },
    },
  };
}

const methodsEs = [
  {
    icon: Landmark,
    title: 'Crédito Hipotecario',
    desc: 'Financiamiento bancario tradicional con tasas desde 9.5% anual. Requiere enganche del 10-20%, comprobación de ingresos y buen historial crediticio. Plazos de 10 a 20 años.',
    downPayment: '10-20%',
    rate: '9.5-12%',
    term: '10-20 años',
    pros: ['Plazos largos', 'Tasas competitivas', 'Deducible de impuestos'],
    idealFor: 'Compradores con ingreso comprobable y buen Buró de Crédito',
  },
  {
    icon: Banknote,
    title: 'Pago de Contado',
    desc: 'Pago total al momento de la compra. Elimina intereses y trámites bancarios. Muchos desarrolladores ofrecen descuentos del 5-15% por pago de contado.',
    downPayment: '100%',
    rate: '0%',
    term: 'Inmediato',
    pros: ['Descuento 5-15%', 'Sin intereses', 'Proceso rápido'],
    idealFor: 'Inversionistas con capital disponible que buscan el mejor precio',
  },
  {
    icon: Building2,
    title: 'Financiamiento del Desarrollador',
    desc: 'Planes de pago directos con el desarrollador, típicamente durante la etapa de construcción. Enganche del 20-30% y mensualidades a 0% de interés hasta la entrega.',
    downPayment: '20-30%',
    rate: '0%',
    term: '6-36 meses',
    pros: ['0% interés', 'Sin banco', 'Flexible'],
    idealFor: 'Compras en preventa con capacidad de pago mensual',
  },
  {
    icon: ArrowLeftRight,
    title: 'Crédito Puente',
    desc: 'Financiamiento temporal que te permite comprar una nueva propiedad antes de vender la actual. Plazos cortos de 6-12 meses con tasas más altas.',
    downPayment: '20-30%',
    rate: '12-18%',
    term: '6-12 meses',
    pros: ['No esperas a vender', 'Acceso rápido', 'Temporal'],
    idealFor: 'Quienes quieren comprar antes de vender otra propiedad',
  },
];

const methodsEn = [
  {
    icon: Landmark,
    title: 'Mortgage (Crédito Hipotecario)',
    desc: 'Traditional bank financing with rates from 9.5% annually. Requires 10-20% down payment, income verification, and good credit history. Terms of 10 to 20 years.',
    downPayment: '10-20%',
    rate: '9.5-12%',
    term: '10-20 years',
    pros: ['Long terms', 'Competitive rates', 'Tax deductible'],
    idealFor: 'Buyers with verifiable income and good credit score',
  },
  {
    icon: Banknote,
    title: 'Cash Payment',
    desc: 'Full payment at time of purchase. Eliminates interest and bank paperwork. Many developers offer 5-15% discounts for cash payment.',
    downPayment: '100%',
    rate: '0%',
    term: 'Immediate',
    pros: ['5-15% discount', 'No interest', 'Fast process'],
    idealFor: 'Investors with available capital seeking the best price',
  },
  {
    icon: Building2,
    title: 'Developer Financing',
    desc: 'Direct payment plans with the developer, typically during construction phase. 20-30% down payment and monthly installments at 0% interest until delivery.',
    downPayment: '20-30%',
    rate: '0%',
    term: '6-36 months',
    pros: ['0% interest', 'No bank needed', 'Flexible'],
    idealFor: 'Pre-sale purchases with monthly payment capacity',
  },
  {
    icon: ArrowLeftRight,
    title: 'Bridge Loan',
    desc: 'Temporary financing that allows you to buy a new property before selling your current one. Short terms of 6-12 months with higher rates.',
    downPayment: '20-30%',
    rate: '12-18%',
    term: '6-12 months',
    pros: ['Don\'t wait to sell', 'Quick access', 'Temporary'],
    idealFor: 'Those who want to buy before selling another property',
  },
];

export default async function FinanciamientoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const methods = isEn ? methodsEn : methodsEs;

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A2F3F] py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'Financing Options' : 'Opciones de Financiamiento'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {isEn
              ? 'Compare the best ways to finance your real estate investment in Mexico.'
              : 'Compara las mejores formas de financiar tu inversión inmobiliaria en México.'}
          </p>
        </div>
      </section>

      {/* 4 Methods */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {methods.map((m) => (
              <div key={m.title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <m.icon size={24} className="text-[#5CE0D2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1A2F3F]">{m.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{m.desc}</p>

                <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">{isEn ? 'Down Payment' : 'Enganche'}</div>
                    <div className="text-sm font-bold text-gray-900">{m.downPayment}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">{isEn ? 'Rate' : 'Tasa'}</div>
                    <div className="text-sm font-bold text-gray-900">{m.rate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">{isEn ? 'Term' : 'Plazo'}</div>
                    <div className="text-sm font-bold text-gray-900">{m.term}</div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {m.pros.map((pro) => (
                    <div key={pro} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-[#22C55E] flex-shrink-0" />
                      <span className="text-gray-600">{pro}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span className="font-semibold">{isEn ? 'Ideal for:' : 'Ideal para:'}</span> {m.idealFor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8 text-center">
            {isEn ? 'Quick Comparison' : 'Comparativa Rápida'}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">{isEn ? 'Method' : 'Método'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Down Payment' : 'Enganche'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Rate' : 'Tasa'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Term' : 'Plazo'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Speed' : 'Rapidez'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {methods.map((m) => (
                  <tr key={m.title} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{m.title}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{m.downPayment}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#5CE0D2]">{m.rate}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{m.term}</td>
                    <td className="px-4 py-3 text-center">
                      {m.rate === '0%' ? '⚡' : m.term === 'Immediate' || m.term === 'Inmediato' ? '⚡⚡' : '🕐'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isEn ? 'Need Personalized Advice?' : '¿Necesitas Asesoría Personalizada?'}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">
            {isEn
              ? 'Our advisors can help you find the best financing option for your specific situation.'
              : 'Nuestros asesores pueden ayudarte a encontrar la mejor opción de financiamiento para tu situación específica.'}
          </p>
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-xl transition-colors"
          >
            {isEn ? 'Contact an Advisor' : 'Contactar un Asesor'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
