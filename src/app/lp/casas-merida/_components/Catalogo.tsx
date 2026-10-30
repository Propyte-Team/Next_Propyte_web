'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { BadgeCheck, Bath, Bed, Key, Ruler, Square } from '@/lib/icons';
import { dinero, m2, mxn } from '../../_components/format';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import type { FiltroDef } from '../../_components/v2/filtros';
import { useFiltros } from '../../_components/v2/useFiltros';
import { ESTADO_TEXTO, ubicacionCorta } from '../../_components/v2/util';
import { FORM, HOOK } from '../_copy';

// ============================================================
// El dossier: la casa principal en una sola vista, y debajo lo demás.
//
// Segunda pasada (30-oct-2026): la página abre con un GANCHO, no con el
// precio. Si el desarrollador declara que acepta Infonavit o Fovissste, el
// titular lo dice y los créditos aparecen como chips que filtran y bajan al
// formulario. Es el dato que más decide en este segmento, y es el que casi
// nadie publica de frente.
//
// LOS FILTROS SON UNO SOLO. El estado vive en `useFiltros`: los chips del
// encabezado, los del formulario y la lista comparten la selección por
// evento. El dossier es siempre la primera casa visible; el resto va abajo.
//
// LA PÁGINA ES LA FICHA. Izquierda: la galería, fija al hacer scroll en
// escritorio. Derecha: precio enorme, título, características con icono y
// el formulario en línea, sin panel.
// ============================================================

interface Spec {
  icono: typeof Bed;
  valor: string;
  etiqueta: string;
}

/** Solo lo que el Hub declara. Ningún dato se estima. */
function specs(casa: PropiedadLanding): Spec[] {
  const lista: Spec[] = [];
  if (casa.recamaras) {
    lista.push({ icono: Bed, valor: String(casa.recamaras), etiqueta: casa.recamaras === 1 ? 'recámara' : 'recámaras' });
  }
  if (casa.banos) {
    lista.push({ icono: Bath, valor: String(casa.banos), etiqueta: casa.banos === 1 ? 'baño' : 'baños' });
  }
  if (casa.m2Construidos) lista.push({ icono: Ruler, valor: m2(casa.m2Construidos), etiqueta: 'construidos' });
  if (casa.m2Terreno) lista.push({ icono: Square, valor: m2(casa.m2Terreno), etiqueta: 'de terreno' });
  return lista;
}

function creditosDe(casa: PropiedadLanding): string[] {
  const lista: string[] = [];
  if (casa.creditos.infonavit) lista.push('Acepta Infonavit');
  if (casa.creditos.fovissste) lista.push('Acepta Fovissste');
  if (casa.creditos.hipotecario) lista.push('Acepta crédito bancario');
  return lista;
}

