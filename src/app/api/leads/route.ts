import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

// Allow up to 5 lead submissions per IP per minute. Real users need 1-2;
// anything above that is almost certainly a bot or someone fat-fingering
// the submit button. Returns 429 with Retry-After when exceeded.
const LEAD_RATE_LIMIT = { bucket: 'leads', limit: 5, windowMs: 60_000 };

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { name, email, phone, message, propertyId, source, locale, utm_source, utm_medium, utm_campaign } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

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
