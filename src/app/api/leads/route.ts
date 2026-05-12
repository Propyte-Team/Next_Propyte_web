import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

// Allow up to 5 lead submissions per IP per minute. Real users need 1-2;
// anything above that is almost certainly a bot or someone fat-fingering
// the submit button. Returns 429 with Retry-After when exceeded.
const LEAD_RATE_LIMIT = { bucket: 'leads', limit: 5, windowMs: 60_000 };

// Length caps protect logs/CRM from oversized payloads. `source` stays free-form
// because callers use 'form', 'glossary_pdf', 'provider_form', etc.
const LeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(254).email().optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  message: z.string().max(5000).optional().nullable().or(z.literal('')),
  propertyId: z.string().max(100).optional().nullable().or(z.literal('')),
  source: z.string().max(60).optional().nullable().or(z.literal('')),
  locale: z.enum(['es', 'en']).optional().nullable().or(z.literal('')),
  utm_source: z.string().max(200).optional().nullable().or(z.literal('')),
  utm_medium: z.string().max(200).optional().nullable().or(z.literal('')),
  utm_campaign: z.string().max(200).optional().nullable().or(z.literal('')),
});

// Origin allowlist; localhost only honored outside production for dev convenience.
const ALLOWED_ORIGINS = new Set([
  'https://propyte.com',
  'https://www.propyte.com',
  'https://dev.propyte.com',
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // same-origin form posts often omit Origin
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (process.env.NODE_ENV !== 'production') {
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get('origin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const limit = rateLimit(request, LEAD_RATE_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSec),
          'X-RateLimit-Limit': String(LEAD_RATE_LIMIT.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
  const { name, email, phone, message, propertyId, source, locale, utm_source, utm_medium, utm_campaign } = parsed.data;

  try {
    // Use service role to bypass RLS for inserting leads
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        property_id: propertyId || null,
        source: source || 'form',
        status: 'nuevo',
        locale: locale || 'es',
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Lead creation error:', error);
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, id: data.id },
      {
        headers: {
          'X-RateLimit-Limit': String(LEAD_RATE_LIMIT.limit),
          'X-RateLimit-Remaining': String(limit.remaining),
        },
      },
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
