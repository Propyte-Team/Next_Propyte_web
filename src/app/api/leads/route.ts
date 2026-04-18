import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
