'use client';

import BlogSidebarBrokerForm from './BlogSidebarBrokerForm';
import BlogSidebarLeadForm from './BlogSidebarLeadForm';

/**
 * BlogSidebarForm
 * --------------------------------------------------------------
 * Wrapper que elige el form correcto según la categoría del blog:
 *   - "Para Asesores" → BlogSidebarBrokerForm (source: affiliate_request)
 *   - Cualquier otra  → BlogSidebarLeadForm   (source: lead_magnet)
 */
const BROKER_CATEGORIES = new Set(['Para Asesores']);

export default function BlogSidebarForm({
  category,
  registerTool = true,
}: {
  category: string | null | undefined;
  /**
   * WebMCP: si es `false`, esta instancia NO emite el atributo `toolname`.
   * El artículo renderiza este form 2 veces (móvil + desktop); solo una debe
   * registrar la tool, o Chrome tumba el renderer por toolname duplicado.
   */
  registerTool?: boolean;
}) {
  if (category && BROKER_CATEGORIES.has(category)) {
    return <BlogSidebarBrokerForm registerTool={registerTool} />;
  }
  return <BlogSidebarLeadForm registerTool={registerTool} />;
}
