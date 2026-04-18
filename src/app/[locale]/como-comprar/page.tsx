import Link from 'next/link';
import { Search, FileText, CreditCard, Home, Key, ClipboardCheck, CheckCircle, ArrowRight } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'How to Buy Property in Mexico | Propyte' : 'Cómo Comprar Propiedad en México | Propyte',
    description: isEn
      ? 'Step-by-step guide to buying property in Mexico. From research to key delivery, learn the complete process.'
      : 'Guía paso a paso para comprar propiedad en México. Desde la investigación hasta la entrega de llaves.',
    alternates: {
      canonical: `/${locale}/como-comprar`,
      languages: { es: '/es/como-comprar', en: '/en/como-comprar', 'x-default': '/es/como-comprar' },
    },
  };
}

const steps = [
  { icon: Search, key: 'research' },
  { icon: CreditCard, key: 'budget' },
  { icon: Home, key: 'visit' },
  { icon: FileText, key: 'contract' },
  { icon: ClipboardCheck, key: 'closing' },
  { icon: Key, key: 'delivery' },
];

const stepsEs = [
  { title: 'Investiga', desc: 'Explora desarrollos por zona, tipo de propiedad y presupuesto. Usa nuestras herramientas de análisis de mercado y búsqueda con IA para encontrar las mejores opciones.' },
  { title: 'Define tu Presupuesto', desc: 'Calcula tu capacidad de compra incluyendo enganche (20-30%), gastos de escrituración (6-8% del valor) y costos de cierre. Consulta opciones de financiamiento.' },
  { title: 'Visita y Elige', desc: 'Agenda visitas a los desarrollos que te interesan. Nuestros asesores te acompañan para evaluar ubicación, amenidades, calidad de construcción y potencial de inversión.' },
  { title: 'Contrato de Promesa', desc: 'Firma el contrato de promesa de compraventa con el desarrollador. Se estipulan precios, plazos, penalidades y condiciones de entrega. Un abogado debe revisarlo.' },
  { title: 'Escrituración', desc: 'El notario público formaliza la compraventa. Se pagan impuestos, derechos de registro y honorarios notariales. Para extranjeros en zona restringida, se constituye un fideicomiso bancario.' },
  { title: 'Entrega de Llaves', desc: 'Inspecciona la propiedad junto con el desarrollador. Verifica acabados, instalaciones y amenidades. Firma el acta de entrega-recepción y recibe tus llaves.' },
];

const stepsEn = [
  { title: 'Research', desc: 'Explore developments by zone, property type, and budget. Use our market analysis tools and AI search to find the best options.' },
  { title: 'Set Your Budget', desc: 'Calculate your purchasing capacity including down payment (20-30%), closing costs (6-8% of value), and additional fees. Review financing options.' },
  { title: 'Visit & Choose', desc: 'Schedule visits to developments you\'re interested in. Our advisors accompany you to evaluate location, amenities, construction quality, and investment potential.' },
  { title: 'Purchase Agreement', desc: 'Sign the purchase promise contract with the developer. It outlines prices, timelines, penalties, and delivery conditions. Have a lawyer review it.' },
  { title: 'Title Transfer', desc: 'The notary public formalizes the sale. Taxes, registration fees, and notary fees are paid. For foreigners in restricted zones, a bank trust (fideicomiso) is established.' },
  { title: 'Key Delivery', desc: 'Inspect the property with the developer. Verify finishes, installations, and amenities. Sign the delivery-acceptance document and receive your keys.' },
];

const documentsEs = [
  'Identificación oficial vigente (INE o pasaporte)',
  'Comprobante de domicilio (no mayor a 3 meses)',
  'RFC y constancia de situación fiscal',
  'Pre-aprobación bancaria (si aplica crédito hipotecario)',
  'Comprobantes de ingresos (últimos 3 meses)',
  'Estado de cuenta bancario (últimos 3 meses)',
];

const documentsEn = [
  'Valid government-issued ID (INE or passport)',
  'Proof of address (no older than 3 months)',
  'Tax ID (RFC) and tax status certificate',
  'Bank pre-approval (if applying for mortgage)',
  'Income statements (last 3 months)',
  'Bank statements (last 3 months)',
];

export default async function ComoComprarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const stepContent = isEn ? stepsEn : stepsEs;
  const documents = isEn ? documentsEn : documentsEs;

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A2F3F] py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'How to Buy Property in Mexico' : 'Cómo Comprar Propiedad en México'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {isEn
              ? 'A complete step-by-step guide to purchasing real estate. From your first search to receiving your keys.'
              : 'Guía completa paso a paso para adquirir un inmueble. Desde tu primera búsqueda hasta recibir tus llaves.'}
          </p>
        </div>
      </section>

      {/* 6-Step Process */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-10 text-center">
            {isEn ? '6 Steps to Your New Property' : '6 Pasos para tu Nueva Propiedad'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.key} className="relative bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#5CE0D2] text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {i + 1}
                  </div>
                  <div>
                    <div className="w-10 h-10 bg-[#5CE0D2]/10 rounded-xl flex items-center justify-center mb-3">
                      <step.icon size={20} className="text-[#5CE0D2]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A2F3F] mb-2">{stepContent[i].title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{stepContent[i].desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents Needed */}
      <section className="py-16 md:py-20 bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-8">
            {isEn ? 'Documents You\'ll Need' : 'Documentos que Necesitas'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                <CheckCircle size={20} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financing Preview */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2F3F] mb-4">
            {isEn ? 'Need Financing?' : '¿Necesitas Financiamiento?'}
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">
            {isEn
              ? 'Explore mortgage options, developer financing, and alternative payment plans.'
              : 'Explora opciones de crédito hipotecario, financiamiento directo del desarrollador y planes de pago alternativos.'}
          </p>
          <Link
            href={`/${locale}/financiamiento`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-xl transition-colors"
          >
            {isEn ? 'View Financing Options' : 'Ver Opciones de Financiamiento'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[#1A2F3F]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isEn ? 'Ready to Start?' : '¿Listo para Comenzar?'}
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">
            {isEn
              ? 'Browse our marketplace or talk to an advisor. No commitments, no pressure.'
              : 'Explora nuestro marketplace o habla con un asesor. Sin compromisos, sin presión.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/propiedades`}
              className="px-8 py-4 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold rounded-xl transition-colors"
            >
              {isEn ? 'Browse Properties' : 'Explorar Propiedades'}
            </Link>
            <Link
              href={`/${locale}/contacto`}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors"
            >
              {isEn ? 'Talk to an Advisor' : 'Hablar con un Asesor'}
            </Link>
          </div>
        </div>
      </section>

      {/* Legal disclaimer */}
      <div className="py-6 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <p className="text-xs text-gray-400 text-center">
            {isEn
              ? 'This guide is for informational purposes only and does not constitute legal or financial advice. Consult a licensed professional for your specific situation. Prices, terms, and availability are subject to change.'
              : 'Esta guía es solo informativa y no constituye asesoría legal ni financiera. Consulta a un profesional para tu situación específica. Precios, plazos y disponibilidad están sujetos a cambios.'}
          </p>
        </div>
      </div>
    </div>
  );
}
