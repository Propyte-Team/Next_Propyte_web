import { NextResponse, type NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';
import {
  GlossaryPDFDocument,
  type GlossaryPDFData,
  type GlossaryTerm,
} from '@/lib/pdf/GlossaryPDFDocument';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const TERM_COUNT = 22;
const RL = { bucket: 'glossary-pdf', limit: 5, windowMs: 60_000 };

const isLocale = (s: string | null): s is 'es' | 'en' => s === 'es' || s === 'en';

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, RL);
  if (limited) return limited;

  const url = new URL(req.url);
  const localeParam = url.searchParams.get('locale');
  if (localeParam !== null && !isLocale(localeParam)) {
    return NextResponse.json({ error: 'Invalid locale (expected es|en)' }, { status: 400 });
  }
  const locale: 'es' | 'en' = isLocale(localeParam) ? localeParam : 'es';

  try {
    const tG = await getTranslations({ locale, namespace: 'glosario' });

    const terms: GlossaryTerm[] = Array.from({ length: TERM_COUNT }, (_, i) => {
      const n = i + 1;
      return {
        name: tG(`term${n}Name` as 'term1Name'),
        def: tG(`term${n}Def` as 'term1Def'),
      };
    });

    const generatedAt = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const data: GlossaryPDFData = {
      terms,
      locale,
      generatedAt,
      labels: {
        title: tG('heroTitle'),
        subtitle: tG('heroSubtitle'),
        brand: locale === 'en' ? 'PROPYTE · GLOSSARY' : 'PROPYTE · GLOSARIO',
        generatedOn: generatedAt,
        termsCount: locale === 'en'
          ? `${TERM_COUNT} key real estate & investment terms`
          : `${TERM_COUNT} términos clave de inversión inmobiliaria`,
        disclaimer: locale === 'en'
          ? 'Reference material — not legal or financial advice'
          : 'Material de referencia — no constituye asesoría legal ni financiera',
        cta: locale === 'en' ? 'propyte.com' : 'propyte.com',
        url: 'propyte.com/glosario',
      },
    };

    const doc = createElement(GlossaryPDFDocument, { data }) as unknown as ReactElement<DocumentProps>;
    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const filename = `propyte-glosario-${locale}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('glossary pdf failed:', err);
    return NextResponse.json({ error: 'pdf generation failed' }, { status: 500 });
  }
}
