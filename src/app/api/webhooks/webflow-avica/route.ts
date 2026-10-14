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
