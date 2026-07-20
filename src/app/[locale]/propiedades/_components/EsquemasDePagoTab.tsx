'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Building2, Landmark } from '@/lib/icons';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import { computeHipotecario } from '@/lib/hipotecario';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import InversionInicialCalculator from './esquemas/InversionInicialCalculator';
import CotizacionBloques, { type Bloque3Data } from './esquemas/CotizacionBloques';
import HipotecarioCalculator from './esquemas/HipotecarioCalculator';
import PreventaCalculator from './esquemas/PreventaCalculator';
import type { EsquemaPago } from '@/lib/esquemas-pago';
import type { PreventaConfig } from '@/lib/preventa';

interface EsquemasDePagoTabProps {
  price: number;
  priceOriginal: number;
  discountPct: number;
  state: string;
  city: string;
  zone: string | null;
  m2: number;
  tipoEntrega: string | null;
  downPaymentMinPct: number;
  financingMonths: number[];
  interestRateDefault: number;
  // Reservados para el tab "Financiamiento Interno" (Slice 5): rendieren los
  // esquemas del Hub vía CorridaFinanciera. Aún no se consumen en Slice 3.
  esquemas: EsquemaPago[];
  listPrice: number;
  stage: string;
  directo: boolean;
  slug: string;
  locale: string;
  preventa: PreventaConfig | null;
}

export default function EsquemasDePagoTab({
  price, priceOriginal, discountPct, city, zone, m2, tipoEntrega,
  downPaymentMinPct, financingMonths, interestRateDefault, stage, directo, slug, locale, preventa,
}: EsquemasDePagoTabProps) {
  const t = useTranslations('esquemas');
  const [nacionalidad, setNacionalidad] = useState<Nacionalidad>('nacional');
  const [mobiliarioNivel, setMobiliarioNivel] = useState<NivelAcabado>('alto');
  const [decoracionNivel, setDecoracionNivel] = useState<NivelAcabado>('standard');

  const hipotecario = useMemo(
    () => computeHipotecario(price, nacionalidad, downPaymentMinPct),
    [price, nacionalidad, downPaymentMinPct],
  );

  const inversion = useMemo(
    () => computeInversionInicial({
      price, engancheMxn: hipotecario.enganche, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel,
    }),
    [price, hipotecario.enganche, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const bloque3: Bloque3Data = {
    saldo: hipotecario.saldo,
    mensualidades: hipotecario.config.meses,
    interesPct: hipotecario.config.tasaAnualPct,
    mensualidad: Math.round(hipotecario.schedule.cuota),
  };

  const placeholder = (msg: string) => (
    <div className="space-y-4">
      <CotizacionBloques precio={priceOriginal} descuentoPct={discountPct} precioVenta={price} inversion={inversion} bloque3={null} />
      <p className="text-2xs text-gray-500">{msg}</p>
    </div>
  );

  const items: TabItem[] = [];
  if (stage === 'preventa') {
    items.push({
      id: 'preventa',
      label: t('tabPreventa'),
      icon: <Building2 size={16} />,
      panel: (
        <PreventaCalculator
          priceOriginal={priceOriginal}
          discountPct={discountPct}
          price={price}
          config={preventa}
          nacionalidad={nacionalidad}
          onNacionalidad={setNacionalidad}
          interestRateInterno={interestRateDefault}
          mesesInterno={financingMonths[financingMonths.length - 1] ?? 60}
          m2={m2}
          city={city}
          zone={zone}
          tipoEntrega={tipoEntrega}
          mobiliarioNivel={mobiliarioNivel}
          decoracionNivel={decoracionNivel}
          slug={slug}
          locale={locale}
        />
      ),
    });
  }
  if (directo) {
    items.push({ id: 'interno', label: t('tabInterno'), icon: <CreditCard size={16} />, panel: placeholder(t('internoSoon')) });
  }
  items.push({
    id: 'hipotecario',
    label: t('tabHipotecario'),
    icon: <Landmark size={16} />,
    panel: (
      <HipotecarioCalculator
        priceOriginal={priceOriginal}
        discountPct={discountPct}
        price={price}
        inversion={inversion}
        bloque3={bloque3}
        schedule={hipotecario.schedule}
        config={hipotecario.config}
        nacionalidad={nacionalidad}
        onNacionalidad={setNacionalidad}
        slug={slug}
        locale={locale}
        mobiliarioNivel={mobiliarioNivel}
        decoracionNivel={decoracionNivel}
      />
    ),
  });

  return (
    <div className="space-y-6">
      <InversionInicialCalculator
        price={price} priceOriginal={priceOriginal} discountPct={discountPct}
        nacionalidad={nacionalidad} onNacionalidad={setNacionalidad}
        mobiliarioNivel={mobiliarioNivel} onMobiliarioNivel={setMobiliarioNivel}
        decoracionNivel={decoracionNivel} onDecoracionNivel={setDecoracionNivel}
        inversion={inversion}
      />
      <Tabs variant="pill" tablistLabel={t('schemesLabel')} items={items} />
    </div>
  );
}
