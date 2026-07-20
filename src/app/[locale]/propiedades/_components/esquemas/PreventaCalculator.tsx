'use client';

import { useCallback, useMemo, useState } from 'react';
import { Building2, Landmark, CreditCard } from '@/lib/icons';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';
import CotizacionBloques, { type Bloque3Data } from './CotizacionBloques';
import CorridaCompacta from './CorridaCompacta';
import {
  computeInversionInicial,
  type Nacionalidad,
  type NivelAcabado,
} from '@/lib/inversion-inicial';
import { HIPOTECARIO_CONFIG } from '@/lib/hipotecario';
import {
  computePreventa,
  buildContraentregaSchedule,
  type PreventaConfig,
  type ContraentregaVia,
} from '@/lib/preventa';

interface PreventaCalculatorProps {
  priceOriginal: number;
  discountPct: number;
  price: number;
  config: PreventaConfig | null;
  nacionalidad: Nacionalidad;
  onNacionalidad: (n: Nacionalidad) => void;
  interestRateInterno: number;
  mesesInterno: number;
  m2: number;
  city: string;
  zone: string | null;
  tipoEntrega: string | null;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
  slug: string;
  locale: string;
}

/** Redondea el % mostrado: enteros tal cual, decimales a 2 posiciones (Hub JSONB puede traer valores sin redondear). */
const fmtPct = (p: number) => (Number.isInteger(p) ? `${p}%` : `${p.toFixed(2)}%`);

