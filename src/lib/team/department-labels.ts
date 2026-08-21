/**
 * Traducción de nombres de departamento del organigrama (`v_org_structure.department_name`).
 *
 * El Hub no tiene un campo `department_name_en` editable (a diferencia de
 * `bio_long`/`bio_long_en`), así que hasta que se agregue esa columna ahí,
 * se traduce aquí. Lista acotada (org chart de la empresa, no crece seguido);
 * cualquier departamento nuevo que no esté en el diccionario se muestra tal
 * cual en ambos idiomas.
 */
const DEPARTMENT_LABEL_EN: Record<string, string> = {
  Marketing: 'Marketing',
  'Ventas — PDC y Tulum': 'Sales — PDC & Tulum',
  'Tecnología': 'Technology',
  'Capital Humano': 'Human Capital',
  'Finanzas y Contabilidad': 'Finance & Accounting',
  'Administración': 'Administration',
};

export function localizedDepartmentName(name: string, locale: string): string {
  if (locale !== 'en') return name;
  return DEPARTMENT_LABEL_EN[name] ?? name;
}
