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
  const editorial = isEn
    ? richContent.editorial?.en || richContent.editorial?.es
    : richContent.editorial?.es || richContent.editorial?.en;

  if (!editorial) return null;
  return <MarkdownContent markdown={editorial} />;
}
