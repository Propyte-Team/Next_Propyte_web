-- ============================================================
-- Propyte CRM — Seed Data
-- Run this after 001_initial_schema.sql to populate sample data
-- ============================================================

-- Developers
insert into public.developers (id, name, slug, city, verified) values
  ('d1000000-0000-0000-0000-000000000001', 'Grupo Nativa', 'grupo-nativa', 'Tulum', true),
  ('d1000000-0000-0000-0000-000000000002', 'Tierras del Mayab', 'tierras-del-mayab', 'Tulum', true),
  ('d1000000-0000-0000-0000-000000000003', 'Inmobiliaria Corazón', 'inmobiliaria-corazon', 'Playa del Carmen', true),
  ('d1000000-0000-0000-0000-000000000004', 'Desarrollos Zamá', 'desarrollos-zama', 'Tulum', false),
  ('d1000000-0000-0000-0000-000000000005', 'Selvática Group', 'selvatica-group', 'Playa del Carmen', true),
  ('d1000000-0000-0000-0000-000000000006', 'Arrecifes Development', 'arrecifes-development', 'Playa del Carmen', true);

-- Properties
insert into public.properties (slug, name, developer_id, city, zone, address, lat, lng, price_mxn, bedrooms, bathrooms, area_m2, property_type, stage, badge, usage, featured, roi_projected, roi_rental_monthly, roi_appreciation, financing_down_payment_min, financing_months, financing_interest_rate, description_es, description_en, amenities, images, virtual_tour_url, video_url) values
(
  'nativa-tulum-tipo-a',
  'Nativa Tulum — Departamento Tipo A',
  'd1000000-0000-0000-0000-000000000001',
  'Tulum', 'Centro', 'Tulum Centro, Quintana Roo', 20.2114, -87.4654,
  2800000, 1, 1, 45, 'departamento', 'preventa', 'preventa',
  '{vacacional,renta}', true,
  12, 18000, 10, 30, '{6,12,18,24}', 0,
  'Departamento de 45 m² en el corazón de Tulum con acabados premium.',
  'A 45 sqm apartment in the heart of Tulum with premium finishes.',
  '{Alberca,Rooftop,"Yoga Deck",Bicicletas,"Seguridad 24/7"}',
  '{https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=450&fit=crop,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=450&fit=crop}',
  'https://my.matterport.com/show/?m=SxQL3iGyvok',
  'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
  'nativa-tulum-tipo-b',
  'Nativa Tulum — Departamento Tipo B',
  'd1000000-0000-0000-0000-000000000001',
  'Tulum', 'Centro', 'Tulum Centro, Quintana Roo', 20.2130, -87.4640,
  4130844, 2, 2, 85, 'departamento', 'preventa', 'preventa',
  '{residencial,vacacional,renta}', true,
  11, 28000, 9, 30, '{6,12,18,24,36}', 0,
  'Departamento de 85 m² con 2 recámaras en desarrollo Nativa Tulum.',
  'An 85 sqm two-bedroom apartment in the Nativa Tulum development.',
  '{Alberca,Rooftop,Gym,Coworking,"Seguridad 24/7"}',
  '{https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=450&fit=crop,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=450&fit=crop}',
  'https://my.matterport.com/show/?m=SxQL3iGyvok',
  'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
  'nativa-tulum-penthouse',
  'Nativa Tulum — Penthouse',
  'd1000000-0000-0000-0000-000000000001',
  'Tulum', 'Centro', 'Tulum Centro, Quintana Roo', 20.2120, -87.4648,
  6500000, 2, 2, 120, 'penthouse', 'preventa', 'preventa',
  '{residencial,vacacional,renta}', true,
  13, 45000, 11, 30, '{6,12,18,24,36}', 0,
  'Penthouse de 120 m² con alberca privada en Nativa Tulum.',
  'A 120 sqm penthouse with a private pool in Nativa Tulum.',
  '{"Alberca privada",Rooftop,Gym,Coworking,Concierge,"Seguridad 24/7"}',
  '{https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=450&fit=crop,https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=450&fit=crop}',
  'https://my.matterport.com/show/?m=SxQL3iGyvok',
  'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
  'corazon-pdc-studio',
  'Desarrollo Corazón PDC — Studio',
  'd1000000-0000-0000-0000-000000000003',
  'Playa del Carmen', '5ta Avenida', '5ta Avenida, Playa del Carmen', 20.6296, -87.0739,
  2200000, 1, 1, 38, 'departamento', 'construccion', 'nuevo',
  '{vacacional,renta}', true,
  10, 15000, 8, 30, '{6,12,18,24}', 0,
  'Studio de 38 m² sobre la 5ta Avenida de Playa del Carmen.',
  'A 38 sqm studio on 5th Avenue in Playa del Carmen.',
  '{Alberca,"Rooftop Bar",Gym,Lobby,"Seguridad 24/7"}',
  '{https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=450&fit=crop,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=450&fit=crop}',
  null,
  'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
  'arrecifes-luxury-penthouse',
  'Arrecifes Luxury — Penthouse',
  'd1000000-0000-0000-0000-000000000006',
  'Playa del Carmen', 'Centro', 'Centro, Playa del Carmen', 20.6250, -87.0720,
  12500000, 3, 3, 180, 'penthouse', 'preventa', 'preventa',
  '{residencial,vacacional,renta}', true,
  10, 65000, 9, 30, '{12,18,24,36}', 0,
  'Penthouse de lujo de 180 m² con vista al mar y alberca infinity.',
  'A luxury 180 sqm penthouse with ocean views and infinity pool.',
  '{"Alberca infinity",Rooftop,Gym,Spa,Concierge,"Vista al mar","Seguridad 24/7"}',
  '{https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=450&fit=crop,https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=450&fit=crop}',
  'https://my.matterport.com/show/?m=SxQL3iGyvok',
  'https://www.youtube.com/embed/dQw4w9WgXcQ'
);
