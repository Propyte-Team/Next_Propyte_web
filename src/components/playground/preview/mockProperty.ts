/**
 * Mock Property para previews del playground — sin dependencia de Supabase.
 * Usa imágenes Unsplash libres para evitar remote patterns issues.
 */

import type { Property } from '@/types/property';

export const MOCK_PROPERTY: Property = {
  id: 'mock-001',
  slug: 'eternity-jol-preview',
  name: 'Eternity Jol Preview',
  developer: 'Propyte Dev',
  location: {
    city: 'Playa del Carmen',
    zone: 'Centro',
    state: 'Quintana Roo',
    lat: null,
    lng: null,
    address: 'Av. 10 esq. Calle 38',
  },
  price: { mxn: 4_890_000, currency: 'MXN' },
  specs: {
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    type: 'departamento',
  },
  stage: 'preventa',
  usage: ['residencial', 'vacacional'],
  amenities: ['Alberca', 'Gym', 'Rooftop'],
  images: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=800',
  ],
  roi: { projected: 12, rentalMonthly: 38000, appreciation: 8 },
  financing: { downPaymentMin: 30, months: [60, 120], interestRate: 12 },
  description: { es: 'Descripción demo', en: 'Demo description' },
  badge: 'preventa',
  featured: true,
  createdAt: '2026-04-18T00:00:00Z',
  kind: 'development',
  inventory: { available: 8, total: 24 },
  delivery: { text: 'Q3 2027', progress: 35 },
};
