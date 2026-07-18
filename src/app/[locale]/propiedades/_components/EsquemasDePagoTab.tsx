'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Building2, Landmark } from '@/lib/icons';
import { computeInversionInicial, type Nacionalidad, type NivelAcabado } from '@/lib/inversion-inicial';
import Tabs, { type TabItem } from '@/components/ui/Tabs';
import InversionInicialCalculator from './esquemas/InversionInicialCalculator';
import CotizacionBloques from './esquemas/CotizacionBloques';
import CorridaFinanciera from './CorridaFinanciera';
import type { EsquemaPago } from '@/lib/esquemas-pago';

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
  esquemas: EsquemaPago[];
  listPrice: number;
  stage: string;
  directo: boolean;
}

export default function EsquemasDePagoTab({
  price, priceOriginal, discountPct, state, city, zone, m2, tipoEntrega,
  downPaymentMinPct, esquemas, listPrice, stage, directo,
}: EsquemasDePagoTabProps) {
  const t = useTranslations('esquemas');
  const [nacionalidad, setNacionalidad] = useState<Nacionalidad>('nacional');
  const [mobiliarioNivel, setMobiliarioNivel] = useState<NivelAcabado>('alto');
  const [decoracionNivel, setDecoracionNivel] = useState<NivelAcabado>('standard');

  const engancheBase = Math.round(price * (Math.max(downPaymentMinPct || 20, 10) / 100));

  const inversion = useMemo(
    () => computeInversionInicial({
      price, engancheMxn: engancheBase, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel,
    }),
    [price, engancheBase, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const cotizacion = (extra?: React.ReactNode) => (
    <div className="space-y-4">
      <CotizacionBloques precio={priceOriginal} descuentoPct={discountPct} precioVenta={price} inversion={inversion} bloque3={null} />
      {extra}
    </div>
  );

  const items: TabItem[] = [];
  if (stage === 'preventa') {
    items.push({ id: 'preventa', label: t('tabPreventa'), icon: <Building2 size={16} />, panel: cotizacion(<p className="text-2xs text-gray-500">{t('preventaSoon')}</p>) });
  }
  if (directo) {
    items.push({ id: 'interno', label: t('tabInterno'), icon: <CreditCard size={16} />, panel: cotizacion(<p className="text-2xs text-gray-500">{t('internoSoon')}</p>) });
  }
  items.push({
    id: 'hipotecario', label: t('tabHipotecario'), icon: <Landmark size={16} />,
    panel: cotizacion(esquemas.length > 0 ? <CorridaFinanciera listPrice={listPrice} esquemas={esquemas} /> : undefined),
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
