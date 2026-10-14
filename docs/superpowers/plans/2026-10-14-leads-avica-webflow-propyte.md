# Leads del sitio de Avica → Zoho de Propyte — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Los formularios del sitio de Avica (Webflow) entran al Zoho de
Propyte por `POST /api/webhooks/webflow-avica`, con el mismo motor de
`/api/leads` (fila en `public.leads`, push a Zoho, nota en duplicados y
reintento por cron) y sin la Conversions API de Meta.

**Architecture:**
- **Adaptador puro** (`src/lib/webflow-avica/`): lee el webhook, descarta el
  spam y decide la fuente.
- **Manejador con dependencias inyectadas:** se prueba sin Supabase ni Zoho.
- **`procesar.ts`:** conecta Supabase y Zoho reusando `pushToZoho`, que se
  extrae de `/api/leads` sin cambiar su conducta.
- El proyecto de interés se decide en **una sola función**
  (`resolverProyectoZoho`), que comparten la ruta y el cron de reintento.

**Tech Stack:** Next.js 16 (App Router, route handlers), TypeScript strict,
zod 4, Vitest (entorno `node`, `src/**/*.test.ts`), Supabase JS, Zoho CRM v2.

**Spec:** `docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md`

## Global Constraints

- **Dónde trabajar:** worktree `C:\Users\ptoral\Projects\_leads-avica`, rama
  `feat/leads-avica-webflow`, base `origin/main` `8a255f8`. Todos los comandos
  se corren desde ahí.
- **Comandos:**
  - Una prueba: `npx vitest run <ruta>`
  - Suite completa: `npm run test:unit`
  - Tipos: `npx tsc --noEmit`
  - Lint: `npm run lint`
  - Build: `npm run build` (usa `--webpack`)
- **Prohibido leer `.env*`** (CLAUDE.md del repo). Solo `.env.example` se edita.
- **Variable de entorno:** `WEBFLOW_AVICA_WEBHOOK_TOKEN` (exacta). Nunca se
  escribe un valor real en el repo.
- **Textos exactos que activan reglas en Zoho:**
  - Campañas: `Sitio Avica - contacto - [LEADS]`,
    `Sitio Avica - broker - [BROKERS]` y `Sitio Avica - newsletter - [LEADS]`.
  - Formularios: `Formulario sitio Avica ES - Contacto`,
    `Formulario sitio Avica ES - Broker` y
    `Formulario sitio Avica ES - Newsletter`.
  - La regla de Meta CAPI excluye todo lo que contenga «Sitio Avica».
- **Fuentes:** `avica_contacto`, `avica_broker` y `avica_newsletter`.
- **Etiquetas legibles:** las de `yaxnah-registro-brokers/src/lib/sitio/mapeo.ts`,
  copiadas en la Tarea 1.
- **Desarrollos** (`Propyte_desarrollos.id`):
  - Yaxnáh Caucel `76dfb7d5-4755-4938-8bf2-07aed5d2df15`
  - Nativa Tulum `5c171eb4-f5f7-4ade-a8b1-0ef2a4926168`
  - Real Caucel no existe en el Hub.
- **Nada del código de Avica importa `@/lib/meta/capi`.**
- **Logs sin datos personales:** ni nombre, ni teléfono, ni correo.
- **`/api/leads` no cambia de conducta.** La Tarea 4 solo mueve código.
- Comentarios en español, con el estilo del repo: explican el **porqué**.
- Commits con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

Los cinco casos que la especificación implica y que es más probable que
muerdan. Cada uno lleva su prueba en la tarea indicada.

1. **La casilla llega como booleano `true`** en vez del texto `"true"`, si
   Webflow cambia el formato → debe contar como broker *(Tarea 3)*.
2. **La ruta de la página trae barra final o query** (`/desarrollos/yaxnah/?utm_source=x`)
   → debe resolver el desarrollo igual *(Tarea 1)*.
3. **El token recibido tiene distinta longitud que el configurado** →
   `timingSafeEqual` lanza con longitudes distintas; debe responder 401, no
   500 *(Tarea 6)*.
4. **Spam en mayúsculas** (`HTTPS://…`, `WWW.…`) → debe descartarse igual
   *(Tarea 3)*.
5. **Una opción nueva en un select de Webflow** (`interes_en = terreno`) → el
   lead entra como contacto, con la clave cruda en la descripción y sin
   proyecto; no se ignora *(Tareas 2 y 3)*.

---

### Task 1: Etiquetas y desarrollos del sitio de Avica

**Files:**
- Create: `src/lib/webflow-avica/etiquetas.ts`
- Test: `src/lib/webflow-avica/etiquetas.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `DOMINIO_AVICA: string` = `"avicainmobiliaria.com.mx"`
  - `ORIGEN_AVICA: string` = `"https://www.avicainmobiliaria.com.mx"`
  - `INTERES_AVICA: Record<string, string>`
  - `FUENTE_AVICA: Record<string, string>`
  - `etiquetaAvica(mapa: Record<string, string>, clave: string | null | undefined): string | null`
  - `desarrolloDePagina(page: string | null | undefined): { nombre: string; hubId: string | null } | null`
  - `hubIdAvica(page: string | null | undefined, interestOption: string | null | undefined): string | null`

- [ ] **Step 1: Write the failing test**

`src/lib/webflow-avica/etiquetas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  FUENTE_AVICA,
  INTERES_AVICA,
  desarrolloDePagina,
  etiquetaAvica,
  hubIdAvica,
} from './etiquetas';

const YAXNAH = '76dfb7d5-4755-4938-8bf2-07aed5d2df15';
const NATIVA = '5c171eb4-f5f7-4ade-a8b1-0ef2a4926168';

describe('etiquetaAvica', () => {
  it('traduce las claves de los selects de Webflow a lo que vio el visitante', () => {
    expect(etiquetaAvica(INTERES_AVICA, 'casa')).toBe('Comprar una casa');
    expect(etiquetaAvica(INTERES_AVICA, 'broker')).toBe('Soy Broker');
    expect(etiquetaAvica(FUENTE_AVICA, 'busqueda_google')).toBe('Búsqueda en Google');
  });

  it('una opción nueva en Webflow se escribe tal cual: el dato no se pierde', () => {
    expect(etiquetaAvica(INTERES_AVICA, 'terreno')).toBe('terreno');
  });

  it('sin clave no hay etiqueta', () => {
    expect(etiquetaAvica(INTERES_AVICA, null)).toBeNull();
    expect(etiquetaAvica(INTERES_AVICA, '')).toBeNull();
  });
});

describe('desarrolloDePagina', () => {
  it('reconoce las fichas /desarrollos/<slug> del CMS de Webflow', () => {
    expect(desarrolloDePagina('https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah'))
      .toEqual({ nombre: 'Yaxnáh', hubId: YAXNAH });
    expect(desarrolloDePagina('/desarrollos/nativa-tulum'))
      .toEqual({ nombre: 'Nativa Tulum', hubId: NATIVA });
  });

  it('tolera barra final y query string', () => {
    expect(desarrolloDePagina('https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah/?utm_source=x')?.hubId)
      .toBe(YAXNAH);
  });

  it('Real Caucel se nombra pero no tiene desarrollo en el Hub', () => {
    expect(desarrolloDePagina('/desarrollos/real-caucel')).toEqual({ nombre: 'Real Caucel', hubId: null });
  });

  it('otras páginas o slugs desconocidos no son un desarrollo', () => {
    expect(desarrolloDePagina('https://www.avicainmobiliaria.com.mx/contacto')).toBeNull();
    expect(desarrolloDePagina('/desarrollos/otro')).toBeNull();
    expect(desarrolloDePagina('/desarrollos')).toBeNull();
    expect(desarrolloDePagina(null)).toBeNull();
  });
});

