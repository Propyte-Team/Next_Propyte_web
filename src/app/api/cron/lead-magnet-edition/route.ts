// src/app/api/cron/lead-magnet-edition/route.ts
// Genera la edición mensual del lead magnet (PDF es+en) → Storage + tabla (pending).
// Invocación: cron Hostinger mensual o manual, header x-cron-secret (o Bearer).
// GET para paridad con zoho-retry (los crons de Hostinger hacen GET).
import { NextResponse } from 'next/server';
import { createElement } from 'react';
import { renderToStream } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { verifyCronSecret, verifyCronSecretHeader } from '@/lib/security/cron-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { buildEditionData } from '@/lib/lead-magnet/edition-data';
import { editionStoragePath, uploadEditionPdf, upsertEditionPending } from '@/lib/lead-magnet/editions';
import LeadMagnetPDFDocument from '@/lib/pdf/LeadMagnetPDFDocument';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const LOCALES = ['es', 'en'] as const;
const MAX_PDF_BYTES = 1_572_864; // 1.5MB objetivo del spec

function editionLabel(edition: string, locale: 'es' | 'en'): string {
  const [y, m] = edition.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 15));
  const s = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(request: Request) {
  const authOk =
    verifyCronSecret(request.headers.get('authorization')) ||
    verifyCronSecretHeader(request.headers.get('x-cron-secret'));
  if (!authOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service role client unavailable' }, { status: 503 });
  }

  const data = await buildEditionData(supabase);
  if (data.topUnits.length < 10) {
    // Fail-closed: un "Top 7" rompe la promesa del título. No publicar.
    return NextResponse.json(
      { error: `Pool insuficiente: ${data.topUnits.length}/10 unidades elegibles` },
      { status: 422 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://propyte.com';
  const generatedAtLegible = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long', timeZone: 'America/Cancun',
  }).format(new Date());

  const results: Array<{ locale: string; path: string; bytes: number }> = [];
  for (const locale of LOCALES) {
    const qrCodeDataUrl = await QRCode.toDataURL(`${siteUrl}/${locale}/propiedades`);
    const doc = createElement(LeadMagnetPDFDocument, {
      locale,
      editionLabel: editionLabel(data.edition, locale),
      generatedAt: generatedAtLegible,
      data,
      siteUrl,
      qrCodeDataUrl,
    }) as React.ReactElement<DocumentProps>;

    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: `PDF ${locale} excede 1.5MB (${buffer.length} bytes)` },
        { status: 422 },
      );
    }

    const path = editionStoragePath(data.edition, locale);
    const up = await uploadEditionPdf(supabase, path, buffer);
    if (up.error) {
      return NextResponse.json({ error: `Storage upload ${locale}: ${up.error}` }, { status: 500 });
    }
    const row = await upsertEditionPending(supabase, {
      edition: data.edition, locale, storagePath: path,
      units: data.topUnits.map((u) => ({
        id: u.id, slug: u.slug, development: u.development_name,
        city: u.city, score: u.score, price: u.effectivePrice,
      })),
    });
    if (row.error) {
      return NextResponse.json({ error: `DB upsert ${locale}: ${row.error}` }, { status: 500 });
    }
    results.push({ locale, path, bytes: buffer.length });
  }

  return NextResponse.json({
    ok: true, edition: data.edition, status: 'pending', results,
    note: `Aprobar con: select real_estate_hub.approve_lead_magnet_edition('${data.edition}','es'); (y 'en')`,
  });
}
