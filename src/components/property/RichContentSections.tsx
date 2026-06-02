import type { Property } from '@/types/property';
import { MarkdownContent } from '@/components/common/MarkdownContent';

interface RichContentSectionsProps {
  richContent: NonNullable<Property['richContent']>;
  locale: string;
}

/**
 * Renderiza la descripción editorial de la ficha (desarrollo/unidad) desde el
 * único campo consolidado en markdown: richContent.editorial
 * (= descripcion_editorial_es_md / descripcion_editorial_en_md del Hub).
 *
 * Los 3 campos legacy del sistema editorial anterior (features / location /
 * lifestyle → "Características y diseño", "Ubicación y entorno", "Estilo de
 * vida") se eliminaron del sitio (2026-06-02): el Hub ahora usa un solo campo
 * editorial ES/EN que abarca todo. Si no hay editorial, no se renderiza nada;
 * la sección "Acerca de" (description) ya muestra la descripción principal.
 */
export default function RichContentSections({ richContent, locale }: RichContentSectionsProps) {
  const isEn = locale === 'en';
  // Estricto por idioma: NO se hace fallback EN→ES (ni ES→EN). Si falta el
  // editorial en el idioma de la página, no se renderiza nada — para no mezclar
  // idiomas (un visitante EN nunca debe ver texto en español). Decisión 2026-06-02.
  const editorial = isEn ? richContent.editorial?.en : richContent.editorial?.es;

  if (!editorial) return null;
  return <MarkdownContent markdown={editorial} />;
}