describe('hubIdAvica', () => {
  it('la página manda sobre el interés', () => {
    expect(hubIdAvica('/desarrollos/nativa-tulum', 'casa')).toBe(NATIVA);
  });

  it('una ficha sin desarrollo en el Hub NO cae al interés', () => {
    expect(hubIdAvica('/desarrollos/real-caucel', 'casa')).toBeNull();
  });

  it('fuera de una ficha decide el interés: casa → Yaxnáh, departamento → Nativa Tulum', () => {
    expect(hubIdAvica('https://www.avicainmobiliaria.com.mx/', 'casa')).toBe(YAXNAH);
    expect(hubIdAvica('/contacto', 'departamento')).toBe(NATIVA);
  });

  it('asesor, broker, una opción nueva o nada → sin proyecto', () => {
    expect(hubIdAvica('/contacto', 'asesor')).toBeNull();
    expect(hubIdAvica('/contacto', 'broker')).toBeNull();
    expect(hubIdAvica('/contacto', 'terreno')).toBeNull();
    expect(hubIdAvica(null, null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/webflow-avica/etiquetas.test.ts`
Expected: FAIL. `Failed to resolve import "./etiquetas"`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/webflow-avica/etiquetas.ts`:

```ts
// ============================================================
// Sitio de Avica (avicainmobiliaria.com.mx, Webflow) — etiquetas y desarrollos
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md §5
// ============================================================

export const DOMINIO_AVICA = 'avicainmobiliaria.com.mx';
export const ORIGEN_AVICA = `https://www.${DOMINIO_AVICA}`;

/**
 * Lo que vio el visitante en los selects del formulario «Email Footer».
 * Copiadas de yaxnah-registro-brokers/src/lib/sitio/mapeo.ts: el mismo
 * formulario alimentó al Zoho de Yaxnáh hasta el 2026-10-14.
 */
export const INTERES_AVICA: Record<string, string> = {
  asesor: 'Ser contactado por un asesor',
  casa: 'Comprar una casa',
  departamento: 'Invertir en un departamento',
  broker: 'Soy Broker',
};

export const FUENTE_AVICA: Record<string, string> = {
  busqueda_google: 'Búsqueda en Google',
  publicidad_meta: 'Publicidad en redes sociales',
  referencias: 'Referencias',
  medio_impreso: 'Medio impreso',
};

/** Una clave desconocida se escribe tal cual: una opción nueva en Webflow no debe perder el dato. */
export function etiquetaAvica(
  mapa: Record<string, string>,
  clave: string | null | undefined,
): string | null {
  if (!clave) return null;
  return mapa[clave] ?? clave;
}

interface DesarrolloAvica {
  nombre: string;
  /** `Propyte_desarrollos.id`; null si el desarrollo no existe en el Hub. */
  hubId: string | null;
}

const YAXNAH_CAUCEL = '76dfb7d5-4755-4938-8bf2-07aed5d2df15';
const NATIVA_TULUM = '5c171eb4-f5f7-4ade-a8b1-0ef2a4926168';

/** Fichas `/desarrollos/<slug>` del CMS de Webflow (medido el 2026-10-14). */
const DESARROLLOS_AVICA: Record<string, DesarrolloAvica> = {
  yaxnah: { nombre: 'Yaxnáh', hubId: YAXNAH_CAUCEL },
  'nativa-tulum': { nombre: 'Nativa Tulum', hubId: NATIVA_TULUM },
  // No existe en el Hub: se nombra en la descripción, sin Proyecto_de_Interes.
  'real-caucel': { nombre: 'Real Caucel', hubId: null },
};

/**
 * Fuera de una ficha, el interés decide (decisión de diseño 2026-10-14):
 * Nativa Tulum es el único desarrollo de departamentos publicado en Avica.
 */
const HUB_POR_INTERES: Record<string, string> = {
  casa: YAXNAH_CAUCEL,
  departamento: NATIVA_TULUM,
};

export function desarrolloDePagina(page: string | null | undefined): DesarrolloAvica | null {
  if (!page) return null;
  let ruta: string;
  try {
    ruta = new URL(page, ORIGEN_AVICA).pathname;
  } catch {
    return null;
  }
  const coincide = /^\/desarrollos\/([^/]+)\/?$/.exec(ruta);
  return coincide ? (DESARROLLOS_AVICA[coincide[1]] ?? null) : null;
}

/**
 * Desarrollo del Hub para `Proyecto_de_Interes`. La página manda sobre el
 * interés: quien escribe desde la ficha de Real Caucel no quiere Yaxnáh
 * aunque haya elegido «Comprar una casa».
 */
export function hubIdAvica(
  page: string | null | undefined,
  interestOption: string | null | undefined,
): string | null {
  const desarrollo = desarrolloDePagina(page);
  if (desarrollo) return desarrollo.hubId;
  return interestOption ? (HUB_POR_INTERES[interestOption] ?? null) : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/webflow-avica/etiquetas.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/webflow-avica/etiquetas.ts src/lib/webflow-avica/etiquetas.test.ts
git commit -m "feat(leads): etiquetas y desarrollos del sitio de Avica" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Las 3 fuentes de Avica en `field-maps` y `KNOWN_SOURCES`

**Files:**
- Modify: `src/lib/zoho/field-maps.ts` (`LeadSource`, `FormData`, `campaignSlug`, `campaignTag`, `formDescription`, `baseLeadFields`, `tipoDeContacto`, `composeDescription`, `composeMensaje`, `composeDuplicateNote`, `faltanDatosDeContacto`, `sourceToZohoPayload`)
- Modify: `src/lib/lead-sources.ts`
- Test: `src/lib/zoho/field-maps.avica.test.ts`

**Interfaces:**
- Consumes (Tarea 1): `DOMINIO_AVICA`, `INTERES_AVICA`, `FUENTE_AVICA`, `etiquetaAvica`.
- Produces:
  - `LeadSource` con `"avica_contacto" | "avica_broker" | "avica_newsletter"`.
  - `FormData` con `interestOption?: string | null`, `heardFrom?: string | null` e `isBroker?: boolean | null`.
  - `sourceToZohoPayload(source, data, locale, utms, zohoDevelopmentId?)` pone `Proyecto_de_Interes` para `avica_contacto` cuando recibe el id.

- [ ] **Step 1: Write the failing test**

`src/lib/zoho/field-maps.avica.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { KNOWN_SOURCES } from '@/lib/lead-sources';
import {
  composeDuplicateNote,
  faltanDatosDeContacto,
  sourceToZohoPayload,
  type FormData,
} from './field-maps';

/** Datos inventados con la forma real del formulario «Email Footer». */
const CONTACTO: FormData = {
  name: 'Ana María Ruiz',
  email: 'ana@example.com',
  phone: '9991234567',
  city: 'Mérida',
  message: 'Me interesa una casa de 3 recámaras',
  interestOption: 'casa',
  heardFrom: 'busqueda_google',
  page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
  propertyName: 'Yaxnáh',
};

describe('fuentes del sitio de Avica', () => {
  it('están en KNOWN_SOURCES: sin esto el cron nunca las reintenta', () => {
    expect(KNOWN_SOURCES).toEqual(
      expect.arrayContaining(['avica_contacto', 'avica_broker', 'avica_newsletter']),
    );
  });

  it('avica_contacto lleva la campaña y el formulario que leen las reglas del Zoho de Propyte', () => {
    const { lead } = sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {});
    expect(lead).toMatchObject({
      Nombre_de_Campa_a: 'Sitio Avica - contacto - [LEADS]',
      Nombre_del_formulario: 'Formulario sitio Avica ES - Contacto',
      Tipo_de_Contacto: 'Lead',
      Lead_Source: 'Sitio web',
      Plataforma_de_llegada: 'Sitio web',
      Lead_Status: 'Nuevo',
      Email: 'ana@example.com',
      Phone: '9991234567',
      City: 'Mérida',
      Mensaje: 'Me interesa una casa de 3 recámaras',
      Nombre_anuncio: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
    });
    expect(lead).not.toHaveProperty('Owner');
    expect(lead).not.toHaveProperty('Broker');
  });

  it('la descripción trae sitio, desarrollo, interés, cómo nos conoció y ciudad, con etiquetas legibles', () => {
    const { lead } = sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {});
    expect(lead.Description).toBe(
      [
        'Sitio: avicainmobiliaria.com.mx/desarrollos/yaxnah',
        'Desarrollo: Yaxnáh',
        'Interés: Comprar una casa',
        'Cómo nos conoció: Búsqueda en Google',
        'Ciudad: Mérida',
      ].join('\n'),
    );
  });

  it('una opción nueva de un select se escribe cruda, sin perderse', () => {
    const { lead } = sourceToZohoPayload(
      'avica_contacto',
      { ...CONTACTO, interestOption: 'terreno', heardFrom: 'tiktok' },
      'es',
      {},
    );
    expect(lead.Description).toContain('Interés: terreno');
    expect(lead.Description).toContain('Cómo nos conoció: tiktok');
  });

  it('Proyecto_de_Interes solo cuando se resolvió un id', () => {
    expect(
      sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {}, '6040986000097746005').lead.Proyecto_de_Interes,
    ).toEqual([{ id: '6040986000097746005' }]);
    expect(sourceToZohoPayload('avica_contacto', CONTACTO, 'es', {}).lead).not.toHaveProperty('Proyecto_de_Interes');
  });

  it('avica_broker es un broker de Propyte: etiqueta [BROKERS], tipo Broker, marca Broker y sin proyecto', () => {
    const { lead } = sourceToZohoPayload(
      'avica_broker',
      { ...CONTACTO, isBroker: true },
      'es',
      {},
      '6040986000097746005',
    );
    expect(lead).toMatchObject({
      Nombre_de_Campa_a: 'Sitio Avica - broker - [BROKERS]',
      Nombre_del_formulario: 'Formulario sitio Avica ES - Broker',
      Tipo_de_Contacto: 'Broker',
      Broker: true,
    });
    expect(lead).not.toHaveProperty('Proyecto_de_Interes');
    expect(lead.Description).toContain('Marcó «¿Eres broker inmobiliario?»');
  });

  it('avica_newsletter: solo correo, «Suscriptor» de apellido y sin mensaje', () => {
    const datos: FormData = {
      email: 'lector@example.com',
      page: 'https://www.avicainmobiliaria.com.mx/blog',
    };
    expect(faltanDatosDeContacto('avica_newsletter', datos)).toBeNull();
    const { lead } = sourceToZohoPayload('avica_newsletter', datos, 'es', {});
    expect(lead).toMatchObject({
      Nombre_de_Campa_a: 'Sitio Avica - newsletter - [LEADS]',
      Nombre_del_formulario: 'Formulario sitio Avica ES - Newsletter',
      Last_Name: 'Suscriptor',
      Email: 'lector@example.com',
    });
    expect(lead).not.toHaveProperty('Mensaje');
  });

  it('la exención de newsletter NO se extiende al contacto de Avica', () => {
    expect(faltanDatosDeContacto('avica_contacto', { email: 'ana@example.com' })).toBe('sin nombre');
  });

  it('la nota de duplicado nombra el sitio de Avica, no propyte.com', () => {
    const nota = composeDuplicateNote('avica_contacto', CONTACTO, 'es', {});
    expect(nota.title).toBe('Nuevo contacto web — Contacto');
    expect(nota.content).toContain('Campaña: Sitio Avica - contacto');
  });

  it('las fuentes de propyte.com no cambian', () => {
    const { lead } = sourceToZohoPayload('contact', { name: 'Ana Ruiz', email: 'a@example.com', phone: '9991234567' }, 'es', {});
    expect(lead.Nombre_de_Campa_a).toBe('Propyte web - contacto - [LEADS]');
    expect(lead.Nombre_del_formulario).toBe('Formulario Propyte web ES - Contacto general');
    expect(composeDuplicateNote('contact', {}, 'es', {}).title).toBe('Nuevo contacto web — Contacto general');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/zoho/field-maps.avica.test.ts`
Expected: FAIL. `KNOWN_SOURCES` no contiene las fuentes de Avica y la campaña sale
`Propyte web - undefined - [LEADS]` (Vitest no revisa tipos; el error es de conducta).

- [ ] **Step 3: Implement — tipos y `KNOWN_SOURCES`**

En `src/lib/zoho/field-maps.ts`, al final de la unión `LeadSource`, sustituye la línea
`  | "guia_terrenos";` (con su comentario arriba intacto) por:

```ts
  | "guia_terrenos"
  /** Sitio de Avica (Webflow): formulario de contacto «Email Footer». Va al Zoho de Propyte. */
  | "avica_contacto"
  /** Sitio de Avica: marcó «¿Eres broker inmobiliario?» o eligió «Soy Broker». */
  | "avica_broker"
  /** Sitio de Avica: newsletter «Email Form» (solo correo). */
  | "avica_newsletter";
```

En `interface FormData`, después de `page?: string | null;`, agrega:

```ts
  /** Sitio de Avica: clave cruda del select «interes_en» (asesor | casa | departamento | broker). */
  interestOption?: string | null;
  /** Sitio de Avica: clave cruda de «nos_encontro_en». */
  heardFrom?: string | null;
  /** Sitio de Avica: casilla «¿Eres broker inmobiliario?». */
  isBroker?: boolean | null;
```

En `src/lib/lead-sources.ts`, después de `'guia_terrenos',` agrega:

```ts
  'avica_contacto',
  'avica_broker',
  'avica_newsletter',
```

Agrega el import al inicio de `field-maps.ts`, junto a los demás:

```ts
import { DOMINIO_AVICA, FUENTE_AVICA, INTERES_AVICA, etiquetaAvica } from "@/lib/webflow-avica/etiquetas";
```

- [ ] **Step 4: Implement — campaña, formulario y tipo**

Justo antes de `function campaignSlug`, agrega:

```ts
function esAvica(source: LeadSource): boolean {
  return source === "avica_contacto" || source === "avica_broker" || source === "avica_newsletter";
}

/**
 * «Sitio Avica» y no «Propyte web»: la regla «Enviar Lead a Meta CAPI» del
 * Zoho de Propyte excluye las campañas que contienen «Sitio Avica» (cambio
 * del 2026-10-14). Las reglas de asignación miran la etiqueta [LEADS] o
 * [BROKERS], no este prefijo.
 */
function campaignPrefix(source: LeadSource): string {
  return esAvica(source) ? "Sitio Avica" : "Propyte web";
}
```

En `campaignSlug`, después de `case "guia_terrenos": ...` agrega:

```ts
    case "avica_contacto":        return "contacto";
    case "avica_broker":          return "broker";
    case "avica_newsletter":      return "newsletter";
```

En `campaignTag`, sustituye `    case "broker_registration": return "[BROKERS]";` por:

```ts
    case "broker_registration":
    case "avica_broker":        return "[BROKERS]";
```

En `formDescription`, después de `case "guia_terrenos": ...` agrega:

```ts
      case "avica_contacto":      return "Contacto";
      case "avica_broker":        return "Broker";
      case "avica_newsletter":    return "Newsletter";
```

y sustituye `  return \`Formulario Propyte web ${langTag} - ${desc}\`;` por:

```ts
  return `Formulario ${esAvica(source) ? "sitio Avica" : "Propyte web"} ${langTag} - ${desc}`;
```

En `baseLeadFields`, sustituye
`      const base = \`Propyte web - ${campaignSlug(source)} - ${campaignTag(source)}\`;` por:

```ts
      const base = `${campaignPrefix(source)} - ${campaignSlug(source)} - ${campaignTag(source)}`;
```

En `tipoDeContacto`, sustituye `    case "broker_registration": return "Broker";` por:

```ts
    case "broker_registration":
    case "avica_broker":        return "Broker";
```

- [ ] **Step 5: Implement — descripción, mensaje, nota y exención**

Justo antes de `function composeDescription`, agrega:

```ts
/** Ruta de la página sin dominio ni query, para leerla en Zoho; '' en la portada. */
function rutaDePagina(page: string | null | undefined): string {
  if (!page) return "";
  try {
    const { pathname } = new URL(page);
    return pathname === "/" ? "" : pathname;
  } catch {
    return "";
  }
}
```

En `composeDescription`, después del bloque `case "lp_casas_riviera": ... break;`, agrega:

```ts
    case "avica_contacto":
    case "avica_broker":
    case "avica_newsletter": {
      parts.push(`Sitio: ${DOMINIO_AVICA}${rutaDePagina(data.page)}`);
      if (data.propertyName) parts.push(`Desarrollo: ${data.propertyName}`);
      const interes = etiquetaAvica(INTERES_AVICA, data.interestOption);
      if (interes) parts.push(`Interés: ${interes}`);
      const fuente = etiquetaAvica(FUENTE_AVICA, data.heardFrom);
      if (fuente) parts.push(`Cómo nos conoció: ${fuente}`);
      if (data.city) parts.push(`Ciudad: ${data.city}`);
      if (data.isBroker) parts.push("Marcó «¿Eres broker inmobiliario?»");
      break;
    }
```

En `composeMensaje`, sustituye
`  if (source === "newsletter" || source === "lead_magnet" || source === "glossary_pdf") {` por:

```ts
  if (
    source === "newsletter" ||
    source === "avica_newsletter" ||
    source === "lead_magnet" ||
    source === "glossary_pdf"
  ) {
```

En `composeDuplicateNote`, sustituye las dos líneas

```ts
  const campaign = `Propyte web - ${campaignSlug(source)}`;
  const title = `Nuevo contacto web — ${formName.replace(/^Formulario Propyte web (ES|EN) - /, "")}`;
```

por:

```ts
  const campaign = `${campaignPrefix(source)} - ${campaignSlug(source)}`;
  const title = `Nuevo contacto web — ${formName.replace(/^Formulario (Propyte web|sitio Avica) (ES|EN) - /, "")}`;
```

En `faltanDatosDeContacto`, sustituye

```ts
  // `newsletter` es el ÚNICO source exento, y la exención es una lista cerrada
  // de uno, no un `default` permisivo: su form solo capta email y abajo se le
  // pone «Suscriptor» de Last_Name a propósito. Exigirle el resto lo apagaría.
  if (source === "newsletter") return null;
```

por:

```ts
  // Los dos newsletters son los ÚNICOS sources exentos, y la exención es una
  // lista cerrada, no un `default` permisivo: sus forms solo captan email y
  // abajo se les pone «Suscriptor» de Last_Name a propósito. Exigirles el
  // resto los apagaría.
  if (source === "newsletter" || source === "avica_newsletter") return null;
```

- [ ] **Step 6: Implement — payload**

En `sourceToZohoPayload`, sustituye `  const useFallbackName = source === "newsletter";` por:

```ts
  const useFallbackName = source === "newsletter" || source === "avica_newsletter";
```

Sustituye el bloque

```ts
  // Broker registration: marker boolean + Inmobiliaria
  if (source === "broker_registration") {
    lead.Broker = true;
    const inmobiliaria = fitZoho("Inmobiliaria", data.company);
    if (inmobiliaria) lead.Inmobiliaria = inmobiliaria;
  }
```

por:

```ts
  // Brokers: marker boolean (lo leen las reglas de Zoho) + Inmobiliaria solo
  // donde el form la pregunta. El broker de Avica marcó una casilla; no hay
  // inmobiliaria que copiar.
  if (source === "broker_registration" || source === "avica_broker") {
    lead.Broker = true;
  }
  if (source === "broker_registration") {
    const inmobiliaria = fitZoho("Inmobiliaria", data.company);
    if (inmobiliaria) lead.Inmobiliaria = inmobiliaria;
  }
```

Sustituye el bloque

```ts
  // Property inquiry: lookup zoho_developmentId
  if (source === "property_inquiry") {
    if (zohoDevelopmentId) {
      lead.Proyecto_de_Interes = [{ id: zohoDevelopmentId }];
    }
    // Si no hay mapping, composeDescription ya incluyó "Propiedad: <name>"
  }
```

por:

```ts
  // Proyecto de interés: lo resuelve resolverProyectoZoho (una sola función
  // para la ruta y el cron). Si no hay mapping, composeDescription ya nombra
  // la propiedad o el desarrollo.
  if (zohoDevelopmentId && (source === "property_inquiry" || source === "avica_contacto")) {
    lead.Proyecto_de_Interes = [{ id: zohoDevelopmentId }];
  }
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/lib/zoho`
Expected: PASS, tanto el archivo nuevo como `field-maps.contacto`, `.guia-terrenos`, `.limits` y `.mobile`.

Run: `npx tsc --noEmit`
Expected: sin errores. Si un `switch` exhaustivo de otro archivo reclama las fuentes nuevas,
agrégalas ahí con el mismo patrón. A 2026-10-14 solo `field-maps.ts` tiene switches sobre
`LeadSource`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/zoho/field-maps.ts src/lib/zoho/field-maps.avica.test.ts src/lib/lead-sources.ts
git commit -m "feat(leads): fuentes del sitio de Avica en el mapeo a Zoho de Propyte" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Adaptador del webhook de Webflow

**Files:**
- Create: `src/lib/webflow-avica/envio.ts`
- Test: `src/lib/webflow-avica/envio.test.ts`

**Interfaces:**
- Consumes:
  - Tarea 1: `ORIGEN_AVICA`, `desarrolloDePagina`.
  - Tarea 2: `FormData`, `LeadSource`.
- Produces:
  - `type FuenteAvica = 'avica_contacto' | 'avica_broker' | 'avica_newsletter'`
  - `interface EnvioAvica { formulario: string; pagina: string | null; nombre: string | null; telefono: string | null; correo: string | null; ciudad: string | null; interes: string | null; fuente: string | null; mensaje: string | null; esBroker: boolean; trampa: string | null }`
  - `type MotivoDescarte = 'trampa' | 'enlaces'`
  - `leerEnvio(cuerpo: unknown): EnvioAvica | null`
  - `motivoDescarte(envio: EnvioAvica): MotivoDescarte | null`
  - `fuenteAvica(envio: EnvioAvica): FuenteAvica | null`
  - `aFormData(envio: EnvioAvica): FormData`

- [ ] **Step 1: Write the failing test**

`src/lib/webflow-avica/envio.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CAMPO_TRAMPA, aFormData, fuenteAvica, leerEnvio, motivoDescarte, type EnvioAvica } from './envio';

/** Forma real del webhook form_submission de Webflow; los datos son inventados. */
function webhook(
  data: Record<string, unknown>,
  extra: Record<string, unknown> = {},
  formulario = 'Email Footer',
) {
  return {
    triggerType: 'form_submission',
    payload: {
      name: formulario,
      siteId: '660ddb316dd471209be88ddc',
      data,
      submittedAt: '2026-10-14T17:20:00.000Z',
      id: 'evento-1',
      formId: 'formulario-1',
      ...extra,
    },
  };
}

const LEGITIMO = {
  nombre: '  Ana María Ruiz ',
  tel: '999 123 4567',
  correo: 'Ana.Ruiz@Example.com ',
  ciudad: 'Mérida',
  interes_en: 'casa',
  nos_encontro_en: 'busqueda_google',
  mensaje: '¿Tienen casas de 3 recámaras?',
  'Field 8': 'false',
};

const leido = (data: Record<string, unknown>, extra = {}, formulario?: string) =>
  leerEnvio(webhook(data, extra, formulario)) as EnvioAvica;

describe('leerEnvio', () => {
  it('toma los campos del formulario y los limpia', () => {
    expect(leido(LEGITIMO, { publishedPath: '/desarrollos/yaxnah' })).toEqual<EnvioAvica>({
      formulario: 'Email Footer',
      pagina: '/desarrollos/yaxnah',
      nombre: 'Ana María Ruiz',
      telefono: '999 123 4567',
      correo: 'ana.ruiz@example.com',
      ciudad: 'Mérida',
      interes: 'casa',
      fuente: 'busqueda_google',
      mensaje: '¿Tienen casas de 3 recámaras?',
      esBroker: false,
      trampa: null,
    });
  });

  it('los vacíos quedan en null y un correo mal escrito se ignora', () => {
    expect(leido({ nombre: 'Juan', tel: '', correo: 'juan@', mensaje: '   ' })).toMatchObject({
      nombre: 'Juan', telefono: null, correo: null, mensaje: null, ciudad: null, interes: null, pagina: null,
    });
  });

  it('sin publishedPath usa la ruta de pageUrl', () => {
    expect(leido(LEGITIMO, { pageUrl: 'https://www.avicainmobiliaria.com.mx/contacto?utm_source=x' }).pagina)
      .toBe('/contacto');
  });

  it('el newsletter manda su correo en «correo_newsletter»', () => {
    expect(leido({ correo_newsletter: 'Lector@Example.com' }, {}, 'Email Form')).toMatchObject({
      formulario: 'Email Form', correo: 'lector@example.com',
    });
  });

  it('la casilla de broker: «Field 8» sin publicar, «es_broker» publicada, texto o booleano', () => {
    expect(leido({ ...LEGITIMO, 'Field 8': 'true' }).esBroker).toBe(true);
    expect(leido({ ...LEGITIMO, 'Field 8': undefined, es_broker: 'true' }).esBroker).toBe(true);
    expect(leido({ ...LEGITIMO, 'Field 8': undefined, es_broker: true }).esBroker).toBe(true);
    expect(leido({ ...LEGITIMO, 'Field 8': 'false' }).esBroker).toBe(false);
    expect(leido({ nombre: 'Juan', correo: 'juan@example.com' }).esBroker).toBe(false);
  });

  it('lee el campo trampa', () => {
    expect(leido({ ...LEGITIMO, [CAMPO_TRAMPA]: 'bot' }).trampa).toBe('bot');
  });

  it('null si no es un form_submission con datos', () => {
    expect(leerEnvio({ triggerType: 'site_publish', payload: {} })).toBeNull();
    expect(leerEnvio({ triggerType: 'form_submission', payload: { name: 'Email Footer' } })).toBeNull();
    expect(leerEnvio('basura')).toBeNull();
    expect(leerEnvio(null)).toBeNull();
  });
});

describe('motivoDescarte', () => {
  const base = leido(LEGITIMO);

  it('un lead normal no se descarta', () => {
    expect(motivoDescarte(base)).toBeNull();
  });

  it('descarta si el campo trampa viene lleno', () => {
    expect(motivoDescarte({ ...base, trampa: 'x' })).toBe('trampa');
  });

  it('descarta enlaces o HTML en nombre, ciudad o mensaje (así llegó el 100% del spam medido)', () => {
    expect(motivoDescarte({ ...base, mensaje: 'Ruta en Madrid <a href=https://ejemplo.top>tour</a>' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, mensaje: 'visita https://ejemplo.top' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, mensaje: 'mira www.ejemplo.top' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, nombre: '<b>Promo</b>' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, ciudad: 'http://spam.top' })).toBe('enlaces');
  });

  it('también en mayúsculas', () => {
    expect(motivoDescarte({ ...base, mensaje: 'VISITA HTTPS://EJEMPLO.TOP' })).toBe('enlaces');
    expect(motivoDescarte({ ...base, mensaje: 'MIRA WWW.EJEMPLO.TOP' })).toBe('enlaces');
  });

  it('no confunde un correo o una comparación con un enlace', () => {
    expect(motivoDescarte({ ...base, mensaje: 'Escríbanme a ana@example.com, ¿precio < 2 millones?' })).toBeNull();
  });

  it('la falta de contacto NO es spam: la decide faltanDatosDeContacto y la fila se guarda', () => {
    expect(motivoDescarte({ ...base, correo: null, telefono: null })).toBeNull();
  });
});

describe('fuenteAvica', () => {
  const base = leido(LEGITIMO);

  it('newsletter, broker por interés o por casilla, y contacto', () => {
    expect(fuenteAvica({ ...base, formulario: 'Email Form' })).toBe('avica_newsletter');
    expect(fuenteAvica({ ...base, interes: 'broker' })).toBe('avica_broker');
    expect(fuenteAvica({ ...base, esBroker: true })).toBe('avica_broker');
    expect(fuenteAvica(base)).toBe('avica_contacto');
  });

  it('una opción nueva del select sigue siendo contacto', () => {
    expect(fuenteAvica({ ...base, interes: 'terreno' })).toBe('avica_contacto');
  });

  it('un formulario que no conocemos se ignora', () => {
    expect(fuenteAvica({ ...base, formulario: 'Formulario nuevo' })).toBeNull();
  });
});

describe('aFormData', () => {
  it('arma los datos de /api/leads con la página absoluta y el desarrollo de la ficha', () => {
    const datos = aFormData(leido(LEGITIMO, { publishedPath: '/desarrollos/yaxnah' }));
    expect(datos).toEqual({
      name: 'Ana María Ruiz',
      email: 'ana.ruiz@example.com',
      phone: '999 123 4567',
      city: 'Mérida',
      message: '¿Tienen casas de 3 recámaras?',
      interestOption: 'casa',
      heardFrom: 'busqueda_google',
      isBroker: null,
      propertyName: 'Yaxnáh',
      page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah',
    });
  });

  it('sin página usa la portada; la casilla marcada viaja como true', () => {
    const datos = aFormData({ ...leido(LEGITIMO), esBroker: true });
    expect(datos.page).toBe('https://www.avicainmobiliaria.com.mx/');
    expect(datos.propertyName).toBeNull();
    expect(datos.isBroker).toBe(true);
  });

  it('una opción nueva del select se conserva cruda', () => {
    expect(aFormData(leido({ ...LEGITIMO, interes_en: 'terreno' })).interestOption).toBe('terreno');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/webflow-avica/envio.test.ts`
Expected: FAIL. `Failed to resolve import "./envio"`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/webflow-avica/envio.ts`:

```ts
// ============================================================
// Webhook form_submission de Webflow (sitio de Avica) → datos de /api/leads
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md §5-6
// Portado de yaxnah-registro-brokers/src/lib/sitio/envio.ts, probado contra
// los 45 envíos reales del formulario.
// ============================================================

import { z } from 'zod';
import type { FormData, LeadSource } from '@/lib/zoho/field-maps';
import { ORIGEN_AVICA, desarrolloDePagina } from './etiquetas';

/** Honeypot del formulario «Email Footer» (mismo nombre que revisa la app de brokers). */
export const CAMPO_TRAMPA = 'campo_extra_hp';
const FORMULARIO_CONTACTO = 'Email Footer';
const FORMULARIO_NEWSLETTER = 'Email Form';

export type FuenteAvica = Extract<LeadSource, 'avica_contacto' | 'avica_broker' | 'avica_newsletter'>;

/** Un envío de un formulario del sitio de Avica, ya limpio. */
export interface EnvioAvica {
  /** Nombre del formulario en Webflow («Email Footer» o «Email Form»). */
  formulario: string;
  /** Ruta de la página donde se envió, si Webflow la manda. */
  pagina: string | null;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  ciudad: string | null;
  /** Clave cruda del select «interes_en». */
  interes: string | null;
  /** Clave cruda del select «nos_encontro_en». */
  fuente: string | null;
  mensaje: string | null;
  /** Casilla «¿Eres broker inmobiliario?». */
  esBroker: boolean;
  trampa: string | null;
}

export type MotivoDescarte = 'trampa' | 'enlaces';

const esquemaWebhook = z.object({
  triggerType: z.literal('form_submission'),
  payload: z.object({
    name: z.string(),
    data: z.record(z.string(), z.unknown()),
    publishedPath: z.string().optional(),
    pageUrl: z.string().optional(),
  }),
});

const correoValido = z.email();

const textoDe = (valor: unknown): string | null => {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim().replace(/\s+/g, ' ');
  return limpio === '' ? null : limpio;
};

function rutaDe(publishedPath: string | undefined, pageUrl: string | undefined): string | null {
  if (publishedPath) return publishedPath;
  if (!pageUrl) return null;
  try {
    return new URL(pageUrl).pathname;
  } catch {
    return null;
  }
}

/** null si el cuerpo no es un form_submission de Webflow con datos. */
export function leerEnvio(cuerpo: unknown): EnvioAvica | null {
  const analisis = esquemaWebhook.safeParse(cuerpo);
  if (!analisis.success) return null;
  const { name, data, publishedPath, pageUrl } = analisis.data.payload;
  const correo = textoDe(data.correo ?? data.correo_newsletter)?.toLowerCase() ?? null;
  // Sin publicar, la casilla no tiene nombre y Webflow la manda como «Field 8».
  // Se acepta booleano por si Webflow cambia el formato del payload.
  const casilla = data.es_broker ?? data['Field 8'];
  return {
    formulario: name,
    pagina: rutaDe(publishedPath, pageUrl),
    nombre: textoDe(data.nombre),
    telefono: textoDe(data.tel),
    correo: correo && correoValido.safeParse(correo).success ? correo : null,
    ciudad: textoDe(data.ciudad),
    interes: textoDe(data.interes_en),
    fuente: textoDe(data.nos_encontro_en),
    mensaje: textoDe(data.mensaje),
    esBroker: casilla === true || textoDe(casilla) === 'true',
    trampa: textoDe(data[CAMPO_TRAMPA]),
  };
}

/** Medido contra los 45 envíos reales (2026-10-14): los 35 de spam traían enlaces; ninguno legítimo. */
const ENLACE_O_HTML = /https?:\/\/|www\.|\[url|<[a-z][^>]*>/i;

/**
 * Solo lo que es spam con certeza. La falta de datos de contacto NO es spam:
 * la decide faltanDatosDeContacto, igual que en /api/leads, y esa fila se
 * guarda como evidencia.
 */
export function motivoDescarte(envio: EnvioAvica): MotivoDescarte | null {
  if (envio.trampa) return 'trampa';
  if ([envio.nombre, envio.ciudad, envio.mensaje].some((t) => t && ENLACE_O_HTML.test(t))) {
    return 'enlaces';
  }
  return null;
}

/** null = formulario que no conocemos: se ignora con 200. */
export function fuenteAvica(envio: EnvioAvica): FuenteAvica | null {
  if (envio.formulario === FORMULARIO_NEWSLETTER) return 'avica_newsletter';
  if (envio.formulario !== FORMULARIO_CONTACTO) return null;
  return envio.interes === 'broker' || envio.esBroker ? 'avica_broker' : 'avica_contacto';
}

export function aFormData(envio: EnvioAvica): FormData {
  const page = `${ORIGEN_AVICA}${envio.pagina ?? '/'}`;
  return {
    name: envio.nombre,
    email: envio.correo,
    phone: envio.telefono,
    city: envio.ciudad,
    message: envio.mensaje,
    interestOption: envio.interes,
    heardFrom: envio.fuente,
    // null y no false: compactFormData no guarda nulos y la descripción solo
    // menciona la casilla cuando se marcó.
    isBroker: envio.esBroker ? true : null,
    propertyName: desarrolloDePagina(page)?.nombre ?? null,
    page,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/webflow-avica/envio.test.ts`
Expected: PASS (19 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/webflow-avica/envio.ts src/lib/webflow-avica/envio.test.ts
git commit -m "feat(leads): adaptador del webhook de Webflow del sitio de Avica" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Extraer el motor de `/api/leads` sin cambiar su conducta

**Files:**
- Create: `src/lib/leads/compact-form-data.ts` (puro)
- Create: `src/lib/leads/registrar-lead.ts` (`updateLeadLocal` y `pushToZoho`)
- Modify: `src/app/api/leads/route.ts` (quita las cuatro piezas y las importa)
- Test: `src/lib/leads/compact-form-data.test.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces:
  - `compactFormData(data: FormData): Record<string, unknown> | null`
  - `pushToZoho(supabase: Awaited<ReturnType<typeof createServiceRoleClient>>, leadId: string, source: LeadSource, payload: { lead: ZohoLead; account?: ZohoAccount }, noteContext: { data: FormData; locale: Locale; utms: UtmData }): Promise<void>`

- [ ] **Step 1: Write the failing test**

`src/lib/leads/compact-form-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { compactFormData } from './compact-form-data';

describe('compactFormData', () => {
  it('quita null, undefined y cadena vacía; conserva lo demás', () => {
    expect(
      compactFormData({ name: 'Ana', email: '', phone: null, city: undefined, isBroker: true }),
    ).toEqual({ name: 'Ana', isBroker: true });
  });

  it('null si no queda nada que guardar', () => {
    expect(compactFormData({ name: '', email: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/leads/compact-form-data.test.ts`
Expected: FAIL. `Failed to resolve import "./compact-form-data"`.

- [ ] **Step 3: Mover el código con un script (líneas verificadas en `origin/main` `8a255f8`)**

Ejecuta desde la raíz del worktree. El script aborta si alguna línea esperada no está donde
debe, así no corta en el lugar equivocado:

```bash
node - <<'EOF'
const fs = require('fs');
const RUTA = 'src/app/api/leads/route.ts';
const crudo = fs.readFileSync(RUTA, 'utf8');
const EOL = crudo.includes('\r\n') ? '\r\n' : '\n';
const L = crudo.split(/\r?\n/);
const esperar = (n, inicio) => {
  if (!L[n - 1].startsWith(inicio)) throw new Error(`línea ${n}: «${L[n - 1]}», esperaba «${inicio}»`);
};
esperar(132, '// Retry exponencial');
esperar(133, 'const LOCAL_UPDATE_DELAYS_MS');
esperar(139, '/**');
esperar(144, 'async function updateLeadLocal(');
esperar(165, '}');
esperar(167, '/**');
esperar(176, 'function compactFormData(');
esperar(181, '}');
esperar(198, '/**');
esperar(203, 'async function pushToZoho(');
esperar(292, '}');
// Cada bloque se quita junto con la línea en blanco que lo sigue, para no
// dejar huecos dobles. Se verifica que de verdad estén en blanco.
for (const n of [134, 166, 182, 293]) {
  if (L[n - 1].trim() !== '') throw new Error(`línea ${n} debía estar en blanco: «${L[n - 1]}»`);
}

const bloque = (a, b) => L.slice(a - 1, b);
const exportar = (lineas, firma) => lineas.map((l) => (l.startsWith(firma) ? `export ${l}` : l));

const constante = bloque(132, 133);
const update = exportar(bloque(139, 165), 'async function updateLeadLocal(');
const compact = exportar(bloque(167, 181), 'function compactFormData(');
const push = exportar(bloque(198, 292), 'async function pushToZoho(');

fs.writeFileSync('src/lib/leads/compact-form-data.ts', [
  "import type { FormData } from '@/lib/zoho/field-maps';",
  '',
  ...compact,
  '',
].join(EOL));

fs.writeFileSync('src/lib/leads/registrar-lead.ts', [
  '// ============================================================',
  '// Motor compartido de captación: push a Zoho con nota en duplicados y',
  '// UPDATE local con reintento. Lo usan /api/leads y el webhook del sitio de',
  '// Avica. Movido de src/app/api/leads/route.ts sin cambios de conducta.',
  '// ============================================================',
  '',
  "import type { createServiceRoleClient } from '@/lib/supabase/server';",
  "import { sanitizeErrorMessage } from '@/lib/security/sanitize-error';",
  "import { getZohoClient } from '@/lib/zoho/client';",
  'import {',
  '  composeDuplicateNote,',
  '  extractDuplicateLeadId,',
  '  truncateError,',
  '  type FormData,',
  '  type LeadSource,',
  '  type Locale,',
  '  type UtmData,',
  "} from '@/lib/zoho/field-maps';",
  "import type { ZohoAccount, ZohoLead } from '@/lib/zoho/types';",
  '',
  ...constante,
  '',
  'async function sleep(ms: number): Promise<void> {',
  '  return new Promise((resolve) => setTimeout(resolve, ms));',
  '}',
  '',
  ...update,
  '',
  ...push,
  '',
].join(EOL));

// Se quitan de abajo hacia arriba para no mover los números de línea.
// Cada rango incluye la línea en blanco que sigue al bloque.
const resto = [...L];
resto.splice(197, 293 - 198 + 1);   // pushToZoho 198-292 + blanca 293
resto.splice(166, 182 - 167 + 1);   // compactFormData 167-181 + blanca 182
resto.splice(138, 166 - 139 + 1);   // updateLeadLocal 139-165 + blanca 166
resto.splice(131, 134 - 132 + 1);   // LOCAL_UPDATE_DELAYS_MS 132-133 + blanca 134
fs.writeFileSync(RUTA, resto.join(EOL));
console.log('movido');
EOF
```

Expected: imprime `movido`. `sleep` se queda en `route.ts` porque la usa el honeypot. La
copia en `registrar-lead.ts` es privada.

- [ ] **Step 4: Ajustar los imports de `route.ts`**

En `src/app/api/leads/route.ts`, sustituye

```ts
import { getZohoClient } from '@/lib/zoho/client';
import {
  composeDuplicateNote,
  extractDuplicateLeadId,
  faltanDatosDeContacto,
  sourceToZohoPayload,
  truncateError,
  type FormData,
  type LeadSource,
  type Locale,
  type UtmData,
} from '@/lib/zoho/field-maps';
```

por:

```ts
import { compactFormData } from '@/lib/leads/compact-form-data';
import { pushToZoho } from '@/lib/leads/registrar-lead';
import {
  faltanDatosDeContacto,
  sourceToZohoPayload,
  type FormData,
  type LeadSource,
  type Locale,
  type UtmData,
} from '@/lib/zoho/field-maps';
```

y borra la línea `import type { ZohoLead, ZohoAccount } from '@/lib/zoho/types';`.

- [ ] **Step 5: Run tests, types and lint**

Run: `npx vitest run src/lib/leads/compact-form-data.test.ts`
Expected: PASS (2 tests).

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores ni imports sin usar. Si el lint marca un import sin uso en `route.ts`
que sí se quitó con el código movido, bórralo. Ninguna otra edición.

Run: `git diff --stat`
Expected: `route.ts` pierde unas 150 líneas, sin tocar el cuerpo de `POST`, y se crean los
dos archivos nuevos.

- [ ] **Step 6: Commit**

```bash
git add src/lib/leads/compact-form-data.ts src/lib/leads/compact-form-data.test.ts src/lib/leads/registrar-lead.ts src/app/api/leads/route.ts
git commit -m "refactor(leads): extraer pushToZoho y compactFormData de /api/leads" -m "Sin cambio de conducta: el webhook del sitio de Avica usa el mismo motor." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Una sola decisión del proyecto para la ruta y el cron

**Files:**
- Modify: `src/lib/zoho/resolve-proyecto-interes.ts` (extrae `zohoIdDeDesarrollo`, agrega `resolverProyectoZoho`)
- Modify: `src/app/api/cron/zoho-retry/route.ts` (usa `resolverProyectoZoho`)
- Test: `src/lib/zoho/resolver-proyecto.test.ts`
- Test: `src/lib/webflow-avica/reintento.test.ts`

**Interfaces:**
- Consumes:
  - Tarea 1: `hubIdAvica`.
  - Tarea 2: `LeadSource`, `FormData`, `sourceToZohoPayload`.
  - Tarea 3: `leerEnvio`, `aFormData`.
  - Tarea 4: `compactFormData`.
- Produces:
  - `zohoIdDeDesarrollo(hubId: string): Promise<string | null>`
  - `resolverProyectoZoho(supabase: unknown, source: LeadSource, data: FormData, buscar?: (hubId: string) => Promise<string | null>): Promise<string | undefined>`

- [ ] **Step 1: Write the failing tests**

`src/lib/zoho/resolver-proyecto.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolverProyectoZoho } from './resolve-proyecto-interes';

const YAXNAH_HUB = '76dfb7d5-4755-4938-8bf2-07aed5d2df15';
const ZOHO_YAXNAH = '6040986000097746005';

/** Mapa falso Hub → Zoho: registra a quién le preguntaron. */
function mapaFalso(mapa: Record<string, string>) {
  const preguntas: string[] = [];
  const buscar = async (hubId: string) => {
    preguntas.push(hubId);
    return mapa[hubId] ?? null;
  };
  return { buscar, preguntas };
}

describe('resolverProyectoZoho', () => {
  it('avica_contacto: la ficha → desarrollo del Hub → id de Zoho', async () => {
    const { buscar, preguntas } = mapaFalso({ [YAXNAH_HUB]: ZOHO_YAXNAH });
    const id = await resolverProyectoZoho(
      null, 'avica_contacto',
      { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah' },
      buscar,
    );
    expect(id).toBe(ZOHO_YAXNAH);
    expect(preguntas).toEqual([YAXNAH_HUB]);
  });

  it('avica_contacto sin ficha: decide el interés', async () => {
    const { buscar } = mapaFalso({ [YAXNAH_HUB]: ZOHO_YAXNAH });
    expect(
      await resolverProyectoZoho(null, 'avica_contacto', { page: 'https://www.avicainmobiliaria.com.mx/', interestOption: 'casa' }, buscar),
    ).toBe(ZOHO_YAXNAH);
  });

  it('sin desarrollo del Hub no se consulta el mapa', async () => {
    const { buscar, preguntas } = mapaFalso({});
    expect(
      await resolverProyectoZoho(null, 'avica_contacto', { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/real-caucel' }, buscar),
    ).toBeUndefined();
    expect(preguntas).toEqual([]);
  });

  it('el mapa sin id de Zoho → sin proyecto, sin fallar', async () => {
    const { buscar } = mapaFalso({});
    expect(
      await resolverProyectoZoho(null, 'avica_contacto', { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah' }, buscar),
    ).toBeUndefined();
  });

  it('broker, newsletter y las fuentes de propyte.com sin unidad → sin proyecto', async () => {
    const { buscar, preguntas } = mapaFalso({ [YAXNAH_HUB]: ZOHO_YAXNAH });
    const ficha = { page: 'https://www.avicainmobiliaria.com.mx/desarrollos/yaxnah', interestOption: 'casa' };
    expect(await resolverProyectoZoho(null, 'avica_broker', ficha, buscar)).toBeUndefined();
    expect(await resolverProyectoZoho(null, 'avica_newsletter', ficha, buscar)).toBeUndefined();
    expect(await resolverProyectoZoho(null, 'contact', ficha, buscar)).toBeUndefined();
    expect(await resolverProyectoZoho(null, 'property_inquiry', {}, buscar)).toBeUndefined();
    expect(preguntas).toEqual([]);
  });
});
```

`src/lib/webflow-avica/reintento.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { compactFormData } from '@/lib/leads/compact-form-data';
import { sourceToZohoPayload, type FormData } from '@/lib/zoho/field-maps';
import { resolverProyectoZoho } from '@/lib/zoho/resolve-proyecto-interes';
import { aFormData, leerEnvio, type EnvioAvica } from './envio';

/**
 * El cron /api/cron/zoho-retry reconstruye el payload desde `leads.form_data`
 * (`{ ...form_data }`). Si un dato de Avica no sobrevive a ese viaje, el lead
 * rescatado llega a Zoho mutilado: el hueco que ya mordió en /unete con el
 * teléfono. Aquí se simula el viaje completo.
 */
describe('un lead de Avica rescatado por el cron llega igual que por el push directo', () => {
  it('conserva proyecto, ciudad, interés, cómo nos conoció y casilla', async () => {
    const envio = leerEnvio({
      triggerType: 'form_submission',
      payload: {
        name: 'Email Footer',
        publishedPath: '/desarrollos/yaxnah',
        data: {
          nombre: 'Ana María Ruiz', tel: '9991234567', correo: 'ana@example.com', ciudad: 'Mérida',
          interes_en: 'broker', nos_encontro_en: 'referencias', mensaje: 'Tengo clientes', es_broker: 'true',
        },
      },
    }) as EnvioAvica;
    const directo = aFormData(envio);
    const reconstruido = { ...JSON.parse(JSON.stringify(compactFormData(directo))) } as FormData;
    const buscar = async () => '6040986000097746005';

    for (const fuente of ['avica_contacto', 'avica_broker'] as const) {
      const a = sourceToZohoPayload(fuente, directo, 'es', {}, await resolverProyectoZoho(null, fuente, directo, buscar));
      const b = sourceToZohoPayload(fuente, reconstruido, 'es', {}, await resolverProyectoZoho(null, fuente, reconstruido, buscar));
      expect(b).toEqual(a);
    }
    const contacto = sourceToZohoPayload(
      'avica_contacto', reconstruido, 'es', {},
      await resolverProyectoZoho(null, 'avica_contacto', reconstruido, buscar),
    );
    expect(contacto.lead.Proyecto_de_Interes).toEqual([{ id: '6040986000097746005' }]);
    expect(contacto.lead.City).toBe('Mérida');
    expect(contacto.lead.Description).toContain('Marcó «¿Eres broker inmobiliario?»');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/zoho/resolver-proyecto.test.ts src/lib/webflow-avica/reintento.test.ts`
Expected: FAIL. `resolverProyectoZoho is not a function` (o no se exporta).

- [ ] **Step 3: Implement**

En `src/lib/zoho/resolve-proyecto-interes.ts`, agrega los imports después de
`import { createClient, type SupabaseClient } from "@supabase/supabase-js";`:

```ts
import { hubIdAvica } from "@/lib/webflow-avica/etiquetas";
import type { FormData, LeadSource } from "@/lib/zoho/field-maps";
```

Sustituye el «Paso 2» de `resolveProyectoDeInteres`, desde
`  // Paso 2: development_id (uuid) → zoho_record_id (text) vía id_map` hasta
`  return mapping.zoho_record_id as string;` inclusive, por:

```ts
  // Paso 2: development_id (uuid) → zoho_record_id (text) vía id_map
  return zohoIdDeDesarrollo(String(unit.development_id));
```

Al final del archivo agrega:

```ts
/**
 * `Propyte_desarrollos.id` → id del registro en Zoho, vía Propyte_zoho_id_map.
 * null si no hay cliente, no hay mapeo o la consulta falla: nunca tumba un lead.
 */
export async function zohoIdDeDesarrollo(hubId: string): Promise<string | null> {
  if (!hubId) return null;
  const hub = getRealEstateHubClient();
  if (!hub) return null;

  // supabase_id en id_map es TEXT, no UUID (ver notas arriba).
  const { data: mapping, error: mapErr } = await hub
    .from("Propyte_zoho_id_map")
    .select("zoho_record_id")
    .eq("supabase_id", hubId)
    .eq("entity_type", "development")
    .maybeSingle<{ zoho_record_id: string | null }>();

  if (mapErr || !mapping?.zoho_record_id) return null;
  return mapping.zoho_record_id;
}

/**
 * Proyecto_de_Interes de un lead, decidido en UN solo lugar para /api/leads,
 * el webhook del sitio de Avica y el cron de reintento. Si la decisión
 * viviera solo en una ruta, el lead rescatado por el cron llegaría sin
 * proyecto: el mismo hueco que mordió en /unete con el teléfono.
 *
 * @param buscar Inyectable para pruebas; en producción, zohoIdDeDesarrollo.
 */
export async function resolverProyectoZoho(
  supabase: unknown,
  source: LeadSource,
  data: FormData,
  buscar: (hubId: string) => Promise<string | null> = zohoIdDeDesarrollo,
): Promise<string | undefined> {
  if (source === "property_inquiry") {
    if (!data.propertyId) return undefined;
    return (await resolveProyectoDeInteres(supabase, data.propertyId)) ?? undefined;
  }
  if (source === "avica_contacto") {
    const hubId = hubIdAvica(data.page, data.interestOption);
    if (!hubId) return undefined;
    return (await buscar(hubId)) ?? undefined;
  }
  return undefined;
}
```

En `src/app/api/cron/zoho-retry/route.ts`, sustituye

```ts
  let zohoDevelopmentId: string | undefined;
  if (source === 'property_inquiry' && row.property_id) {
    const resolved = await resolveProyectoDeInteres(supabase, row.property_id);
    if (resolved) zohoDevelopmentId = resolved;
  }
```

por:

```ts
  // La misma decisión que el push directo: si viviera solo en la ruta, el lead
  // rescatado aquí llegaría sin proyecto. `formData.propertyId` ya cae a
  // `row.property_id` en filas viejas sin form_data.
  const zohoDevelopmentId = await resolverProyectoZoho(supabase, source as LeadSource, formData);
```

y en sus imports sustituye
`import { resolveProyectoDeInteres } from '@/lib/zoho/resolve-proyecto-interes';` por
`import { resolverProyectoZoho } from '@/lib/zoho/resolve-proyecto-interes';`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/zoho src/lib/webflow-avica src/app/api/cron`
Expected: PASS.

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/zoho/resolve-proyecto-interes.ts src/lib/zoho/resolver-proyecto.test.ts src/lib/webflow-avica/reintento.test.ts src/app/api/cron/zoho-retry/route.ts
git commit -m "feat(leads): proyecto de interés decidido en una sola función para la ruta y el cron" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Manejador del webhook (dependencias inyectadas)

**Files:**
- Create: `src/lib/webflow-avica/manejador.ts`
- Test: `src/lib/webflow-avica/manejador.test.ts`

**Interfaces:**
- Consumes (Tarea 3): `leerEnvio`, `motivoDescarte`, `fuenteAvica`, `aFormData`, `FuenteAvica`.
- Produces:
  - `type ResultadoProceso = 'guardado' | 'omitido'`
  - `interface DepsWebhookAvica { token: string; procesar: (fuente: FuenteAvica, datos: FormData) => Promise<ResultadoProceso>; registrar: (linea: string) => void }`
  - `manejarWebhookAvica(req: Request, deps: DepsWebhookAvica): Promise<Response>`

- [ ] **Step 1: Write the failing test**

`src/lib/webflow-avica/manejador.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import type { FormData } from '@/lib/zoho/field-maps';
import type { FuenteAvica } from './envio';
import { manejarWebhookAvica, type DepsWebhookAvica, type ResultadoProceso } from './manejador';

const TOKEN = 'token-largo-de-prueba-0123456789abcdef';
const URL_BASE = 'https://propyte.com/api/webhooks/webflow-avica';

const CONTACTO = {
  triggerType: 'form_submission',
  payload: {
    name: 'Email Footer',
    publishedPath: '/contacto',
    data: { nombre: 'Ana Ruiz', tel: '9991234567', correo: 'ana@example.com', interes_en: 'casa', mensaje: 'Hola' },
  },
};

let llamadas: Array<{ fuente: FuenteAvica; datos: FormData }>;
let bitacora: string[];

function deps(extra: Partial<DepsWebhookAvica> = {}, resultado: ResultadoProceso = 'guardado'): DepsWebhookAvica {
  return {
    token: TOKEN,
    procesar: async (fuente, datos) => {
      llamadas.push({ fuente, datos });
      return resultado;
    },
    registrar: (linea) => bitacora.push(linea),
    ...extra,
  };
}

function peticion(cuerpo: unknown, token: string | null = TOKEN) {
  const url = token === null ? URL_BASE : `${URL_BASE}?token=${encodeURIComponent(token)}`;
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
}

const conDatos = (data: Record<string, unknown>, name = 'Email Footer') => ({
  triggerType: 'form_submission',
  payload: { name, data },
});

beforeEach(() => {
  llamadas = [];
  bitacora = [];
});

describe('manejarWebhookAvica', () => {
  it('con token correcto guarda el contacto y responde 200', async () => {
    const res = await manejarWebhookAvica(peticion(CONTACTO), deps());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resultado: 'guardado' });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].fuente).toBe('avica_contacto');
    expect(llamadas[0].datos).toMatchObject({ email: 'ana@example.com', page: 'https://www.avicainmobiliaria.com.mx/contacto' });
  });

  it('sin token, con token incorrecto o de otra longitud → 401 sin procesar', async () => {
    for (const token of [null, 'x'.repeat(TOKEN.length), 'corto']) {
      const res = await manejarWebhookAvica(peticion(CONTACTO, token), deps());
      expect(res.status).toBe(401);
    }
    expect(llamadas).toEqual([]);
  });

  it('sin token configurado en el servidor no acepta nada (503)', async () => {
    const res = await manejarWebhookAvica(peticion(CONTACTO), deps({ token: '' }));
    expect(res.status).toBe(503);
    expect(llamadas).toEqual([]);
  });

  it('JSON roto, otro evento u otro formulario → 200 «ignorado» (si no, Webflow reintenta)', async () => {
    const cuerpos = [
      '{roto',
      { triggerType: 'site_publish', payload: {} },
      conDatos({ correo: 'ana@example.com' }, 'Formulario nuevo'),
    ];
    for (const cuerpo of cuerpos) {
      const res = await manejarWebhookAvica(peticion(cuerpo), deps());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ resultado: 'ignorado' });
    }
    expect(llamadas).toEqual([]);
  });

  it('el spam responde 200 «descartado» y no se procesa', async () => {
    const spam = conDatos({ nombre: 'Promo', correo: 'x@ejemplo.top', mensaje: 'visita https://ejemplo.top' });
    const res = await manejarWebhookAvica(peticion(spam), deps());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resultado: 'descartado', motivo: 'enlaces' });
    const trampa = conDatos({ nombre: 'Ana', correo: 'ana@example.com', campo_extra_hp: 'bot' });
    expect(await (await manejarWebhookAvica(peticion(trampa), deps())).json()).toEqual({ resultado: 'descartado', motivo: 'trampa' });
    expect(llamadas).toEqual([]);
  });

  it('newsletter y broker llegan con su fuente', async () => {
    await manejarWebhookAvica(peticion(conDatos({ correo_newsletter: 'lector@example.com' }, 'Email Form')), deps());
    await manejarWebhookAvica(peticion(conDatos({ nombre: 'Luis', correo: 'luis@example.com', 'Field 8': 'true' })), deps());
    expect(llamadas.map((l) => l.fuente)).toEqual(['avica_newsletter', 'avica_broker']);
  });

  it('sin datos de contacto → 200 «omitido» (la fila se guarda, no va a Zoho)', async () => {
    const res = await manejarWebhookAvica(peticion(CONTACTO), deps({}, 'omitido'));
    expect(await res.json()).toEqual({ resultado: 'omitido' });
  });

  it('si no se pudo guardar → 500 para que Webflow reintente', async () => {
    const res = await manejarWebhookAvica(
      peticion(CONTACTO),
      deps({ procesar: async () => { throw new Error('leads.insert.failed'); } }),
    );
    expect(res.status).toBe(500);
  });

  it('una línea de bitácora por envío, sin datos personales', async () => {
    await manejarWebhookAvica(peticion(CONTACTO), deps());
    await manejarWebhookAvica(peticion(CONTACTO, 'malo'), deps());
    expect(bitacora).toHaveLength(2);
    expect(bitacora[0]).toMatch(/^\[webflow-avica\] guardado fuente=avica_contacto/);
    expect(bitacora.join('\n')).not.toMatch(/ana|ruiz|9991234567|example\.com/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/webflow-avica/manejador.test.ts`
Expected: FAIL. `Failed to resolve import "./manejador"`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/webflow-avica/manejador.ts`:

```ts
// ============================================================
// Webhook form_submission del sitio de Avica — decisión de la respuesta
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md §6
//
// Webflow reintenta (3 veces, cada 10 min) todo lo que no sea 200 y desactiva
// el webhook si los fallos se repiten. Por eso solo se responde error cuando
// un reintento puede servir: no se pudo guardar el lead.
// ============================================================

import { timingSafeEqual } from 'node:crypto';
import type { FormData } from '@/lib/zoho/field-maps';
import { aFormData, fuenteAvica, leerEnvio, motivoDescarte, type FuenteAvica } from './envio';

export type ResultadoProceso = 'guardado' | 'omitido';

export interface DepsWebhookAvica {
  /** WEBFLOW_AVICA_WEBHOOK_TOKEN. Vacío = sin configurar: no se acepta nada. */
  token: string;
  /** Guarda en public.leads y empuja a Zoho. Lanza SOLO si no se pudo guardar. */
  procesar: (fuente: FuenteAvica, datos: FormData) => Promise<ResultadoProceso>;
  /** Una línea por envío, sin datos personales. */
  registrar: (linea: string) => void;
}

const responder = (cuerpo: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * El webhook lo crea el conector MCP de Webflow, que lo firma con el secreto de
 * su app OAuth (inverificable para nosotros): se autentica con un token en la
 * URL. timingSafeEqual lanza con longitudes distintas, por eso se comparan antes.
 */
function tokenValido(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function manejarWebhookAvica(req: Request, deps: DepsWebhookAvica): Promise<Response> {
  const log = (linea: string) => deps.registrar(`[webflow-avica] ${linea}`);

  if (!deps.token) {
    log('sin_configurar');
    return responder({ resultado: 'sin_configurar' }, 503);
  }
  if (!tokenValido(new URL(req.url).searchParams.get('token'), deps.token)) {
    log('no_autorizado');
    return responder({ resultado: 'no_autorizado' }, 401);
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(await req.text());
  } catch {
    log('ignorado motivo=json');
    return responder({ resultado: 'ignorado' });
  }

  const envio = leerEnvio(cuerpo);
  if (!envio) {
    log('ignorado motivo=evento');
    return responder({ resultado: 'ignorado' });
  }
  const fuente = fuenteAvica(envio);
  if (!fuente) {
    // El nombre del formulario lo configura Avica en Webflow, no el visitante.
    log(`ignorado formulario=${envio.formulario.slice(0, 60)}`);
    return responder({ resultado: 'ignorado' });
  }

  const motivo = motivoDescarte(envio);
  if (motivo) {
    log(`descartado motivo=${motivo} fuente=${fuente}`);
    return responder({ resultado: 'descartado', motivo });
  }

  try {
    const resultado = await deps.procesar(fuente, aFormData(envio));
    log(`${resultado} fuente=${fuente}`);
    return responder({ resultado });
  } catch {
    // El detalle (sin datos personales) lo registra procesar.
    log(`error_guardado fuente=${fuente}`);
    return responder({ resultado: 'error' }, 500);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/webflow-avica/manejador.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/webflow-avica/manejador.ts src/lib/webflow-avica/manejador.test.ts
git commit -m "feat(leads): manejador del webhook del sitio de Avica" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: La ruta: Supabase + Zoho, sin Conversions API

**Files:**
- Create: `src/lib/webflow-avica/procesar.ts`
- Create: `src/app/api/webhooks/webflow-avica/route.ts`
- Modify: `.env.example`
- Modify: `docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md` (§4 componentes y §6 respuestas: dos ajustes de la implementación)
- Test: `src/lib/webflow-avica/sin-capi.test.ts`

**Interfaces:**
- Consumes:
  - Tarea 2: `faltanDatosDeContacto`, `sourceToZohoPayload`, `FormData`, `UtmData`.
  - Tarea 4: `compactFormData`, `pushToZoho`.
  - Tarea 5: `resolverProyectoZoho`.
  - Tarea 6: `manejarWebhookAvica`, `ResultadoProceso`.
- Produces:
  - `procesarEnvioAvica(fuente: FuenteAvica, datos: FormData): Promise<ResultadoProceso>`
  - `POST` en `/api/webhooks/webflow-avica`

- [ ] **Step 1: Write the failing test**

`src/lib/webflow-avica/sin-capi.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Luis, 2026-10-14: los leads de Avica NO cuentan como conversiones de
 * Propyte. Del lado de Zoho, la regla «Enviar Lead a Meta CAPI» ya excluye
 * «Sitio Avica»; este lado no debe mandarlos por su cuenta.
 */
const ARCHIVOS = [
  'src/app/api/webhooks/webflow-avica/route.ts',
  'src/lib/webflow-avica/manejador.ts',
  'src/lib/webflow-avica/procesar.ts',
  'src/lib/webflow-avica/envio.ts',
  'src/lib/leads/registrar-lead.ts',
];

describe('el camino del sitio de Avica no usa la Conversions API de Meta', () => {
  it.each(ARCHIVOS)('%s existe y no importa @/lib/meta/capi', (archivo) => {
    expect(existsSync(archivo)).toBe(true);
    expect(readFileSync(archivo, 'utf8')).not.toMatch(/meta\/capi|sendCAPIEvents/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/webflow-avica/sin-capi.test.ts`
Expected: FAIL en `route.ts` y `procesar.ts` (`existsSync` → false).

- [ ] **Step 3: Implement `procesar.ts`**

`src/lib/webflow-avica/procesar.ts`:

```ts
// ============================================================
// Sitio de Avica → public.leads → Zoho de Propyte
// Mismo motor que /api/leads: la fila se guarda ANTES de Zoho (audit-first),
// pushToZoho anota duplicados, y el cron rescata lo que falle.
// NO manda nada a Meta: los leads de Avica no son conversiones de Propyte.
// ============================================================

import { compactFormData } from '@/lib/leads/compact-form-data';
import { pushToZoho } from '@/lib/leads/registrar-lead';
import { sanitizeErrorMessage } from '@/lib/security/sanitize-error';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { faltanDatosDeContacto, sourceToZohoPayload, type FormData, type UtmData } from '@/lib/zoho/field-maps';
import { resolverProyectoZoho } from '@/lib/zoho/resolve-proyecto-interes';
import type { FuenteAvica } from './envio';
import type { ResultadoProceso } from './manejador';

/** El webhook de Webflow no trae UTM ni click IDs. */
const SIN_UTMS: UtmData = {};

export async function procesarEnvioAvica(fuente: FuenteAvica, datos: FormData): Promise<ResultadoProceso> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error(JSON.stringify({ event: 'webflow-avica.supabase-misconfigured' }));
    throw new Error('supabase_sin_configurar');
  }

  const fila = {
    name: datos.name ?? null,
    email: datos.email ?? null,
    phone: datos.phone ?? null,
    message: datos.message ?? null,
    source: fuente,
    intake_status: 'nuevo',
    locale: 'es',
    form_data: compactFormData(datos),
  };

  // Misma guardia que /api/leads y el cron: un lead sin con qué contactarlo
  // se guarda como evidencia pero no se empuja a Zoho.
  if (faltanDatosDeContacto(fuente, datos)) {
    const { error } = await supabase
      .from('leads')
      .insert({ ...fila, zoho_sync_error: 'SKIPPED: sin datos de contacto' });
    if (error) {
      console.error(JSON.stringify({ event: 'webflow-avica.insert.failed', source: fuente, error: sanitizeErrorMessage(error) }));
      throw new Error('leads.insert.failed');
    }
    return 'omitido';
  }

  const zohoDevelopmentId = await resolverProyectoZoho(supabase, fuente, datos);
  const payload = sourceToZohoPayload(fuente, datos, 'es', SIN_UTMS, zohoDevelopmentId);

  const { data: guardado, error } = await supabase
    .from('leads')
    .insert({
      ...fila,
      nombre_campana: payload.lead.Nombre_de_Campa_a ?? null,
      nombre_formulario: payload.lead.Nombre_del_formulario ?? null,
      zoho_sync_error: 'PENDING_SYNC',
    })
    .select('id')
    .single();
  if (error || !guardado) {
    console.error(JSON.stringify({ event: 'webflow-avica.insert.failed', source: fuente, error: sanitizeErrorMessage(error) }));
    throw new Error('leads.insert.failed');
  }

  // Ya está guardado: si Zoho falla, el cron lo rescata y a Webflow se le
  // responde 200 (un reintento suyo solo duplicaría la fila).
  try {
    await pushToZoho(supabase, guardado.id, fuente, payload, { data: datos, locale: 'es', utms: SIN_UTMS });
  } catch (err) {
    console.error(JSON.stringify({ event: 'webflow-avica.push-zoho.uncaught', lead_id: guardado.id, error: sanitizeErrorMessage(err) }));
  }
  return 'guardado';
}
```

- [ ] **Step 4: Implement la ruta y `.env.example`**

`src/app/api/webhooks/webflow-avica/route.ts`:

```ts
import { enforceGlobalQuota } from '@/lib/security/global-quota';
import { manejarWebhookAvica } from '@/lib/webflow-avica/manejador';
import { procesarEnvioAvica } from '@/lib/webflow-avica/procesar';

// ============================================================
// POST /api/webhooks/webflow-avica — formularios del sitio de Avica (Webflow)
// hacia el Zoho de Propyte.
// Spec: docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md
//
// Sin allowlist de Origin ni límite por IP: lo llama el servidor de Webflow
// desde pocas IP, y un 429 dispararía sus reintentos. La barrera es el token.
// El token se lee en cada petición, así que basta reiniciar la app al
// cambiarlo; no hace falta recompilar.
// ============================================================

export async function POST(request: Request): Promise<Response> {
  const cuota = enforceGlobalQuota();
  if (cuota) return cuota;
  return manejarWebhookAvica(request, {
    token: process.env.WEBFLOW_AVICA_WEBHOOK_TOKEN ?? '',
    procesar: procesarEnvioAvica,
    registrar: (linea) => console.info(linea),
  });
}
```

En `.env.example`, después de la línea `CRON_SECRET=your-cron-secret-min-32-chars`, agrega:

```
# Webhook form_submission del sitio de Avica (Webflow) → /api/webhooks/webflow-avica.
# Token largo y aleatorio; el mismo valor va en la URL del webhook (?token=).
WEBFLOW_AVICA_WEBHOOK_TOKEN=
```

- [ ] **Step 5: Ajustar la especificación a lo implementado**

En `docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md`:

**§4, tabla de componentes:** sustituye la fila que empieza con `` | `src/lib/leads/registrar-lead.ts` `` por:

```markdown
| `src/lib/leads/registrar-lead.ts` + `src/lib/leads/compact-form-data.ts` | `updateLeadLocal` y `pushToZoho` (y `compactFormData`, puro), **movidos** de `src/app/api/leads/route.ts` sin cambiar su conducta. Cada llamador hace su propio INSERT: las columnas difieren (UTM, QR, `property_id`) | Extraído |
```

**§4, misma tabla:** sustituye la fila del receptor
(`` | `src/app/api/webhooks/webflow-avica/route.ts` ``) por estas tres:

```markdown
| `src/lib/webflow-avica/manejador.ts` | Decide la respuesta a Webflow (token, ignorado, descartado, 500). Recibe `procesar` inyectado: se prueba sin Supabase ni Zoho | Nuevo |
| `src/lib/webflow-avica/procesar.ts` | INSERT + `resolverProyectoZoho` + `pushToZoho`. No importa nada de Meta | Nuevo |
| `src/app/api/webhooks/webflow-avica/route.ts` | Conecta cuota global, token del entorno y `procesar` | Nuevo |
```

**§6, tabla de respuestas:** sustituye la fila `| Éxito / duplicado | 200 \`creado\` / \`nota\` | Sí | Lead / nota |` por:

```markdown
| Éxito / duplicado | 200 `guardado` (el resultado de Zoho queda en `zoho_lead_id` / `zoho_sync_error`) | Sí | Lead / nota |
```

- [ ] **Step 5b: Ajustar el componente `route.ts` en la especificación**

En el mismo archivo, borra la mención `` `dynamic = 'force-dynamic'` (lee el token en tiempo de ejecución) ``
si quedó en alguna fila: los route handlers con `POST` no se cachean y el token se lee en cada
petición.

Run: `grep -n "force-dynamic" docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md`
Expected: sin resultados.

- [ ] **Step 6: Run tests, types and lint**

Run: `npx vitest run src/lib/webflow-avica`
Expected: PASS, incluido `sin-capi` (5 archivos).

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores. Si el tipo de `supabase.from('leads').insert(...)` reclama alguna
columna, compárala con el INSERT de `src/app/api/leads/route.ts`. Las columnas usadas
(`name`, `email`, `phone`, `message`, `source`, `intake_status`, `locale`, `form_data`,
`nombre_campana`, `nombre_formulario`, `zoho_sync_error`) existen todas ahí.

- [ ] **Step 7: Commit**

```bash
git add src/lib/webflow-avica/procesar.ts src/lib/webflow-avica/sin-capi.test.ts src/app/api/webhooks/webflow-avica/route.ts .env.example docs/superpowers/specs/2026-10-14-leads-avica-webflow-propyte-design.md
git commit -m "feat(leads): POST /api/webhooks/webflow-avica hacia el Zoho de Propyte" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Verificación completa y PR

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite, tipos, lint y build**

Run: `npm run test:unit`
Expected: PASS en toda la suite. Cualquier fallo, aunque sea ajeno, se reporta por nombre.

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

Run: `npm run build`
Expected: termina sin errores y la salida lista `ƒ /api/webhooks/webflow-avica`. CI verde no
garantiza que compile; esto es lo que corre Hostinger.

- [ ] **Step 2: Humo local de la ruta**

Arranca el servidor con el `preview_start` de la sesión (no con Bash) y prueba con un token
de prueba **solo en el proceso local**. No escribas `.env*`:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3000/api/webhooks/webflow-avica" -H "Content-Type: application/json" -d '{}'
```

Expected: `503` (sin token configurado en local). Un 404 significa que la ruta no se compiló.

- [ ] **Step 3: Push y PR**

```bash
git push -u origin feat/leads-avica-webflow
```

Crea el PR con `gh`, usando la ruta absoluta de la memoria `reference_gh_cli` (`gh` no está en
el PATH):
- Título: `feat(leads): formularios del sitio de Avica → Zoho de Propyte`.
- Cuerpo:
  - Resumen y enlace a la especificación.
  - Lista de la fase operativa (Tarea 9).
  - Aviso: «`main` = producción: el merge despliega».
  - Última línea: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

Expected: URL del PR. Vincúlalo con las herramientas `ccd_pr`. **El merge lo hace Luis**: el
clasificador bloquea `gh pr merge` y el merge despliega a producción.

---

### Task 9: Fase operativa (después del merge)

No es código. Cada paso que toca producción se confirma al hacerlo.

- [ ] **Step 1: Confirmar el despliegue.** `hosting_nodejs_list-builds` (usuario `u585458211`,
  dominio `propyte.com`) hasta ver el build del commit del merge en `completed`. Después:
  `curl -X POST https://propyte.com/api/webhooks/webflow-avica -d '{}'` → `503`.
- [ ] **Step 2: Token (Luis).**
  - Genera el token (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`)
    y guárdalo en un archivo **ignorado por git** del worktree, por ejemplo
    `.env.produccion.local`, para que Luis lo copie.
  - Luis lo agrega en Hostinger → propyte.com → Node.js → Variables de entorno → **Agregar**.
    Nunca con la herramienta de reemplazo, que borra las demás.
  - Reiniciar con `hosting_nodejs_restart-application`.
  - Verificar: sin token → 401; spam con token → 200 `descartado`; y en `public.leads`
    (`created_at > now() - interval '5 minutes'`) no aparece nada nuevo.
- [ ] **Step 3: Lead PRUEBA de punta a punta**, **con permiso explícito de Luis en ese
  momento**: «AVISO - Lead nuevo» avisa a un asesor.
  - POST con token y un contacto `PRUEBA` desde `/desarrollos/yaxnah`.
  - En el Zoho de Propyte, revisar:
    - Campaña, formulario, `Proyecto_de_Interes` = `6040986000097746005`.
    - `City` guardada (riesgo 1 de la especificación).
    - Asesor asignado por «NUEVAS REGLAS DE INGRESO».
    - Que el webhook de Meta CAPI no se disparó (`ZohoCRM_getWebhookUsageReports` o
      `last_executed_time` de la regla `6040986000091354021`).
  - Mandarlo a la papelera y borrar su fila de `public.leads` (con permiso).
- [ ] **Step 4: Corte del webhook.**
  - Crear el webhook `form_submission` **sin filtro** hacia
    `https://propyte.com/api/webhooks/webflow-avica?token=…`.
  - En el mismo paso, borrar el `6acfba5ad7370a9f2e6a3af5`.
  - `list_webhooks` debe mostrar solo el nuevo.
- [ ] **Step 5: Primera entrega real.** `hosting_nodejs_runtime-logs` de propyte.com hasta ver
  una línea `[webflow-avica] …` de un envío real. Si es `guardado`, revisar el Lead en Zoho.
- [ ] **Step 6: Cierre.**
  - Marcar en `Otros/yaxnah-sitios-web/task_manager.md` lo hecho.
  - Actualizar la memoria `project_yaxnah_sitios_web_auditoria.md` solo con lo no obvio que
    salga en producción.
  - El `/api/sitio/lead` de la app de brokers **no** se borra (spec §7.4).