export default function PreventaCalculator({
  priceOriginal,
  discountPct,
  price,
  config,
  nacionalidad,
  onNacionalidad,
  interestRateInterno,
  mesesInterno,
  m2,
  city,
  zone,
  tipoEntrega,
  mobiliarioNivel,
  decoracionNivel,
  slug,
  locale,
}: PreventaCalculatorProps) {
  const t = useTranslations('esquemas');
  const modeA = config != null;

  const [engIni, setEngIni] = useState(20);
  const [engDif, setEngDif] = useState(0);
  const [engDifMeses, setEngDifMeses] = useState(6);
  const [obra, setObra] = useState(20);
  const [obraMeses, setObraMeses] = useState(24);
  const [viaB, setViaB] = useState<ContraentregaVia>('hipotecario');

  const contraentregaPctB = Math.max(0, 100 - engIni - engDif - obra);

  const effectiveConfig: PreventaConfig = useMemo(
    () =>
      modeA
        ? config!
        : {
            enganche_inicial_pct: engIni,
            enganche_diferido_pct: engDif,
            enganche_diferido_meses: engDifMeses,
            obra_pct: obra,
            obra_meses: obraMeses,
            contraentrega_pct: contraentregaPctB,
            contraentrega_via: viaB,
          },
    [modeA, config, engIni, engDif, engDifMeses, obra, obraMeses, contraentregaPctB, viaB],
  );

  const plan = useMemo(() => computePreventa(price, effectiveConfig), [price, effectiveConfig]);

  const perfil = nacionalidad === 'extranjero' ? 'extranjero' : 'nacional';
  const hipCfg = HIPOTECARIO_CONFIG[perfil];

  const schedule = useMemo(
    () =>
      buildContraentregaSchedule(plan.contraentrega, plan.contraentregaVia, {
        tasaHipotecarioPct: hipCfg.tasaAnualPct,
        mesesHipotecario: hipCfg.meses,
        tasaInternoPct: interestRateInterno,
        mesesInterno: mesesInterno > 0 ? mesesInterno : 60,
      }),
    [plan.contraentrega, plan.contraentregaVia, hipCfg, interestRateInterno, mesesInterno],
  );

  const inversion = useMemo(
    () =>
      computeInversionInicial({
        price,
        engancheMxn: plan.engancheInicial,
        nacionalidad,
        m2,
        city,
        zone,
        tipoEntrega,
        mobiliarioNivel,
        decoracionNivel,
      }),
    [price, plan.engancheInicial, nacionalidad, m2, city, zone, tipoEntrega, mobiliarioNivel, decoracionNivel],
  );

  const bloque3: Bloque3Data = {
    saldo: plan.contraentrega,
    mensualidades: schedule.rows.length,
    interesPct: plan.contraentregaVia === 'interno' ? interestRateInterno : hipCfg.tasaAnualPct,
    mensualidad: schedule.cuota,
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const handlePdf = useCallback(async () => {
    setPdfLoading(true);
    setPdfError(false);
    try {
      const qs = new URLSearchParams({
        slug,
        locale,
        mode: 'preventa',
        perfil: nacionalidad,
        mob: mobiliarioNivel,
        dec: decoracionNivel,
        ei: String(effectiveConfig.enganche_inicial_pct),
        ed: String(effectiveConfig.enganche_diferido_pct),
        edm: String(effectiveConfig.enganche_diferido_meses),
        ob: String(effectiveConfig.obra_pct),
        obm: String(effectiveConfig.obra_meses),
        ce: String(effectiveConfig.contraentrega_pct),
        via: effectiveConfig.contraentrega_via,
      });
      const res = await fetch('/api/generate-cotizacion-pdf?' + qs.toString());
      if (!res.ok) throw new Error('pdf');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-preventa-${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('cotizacion preventa pdf error:', e);
      setPdfError(true);
    } finally {
      setPdfLoading(false);
    }
  }, [slug, locale, nacionalidad, mobiliarioNivel, decoracionNivel, effectiveConfig]);

  const viaFijaLabel =
    plan.contraentregaVia === 'interno' ? t('preventaViaInterno') : t('preventaViaHipotecario');

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <Building2 size={18} className="mt-0.5 text-[#0E7490]" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('preventaTitle')}</h3>
          <p className="text-2xs text-gray-500">{modeA ? t('preventaSubtitleA') : t('preventaSubtitleB')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['nacional', 'extranjero'] as Nacionalidad[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onNacionalidad(n)}
            className={
              'rounded-full border px-3 py-1 text-2xs font-medium transition ' +
              (nacionalidad === n
                ? 'border-propyte-brand bg-propyte-brand text-[#0F1923]'
                : 'border-gray-200 text-gray-700 hover:border-propyte-brand')
            }
          >
            {t(n)}
          </button>
        ))}
      </div>

      {modeA ? (
        <PlanFijo plan={plan} t={t} viaLabel={viaFijaLabel} />
      ) : (
        <PlanAjustable
          engIni={engIni}
          setEngIni={setEngIni}
          engDif={engDif}
          setEngDif={setEngDif}
          engDifMeses={engDifMeses}
          setEngDifMeses={setEngDifMeses}
          obra={obra}
          setObra={setObra}
          obraMeses={obraMeses}
          setObraMeses={setObraMeses}
          via={viaB}
          setVia={setViaB}
          contraentregaPct={contraentregaPctB}
          plan={plan}
          t={t}
        />
      )}

      {!plan.balanceado && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-2xs text-amber-700">
          {t('preventaSumaAviso', { suma: plan.sumaPct })}
        </p>
      )}

      <CotizacionBloques
        precio={priceOriginal}
        descuentoPct={discountPct}
        precioVenta={price}
        inversion={inversion}
        bloque3={bloque3}
      />

      <div className="space-y-2">
        <h4 className="text-2xs font-semibold uppercase tracking-wide text-gray-500">
          {t('preventaCorridaTitle')}
        </h4>
        {hipCfg.avisoCambiario && plan.contraentregaVia === 'hipotecario' && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-2xs text-amber-700">{t('avisoCambiario')}</p>
        )}
        <CorridaCompacta schedule={schedule} currency="MXN" />
      </div>

      <div>
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1923] px-4 py-2 text-2xs font-semibold text-white hover:bg-[#1A2F3F] disabled:opacity-60"
        >
          {pdfLoading ? t('generandoPdf') : t('descargarCotizacion')}
        </button>
        {pdfError && <p className="mt-2 text-2xs text-red-600">{t('pdfError')}</p>}
      </div>
    </div>
  );
}

