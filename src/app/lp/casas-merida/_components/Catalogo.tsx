'use client';

import { useCallback, useState, type ReactNode } from 'react';
import Image from 'next/image';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero, m2, mxn } from '../../_components/format';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, specsVivienda, ubicacionCorta } from '../../_components/v2/util';
import { FORM } from '../_copy';

// ============================================================
// El dossier: la casa principal en una sola vista, y debajo lo demás.
//
// Es un componente de cliente porque el formulario y la lista de «otras
// casas» comparten la casa elegida; el mosaico de fotos (servidor) entra por
// `children` y se pinta entre el dossier y esa lista.
//
// LA PÁGINA ES LA FICHA. Izquierda: la galería, fija al hacer scroll en
// escritorio. Derecha: precio enorme, título, datos en filas con filete y el
// formulario en línea, sin panel. Nada de tarjetas ni de etiquetas en
// mayúsculas: el dossier impreso que te daría un asesor, hecho página.
// ============================================================

function filasDato(casa: PropiedadLanding): [string, string][] {
  const filas: [string, string][] = [];
  if (casa.recamaras) filas.push(['Recámaras', String(casa.recamaras)]);
  if (casa.banos) filas.push(['Baños', String(casa.banos)]);
  if (casa.m2Construidos) filas.push(['Construcción', m2(casa.m2Construidos)]);
  if (casa.m2Terreno) filas.push(['Terreno', m2(casa.m2Terreno)]);
  if (casa.estacionamientos) {
    filas.push(['Estacionamiento', `${casa.estacionamientos} ${casa.estacionamientos === 1 ? 'auto' : 'autos'}`]);
  }
  if (casa.enganchePct) {
    filas.push(['Enganche', `${casa.enganchePct}%${casa.engancheMxn ? ` · ${mxn(casa.engancheMxn)}` : ''}`]);
  }
  filas.push(['Estado', ESTADO_TEXTO[casa.estadoComercial]]);
  return filas;
}

export default function Catalogo({
  casas,
  telefonoWhatsApp,
  children,
}: {
  casas: PropiedadLanding[];
  telefonoWhatsApp: string;
  /** El mosaico de fotos, renderizado en el servidor. */
  children?: ReactNode;
}) {
  const principal = casas[0];
  const otras = casas.slice(1);
  const opciones = casas.map((c) => ({ slug: c.slug, titulo: c.titulo }));
  const [elegida, setElegida] = useState<string | null>(principal?.slug ?? null);

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    document.getElementById('solicitar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!principal) return null;

  const filas = filasDato(principal);

  return (
    <>
      {/* ══ EL DOSSIER: galería fija a la izquierda, ficha a la derecha ══ */}
      <section id="hero" className="grid lg:min-h-[100svh] lg:grid-cols-2">
        <div className="lpm-galeria lg:sticky lg:top-0 lg:h-[100svh]">
          <GaleriaFicha
            imagenes={principal.imagenes}
            alt={`${principal.titulo}, ${ubicacionCorta(principal)}`}
            aspecto="h-[60svh] lg:h-[100svh]"
            sizes="(min-width: 1024px) 50vw, 100vw"
            prioridad
            tope={10}
            className="!rounded-none"
          />
        </div>

        <div className="px-5 pb-16 pt-10 sm:px-10 lg:px-14 lg:pb-24 lg:pt-28 xl:px-20">
          <p className="text-[0.9375rem] text-[var(--lpv-fg-2)]">
            Casa en venta · {ubicacionCorta(principal)}
          </p>
          <h1 className="lpm-display mt-4 whitespace-nowrap text-[clamp(2.25rem,1.2rem+2.6vw,3.75rem)] text-[var(--lpv-fg)]">
            {principal.precio ? dinero(principal.precio) : 'Precio por confirmar'}
          </h1>
          <p className="lpm-display-ligero mt-4 max-w-[28ch] text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] text-[var(--lpv-fg)]">
            {principal.titulo}
          </p>

          <dl className="mt-8 border-t border-[var(--lpv-line-2)]">
            {filas.map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[9rem_1fr] items-baseline gap-4 border-b border-[var(--lpv-line)] py-3"
              >
                <dt className="text-[0.9375rem] text-[var(--lpv-fg-3)]">{k}</dt>
                <dd className="lpm-display text-[1.125rem] text-[var(--lpv-fg)]">{v}</dd>
              </div>
            ))}
          </dl>

          <div id="solicitar" className="mt-12 scroll-mt-6 lg:mt-14">
            <FormInventario
              source="lp_casas_merida"
              variante="hero"
              copy={FORM}
              opciones={opciones}
              seleccion={elegida}
              onSeleccion={setElegida}
              telefonoWhatsApp={telefonoWhatsApp}
              className="!p-0"
            />
          </div>
        </div>
      </section>

      {children}

      {/* ══ OTRAS CASAS, o la línea de comercializadora ══ */}
      {otras.length > 0 ? (
        <section className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="lpm-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] text-[var(--lpv-fg)]">
            Otras casas en Mérida
          </h2>
          <ul className="mt-10 border-t border-[var(--lpv-line-2)]">
            {otras.map((casa) => {
              const detalle = specsVivienda(casa);
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
                    {detalle.length > 0 && (
                      <p className="mt-3 text-[0.9375rem] text-[var(--lpv-fg-2)]">{detalle.join(' · ')}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => elegir(casa.slug)}
                      className="lpm-enlace mt-5 text-[0.9375rem]"
                    >
                      {elegida === casa.slug ? 'Elegida' : 'Me interesa'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="mx-auto max-w-[60rem] px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="lpm-display-ligero text-[clamp(1.375rem,1.1rem+1.4vw,2.25rem)] text-[var(--lpv-fg)]">
            Si esta casa no encaja con tu presupuesto o tu zona, dínoslo: somos comercializadora,
            no desarrolladora, y te buscamos otra en Mérida.
          </p>
          <a href="#solicitar" className="lpm-enlace mt-7 inline-block text-[1.0625rem]">
            Pedir otra opción
          </a>
        </section>
      )}
    </>
  );
}
