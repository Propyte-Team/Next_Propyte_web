/**
 * POST /api/revalidate
 * -----------------------------------------------------------
 * Trigger on-demand ISR desde hub.propyte.com al aprobar/editar
 * un desarrollo, unidad o desarrollador.
 *
 * Auth: Bearer token con REVALIDATION_SECRET (compartido Hub ↔ propyte.com).
 *
 * Body:
 *   { tags?: string[], paths?: string[] }
 *
 * Ejemplos de tags/paths que el Hub envía:
 *   tags:  ["desarrollo-akora-residencial", "desarrollos-list"]
 *   paths: ["/es/desarrollos/akora-residencial", "/es/desarrollos"]
 *
 * Ref: SPECKIT § 5.3 · "On-demand ISR trigger"
 */

import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { safeEqualSecret } from "@/lib/security/compareSecret";

export async function POST(req: Request) {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATION_SECRET not configured on server" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!safeEqualSecret(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const tags = Array.isArray(body.tags) ? (body.tags as string[]).filter((t) => typeof t === "string") : [];
  const paths = Array.isArray(body.paths) ? (body.paths as string[]).filter((p) => typeof p === "string") : [];

  const revalidated: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

  for (const tag of tags) {
    try {
      // Next 16: segundo arg es CacheLife profile. { expire: 0 } = invalidate immediate.
      revalidateTag(tag, { expire: 0 });
      revalidated.tags.push(tag);
    } catch {
      // ignore — tag might not exist yet
    }
  }
  for (const path of paths) {
    try {
      revalidatePath(path, "page");
      revalidated.paths.push(path);
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated,
    at: new Date().toISOString(),
  });
}
