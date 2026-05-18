import type { BrokerCommissionRow } from '@/lib/supabase/queries';

interface BrokerCommissionsTableProps {
  commissions: BrokerCommissionRow[];
  locale: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

const PROPERTY_TYPE_LABELS_ES: Record<string, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  terreno: 'Terreno',
};
const PROPERTY_TYPE_LABELS_EN: Record<string, string> = {
  residencial: 'Residential',
  comercial: 'Commercial',
  terreno: 'Land',
};

const STAGE_LABELS_ES: Record<string, string> = {
  preventa: 'Preventa',
  inmediata: 'Entrega inmediata',
  usada: 'Usada',
};
const STAGE_LABELS_EN: Record<string, string> = {
  preventa: 'Pre-sale',
  inmediata: 'Move-in ready',
  usada: 'Resale',
};

/**
 * Tabla de comisiones para corredores (server component).
 *
 * Hide-when-empty: si `commissions.length === 0`, retorna `null`.
 * Source of truth: hub.propyte.com/comisiones. Layout: tabla simple
 * property_type x stage x % con notas opcionales (multilingual).
 */
export default function BrokerCommissionsTable({
  commissions,
  locale,
  title,
  subtitle,
  className,
}: BrokerCommissionsTableProps) {
  if (!commissions || commissions.length === 0) return null;

  const isEs = locale === 'es';
  const propertyLabels = isEs ? PROPERTY_TYPE_LABELS_ES : PROPERTY_TYPE_LABELS_EN;
  const stageLabels = isEs ? STAGE_LABELS_ES : STAGE_LABELS_EN;

  return (
    <section className={`py-16 md:py-20 bg-[#F4F6F8] ${className ?? ''}`}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {(title || subtitle) && (
          <div className="text-center mb-8 md:mb-10">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A2F3F] mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base text-gray-600 max-w-xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#1A2F3F] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  {isEs ? 'Tipo' : 'Type'}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {isEs ? 'Etapa' : 'Stage'}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {isEs ? 'Comisión' : 'Commission'}
                </th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => {
                const note = isEs ? c.notes_es : (c.notes_en ?? c.notes_es);
                return (
                  <tr
                    key={c.id}
                    className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A2F3F]">
                      {propertyLabels[c.property_type] ?? c.property_type}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {stageLabels[c.stage] ?? c.stage}
                      {note && (
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-[#0E7490] text-lg">
                      {Number(c.commission_pct).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-center text-gray-600 mt-4 max-w-2xl mx-auto">
          {isEs
            ? 'Comisiones referenciales sobre precio de venta. Sujeto a contrato firmado y políticas vigentes. Negociable según volumen y exclusividad.'
            : 'Reference commissions on sale price. Subject to signed contract and current policies. Negotiable based on volume and exclusivity.'}
        </p>
      </div>
    </section>
  );
}
