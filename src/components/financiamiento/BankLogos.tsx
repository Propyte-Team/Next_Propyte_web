import { getTranslations } from 'next-intl/server';
import { TASAS_UPDATED_AT } from '@/lib/financiamiento/tasas-config';

/**
 * Trustbar de bancos aliados — wordmarks neutros en grayscale + colores
 * de marca discretos. SVG inline para evitar fetches externos. Si se
 * obtienen logos oficiales en el futuro, reemplazar por <Image> a /img/banks/.
 */
export default async function BankLogos({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'financiamiento' });

  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
            {t('banksTitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          <BBVALogo />
          <BanorteLogo />
          <SantanderLogo />
          <HSBCLogo />
          <BanamexLogo />
        </div>
        {/* Cadencia declarada junto a la fecha: un rango de tasa hipotecaria se
            mueve mes a mes, y una fecha sola no dice si el dato sigue vivo. */}
        <p className="text-xs text-gray-600 text-center mt-8">
          {t('banksDisclaimer', { date: TASAS_UPDATED_AT })}{' '}
          <span className="font-semibold">{t('banksCadence')}</span>
        </p>
      </div>
    </section>
  );
}

/* SVG wordmarks — minimal, color-neutral except for brand accent.
   Sized to ~h-7 visual rhythm. aria-label provides accessible name. */

function BBVALogo() {
  return (
    <span aria-label="BBVA" className="text-[#004481] font-extrabold text-2xl tracking-tight">
      BBVA
    </span>
  );
}

function BanorteLogo() {
  return (
    <span aria-label="Banorte" className="text-[#EB0029] font-bold text-xl tracking-wide">
      Banorte
    </span>
  );
}

function SantanderLogo() {
  return (
    <span aria-label="Santander" className="text-[#EC0000] font-bold text-xl">
      Santander
    </span>
  );
}

function HSBCLogo() {
  return (
    <span aria-label="HSBC" className="flex items-center gap-1.5">
      <span className="inline-block w-5 h-5 bg-[#DB0011]" aria-hidden="true" />
      <span className="text-[#DB0011] font-bold text-xl tracking-tight">HSBC</span>
    </span>
  );
}

function BanamexLogo() {
  return (
    <span aria-label="Citibanamex" className="text-[#003366] font-bold text-xl tracking-tight">
      Citibanamex
    </span>
  );
}
