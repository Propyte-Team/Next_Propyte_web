import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const RentalComparableSchema = z.object({
  source_portal: z.string().min(1),
  source_url: z.string().nullable().optional(),
  source_id: z.string().min(1),
  city: z.string().min(1),
  zone: z.string().nullable().optional(),
  state: z.string().default('Quintana Roo'),
  property_type: z.enum(['departamento', 'penthouse', 'casa', 'terreno', 'macrolote', 'local_comercial', 'townhouse', 'studio']),
  rental_type: z.enum(['residencial', 'vacacional']).default('residencial'),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().int().nullable().optional(),
  area_m2: z.number().nullable().optional(),
  monthly_rent_mxn: z.number().int().positive(),
  is_furnished: z.boolean().nullable().optional(),
  listing_date: z.string().nullable().optional(),
});

const BulkInsertSchema = z.object({
  listings: z.array(RentalComparableSchema).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!process.env.RENTAL_SCRAPER_API_KEY || apiKey !== process.env.RENTAL_SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = BulkInsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Upsert using the unique constraint (source_portal, source_id)
    const { data, error } = await supabase
      .from('rental_comparables')
      .upsert(
        parsed.data.listings.map(listing => ({
          ...listing,
          scraped_at: new Date().toISOString(),
          active: true,
        })),
        { onConflict: 'source_portal,source_id' }
      )
      .select('id');

    if (error) {
      console.error('Rental comparables upsert error:', error);
      return NextResponse.json({ error: 'Failed to upsert listings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
