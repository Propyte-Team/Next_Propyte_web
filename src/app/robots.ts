import type { MetadataRoute } from 'next';
import { shouldNoIndex } from '@/lib/seo/noindex';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';

export default function robots(): MetadataRoute.Robots {
  // En staging mantenemos Allow:/ deliberadamente: bloquear con Disallow:/
  // impediría que Google recrawlee y vea el `noindex` meta/header, dejando
  // las páginas como "Indexed without content" en SERPs. Una vez verificada
  // la desindexación (~4-6 semanas), se puede endurecer a Disallow:/.
  // Mientras tanto omitimos el sitemap para no inducir crawl proactivo.
  if (shouldNoIndex()) {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
