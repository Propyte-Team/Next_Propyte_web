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

export default function BlogSidebarForm({ category }: { category: string | null | undefined }) {
  if (category && BROKER_CATEGORIES.has(category)) {
    return <BlogSidebarBrokerForm />;
  }
  return <BlogSidebarLeadForm />;
}