function PlanFijo({
  plan,
  t,
  viaLabel,
}: {
  plan: ReturnType<typeof computePreventa>;
  t: ReturnType<typeof useTranslations>;
  viaLabel: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <StageCard label={t('preventaEngancheInicial')} monto={plan.engancheInicial} pct={plan.engancheInicialPct} />
      {plan.engancheDiferido > 0 && (
        <StageCard
          label={t('preventaEngancheDiferido')}
          monto={plan.engancheDiferido}
          pct={plan.engancheDiferidoPct}
          nota={t('preventaEngancheDiferidoNota', {
            monto: formatPrice(plan.engancheDiferidoMensual),
            meses: plan.engancheDiferidoMeses,
          })}
        />
      )}
      {plan.obra > 0 && (
        <StageCard
          label={t('preventaObra')}
          monto={plan.obra}
          pct={plan.obraPct}
          nota={t('preventaObraNota', { monto: formatPrice(plan.obraMensual), meses: plan.obraMeses })}
        />
      )}
      <StageCard
        label={t('preventaContraentrega')}
        monto={plan.contraentrega}
        pct={plan.contraentregaPct}
        nota={viaLabel}
      />
    </div>
  );
}

function StageCard({ label, monto, pct, nota }: { label: string; monto: number; pct: number; nota?: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xs text-gray-500">{label}</span>
        <span className="text-2xs font-medium text-gray-400">{fmtPct(pct)}</span>
      </div>
      <div className="text-sm font-semibold text-gray-900">{formatPrice(monto)}</div>
      {nota && <div className="text-2xs text-gray-500">{nota}</div>}
    </div>
  );
}

function PlanAjustable(props: {
  engIni: number;
  setEngIni: (n: number) => void;
  engDif: number;
  setEngDif: (n: number) => void;
  engDifMeses: number;
  setEngDifMeses: (n: number) => void;
  obra: number;
  setObra: (n: number) => void;
  obraMeses: number;
  setObraMeses: (n: number) => void;
  via: ContraentregaVia;
  setVia: (v: ContraentregaVia) => void;
  contraentregaPct: number;
  plan: ReturnType<typeof computePreventa>;
  t: ReturnType<typeof useTranslations>;
}) {
  const { t } = props;
  return (
    <div className="space-y-3 rounded-lg border border-gray-100 p-3">
      <Slider label={t('preventaAjustaEnganche')} value={props.engIni} min={0} max={100} onChange={props.setEngIni} />
      <Slider label={t('preventaAjustaDiferido')} value={props.engDif} min={0} max={100} onChange={props.setEngDif} />
      {props.engDif > 0 && (
        <Slider
          label={t('preventaAjustaDiferidoMeses')}
          value={props.engDifMeses}
          min={1}
          max={36}
          onChange={props.setEngDifMeses}
        />
      )}
      <Slider label={t('preventaAjustaObra')} value={props.obra} min={0} max={100} onChange={props.setObra} />
      {props.obra > 0 && (
        <Slider
          label={t('preventaAjustaObraMeses')}
          value={props.obraMeses}
          min={1}
          max={48}
          onChange={props.setObraMeses}
        />
      )}
      <div className="text-2xs font-medium text-gray-700">
        {t('preventaContraentregaAuto', { pct: props.contraentregaPct })} · {formatPrice(props.plan.contraentrega)}
      </div>
      <div>
        <span className="mb-1 block text-2xs text-gray-500">{t('preventaContraentregaVia')}</span>
        <div className="flex gap-2">
          {(['hipotecario', 'interno'] as ContraentregaVia[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => props.setVia(v)}
              className={
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-2xs font-medium transition ' +
                (props.via === v
                  ? 'border-propyte-brand bg-propyte-brand text-[#0F1923]'
                  : 'border-gray-200 text-gray-700 hover:border-propyte-brand')
              }
            >
              {v === 'interno' ? <CreditCard size={13} /> : <Landmark size={13} />}
              {v === 'interno' ? t('preventaViaInterno') : t('preventaViaHipotecario')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-2xs text-gray-500">{label}</span>
        <span className="text-2xs font-semibold text-gray-900">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-propyte-brand"
      />
    </label>
  );
}