function Creditos({ casa, tamano = 'md' }: { casa: PropiedadLanding; tamano?: 'md' | 'sm' }) {
  const lista = creditosDe(casa);
  if (lista.length === 0) return null;
  return (
    <ul className={`flex flex-wrap ${tamano === 'md' ? 'gap-x-5 gap-y-2' : 'gap-x-4 gap-y-1.5'}`}>
      {lista.map((texto) => (
        <li
          key={texto}
          className={`inline-flex items-center gap-1.5 text-[var(--lpv-accent)] ${
            tamano === 'md' ? 'text-[0.9375rem]' : 'text-[0.875rem]'
          }`}
        >
          <BadgeCheck className={tamano === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden />
          {texto}
        </li>
      ))}
    </ul>
  );
}

function chipHook(activo: boolean) {
  return `inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.9375rem] leading-none transition-colors duration-200 active:translate-y-px ${
    activo
      ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-white'
      : 'border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-fg)]'
  }`;
}

export default function Catalogo({
  casas,
  filtros: defs,
  telefonoWhatsApp,
}: {
  casas: PropiedadLanding[];
  filtros: FiltroDef[];
  telefonoWhatsApp: string;
}) {
  const { seleccion, alternar, limpiar, visibles, activos } = useFiltros(casas, defs);
  const principal = visibles[0] ?? casas[0];
  const otras = visibles.slice(1);
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));
  const [elegida, setElegida] = useState<string | null>(principal?.slug ?? null);

  const irAlFormulario = useCallback(() => {
    document.getElementById('solicitar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const elegir = useCallback(
    (slug: string) => {
      setElegida(slug);
      irAlFormulario();
    },
    [irAlFormulario],
  );

  if (!principal) return null;

  const conCredito = casas.some((c) => c.creditos.infonavit || c.creditos.fovissste);
  const filtroCredito = defs.find((d) => d.id === 'credito');
  const desde = casas[0]?.precio ?? null;
  const enganches = casas.map((c) => c.enganchePct).filter((e): e is number => e !== null && e > 0);
  const enganche = enganches.length > 0 ? Math.min(...enganches) : null;
  const zonas = [...new Set(casas.map(ubicacionCorta))];
  const fotos = principal.imagenes;
  const listaSpecs = specs(principal);

  const apoyo = [
    desde ? (casas.length > 1 ? `Desde ${dinero(desde)}` : dinero(desde)) : null,
    enganche ? `enganche del ${enganche}%` : null,
    zonas.length === 1 ? `en ${zonas[0]}` : zonas.length > 1 ? `en ${zonas.join(' y ')}` : null,
  ]
    .filter((t): t is string => t !== null)
    .join(', ');

  return (
    <>
      {/* ══ EL GANCHO: titular de crédito y cómo quieres pagar ══ */}
      <header className="mx-auto max-w-[96rem] px-5 pb-10 pt-24 sm:px-8 sm:pt-28 lg:pb-14">
        <h1 className="lpm-display max-w-[22ch] text-[clamp(2rem,1.2rem+2.6vw,3.75rem)] text-[var(--lpv-fg)]">
          {conCredito ? HOOK.tituloCredito : HOOK.tituloBase}
        </h1>
        {apoyo && (
          <p className="lpm-display-ligero mt-5 max-w-[40ch] text-[clamp(1.125rem,1rem+0.7vw,1.5rem)] text-[var(--lpv-fg-2)]">
            {apoyo}.
          </p>
        )}

        {filtroCredito && (
          <div className="mt-8">
            <p className="text-[0.9375rem] text-[var(--lpv-fg-3)]">{HOOK.comoPagar}</p>
            <div role="group" aria-label={HOOK.comoPagar} className="mt-3 flex flex-wrap gap-2">
              {filtroCredito.opciones.map((o) => {
                const activo = seleccion.credito === o.valor;
                return (
                  <button
                    key={o.valor}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => {
                      alternar('credito', o.valor);
                      irAlFormulario();
                    }}
                    className={chipHook(activo)}
                  >
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                    {o.etiqueta}
                    {casas.length > 1 && <span className="lpv-cifra opacity-60">{o.total}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ══ EL DOSSIER: galería fija a la izquierda, ficha a la derecha ══ */}
      <section id="hero" className="grid border-t border-[var(--lpv-line)] lg:min-h-[100svh] lg:grid-cols-2">
        <div className="lpm-galeria lg:sticky lg:top-0 lg:h-[100svh]">
          <GaleriaFicha
            key={principal.id}
            imagenes={fotos}
            alt={`${principal.titulo}, ${ubicacionCorta(principal)}`}
            aspecto="h-[60svh] lg:h-[100svh]"
            sizes="(min-width: 1024px) 50vw, 100vw"
            prioridad
            tope={10}
            className="!rounded-none"
          />
        </div>

        <div className="px-5 pb-16 pt-10 sm:px-10 lg:px-14 lg:pb-24 lg:pt-20 xl:px-20">
          <p className="text-[0.9375rem] text-[var(--lpv-fg-2)]">
            Casa en venta · {ubicacionCorta(principal)}
          </p>
          <p className="lpm-display mt-4 whitespace-nowrap text-[clamp(2.25rem,1.2rem+2.6vw,3.75rem)] text-[var(--lpv-fg)]">
            {principal.precio ? dinero(principal.precio) : 'Precio por confirmar'}
          </p>
          <h2 className="lpm-display-ligero mt-4 max-w-[28ch] text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] text-[var(--lpv-fg)]">
            {principal.titulo}
          </h2>

          {listaSpecs.length > 0 && (
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-[var(--lpv-line-2)] pt-7 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {listaSpecs.map((s) => (
                <li key={s.etiqueta}>
                  <s.icono className="h-6 w-6 text-[var(--lpv-fg-3)]" strokeWidth={1.5} aria-hidden />
                  <p className="lpm-display mt-3 text-[1.75rem] text-[var(--lpv-fg)]">{s.valor}</p>
                  <p className="mt-1 text-[0.875rem] text-[var(--lpv-fg-3)]">{s.etiqueta}</p>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-7 border-t border-[var(--lpv-line)]">
            {principal.estacionamientos ? (
              <div className="grid grid-cols-[9rem_1fr] items-baseline gap-4 border-b border-[var(--lpv-line)] py-3">
                <dt className="text-[0.9375rem] text-[var(--lpv-fg-3)]">Estacionamiento</dt>
                <dd className="lpm-display text-[1.125rem] text-[var(--lpv-fg)]">
                  {principal.estacionamientos} {principal.estacionamientos === 1 ? 'auto' : 'autos'}
                </dd>
              </div>
            ) : null}
            {principal.enganchePct ? (
              <div className="grid grid-cols-[9rem_1fr] items-baseline gap-4 border-b border-[var(--lpv-line)] py-3">
                <dt className="text-[0.9375rem] text-[var(--lpv-fg-3)]">Enganche</dt>
                <dd className="lpm-display text-[1.125rem] text-[var(--lpv-fg)]">
                  {principal.enganchePct}%{principal.engancheMxn ? ` · ${mxn(principal.engancheMxn)}` : ''}
                </dd>
              </div>
            ) : null}
            <div className="grid grid-cols-[9rem_1fr] items-baseline gap-4 border-b border-[var(--lpv-line)] py-3">
              <dt className="text-[0.9375rem] text-[var(--lpv-fg-3)]">Estado</dt>
              <dd className="lpm-display inline-flex items-center gap-2 text-[1.125rem] text-[var(--lpv-fg)]">
                <Key className="h-4 w-4 text-[var(--lpv-fg-3)]" aria-hidden />
                {ESTADO_TEXTO[principal.estadoComercial]}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <Creditos casa={principal} />
          </div>

          <div id="solicitar" className="mt-12 scroll-mt-6 lg:mt-14">
            <FormInventario
              source="lp_casas_merida"
              variante="hero"
              copy={FORM}
              opciones={opciones}
              seleccion={elegida}
              onSeleccion={setElegida}
              filtros={defs}
              propiedades={casas}
              telefonoWhatsApp={telefonoWhatsApp}
              className="!p-0"
            />
          </div>
        </div>
      </section>

      {/* ══ MOSAICO: todas las fotos de la casa principal, sin rótulos ══ */}
      {fotos.length > 1 && (
        <section className="lpm-mosaico border-t border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]">
          <div className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 sm:py-24">
            <h2 className="lpm-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] text-[var(--lpv-fg)]">
              Las {fotos.length} fotos
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-1 md:grid-cols-3">
              {fotos.map((src, i) => (
                <figure
                  key={src}
                  className={`relative overflow-hidden bg-[var(--lpv-bg)] ${
                    i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-[4/3]'
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${principal.titulo}, foto ${i + 1}`}
                    fill
                    loading="lazy"
                    sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
                    className="object-cover"
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ OTRAS CASAS, el aviso de filtro vacío, o la línea de comercializadora ══ */}
      {visibles.length === 0 ? (
        <section className="mx-auto max-w-[60rem] px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="lpm-display-ligero text-[clamp(1.375rem,1.1rem+1.4vw,2.25rem)] text-[var(--lpv-fg)]">
            {HOOK.sinCoincidencias}
          </p>
          <button type="button" onClick={limpiar} className="lpm-enlace mt-7 inline-block text-[1.0625rem]">
            {HOOK.quitarFiltros}
          </button>
        </section>
      ) : otras.length > 0 || activos > 0 ? (
        <section className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="lpm-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] text-[var(--lpv-fg)]">
              {otras.length > 0 ? HOOK.otras : HOOK.unaCoincide}
            </h2>
            {activos > 0 && (
              <button type="button" onClick={limpiar} className="lpm-enlace text-[0.9375rem]">
                {HOOK.quitarFiltros}
              </button>
            )}
          </div>
          {otras.length > 0 && (
            <ul className="mt-10 border-t border-[var(--lpv-line-2)]">
              {otras.map((casa) => {
                const lista = specs(casa);
                return (
                  <li key={casa.id} className="grid gap-6 border-b border-[var(--lpv-line)] py-8 lg:grid-cols-12">
                    <figure className="relative aspect-[4/3] bg-[var(--lpv-bg-2)] lg:col-span-4">
                      {casa.imagen && (
                        <Image
                          src={casa.imagen}
                          alt={`${casa.titulo}, ${ubicacionCorta(casa)}`}
                          fill
                          sizes="(min-width: 1024px) 30vw, 100vw"
                          className="object-cover"
                        />
                      )}
                    </figure>
                    <div className="lg:col-span-8">
                      <p className="lpm-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] text-[var(--lpv-fg)]">
                        {casa.precio ? dinero(casa.precio) : 'Precio por confirmar'}
                      </p>
                      <p className="mt-3 text-[1.0625rem] text-[var(--lpv-fg)]">{casa.titulo}</p>
                      <p className="mt-1 text-[0.9375rem] text-[var(--lpv-fg-3)]">{ubicacionCorta(casa)}</p>
                      {lista.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                          {lista.map((s) => (
                            <li key={s.etiqueta} className="inline-flex items-center gap-2 text-[var(--lpv-fg-2)]">
                              <s.icono className="h-5 w-5 text-[var(--lpv-fg-3)]" strokeWidth={1.5} aria-hidden />
                              <span className="lpm-display text-[1.125rem] text-[var(--lpv-fg)]">{s.valor}</span>
                              <span className="text-[0.875rem] text-[var(--lpv-fg-3)]">{s.etiqueta}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3">
                        <Creditos casa={casa} tamano="sm" />
                      </div>
                      <button type="button" onClick={() => elegir(casa.slug)} className="lpm-enlace mt-5 text-[0.9375rem]">
                        {elegida === casa.slug ? 'Elegida' : 'Me interesa'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-[60rem] px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="lpm-display-ligero text-[clamp(1.375rem,1.1rem+1.4vw,2.25rem)] text-[var(--lpv-fg)]">
            {HOOK.otraOpcion}
          </p>
          <a href="#solicitar" className="lpm-enlace mt-7 inline-block text-[1.0625rem]">
            Pedir otra opción
          </a>
        </section>
      )}
    </>
  );
}
