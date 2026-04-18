/**
 * Supabase Edge Function: Weekly Inventory Snapshot
 *
 * Triggers: pg_cron every Monday 6am UTC, or manual invocation
 * Purpose: Snapshots current inventory state into fact_inventory_weekly
 *          and refreshes materialized views for ML/analytics
 *
 * Invoke manually:
 *   curl -X POST https://<project>.supabase.co/functions/v1/inventory-snapshot \
 *     -H "Authorization: Bearer <service_role_key>"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: Record<string, unknown> = {};

    // 1. Run inventory snapshot
    const { error: snapError } = await supabase.rpc(
      "fn_snapshot_inventory_weekly"
    );
    results.snapshot = snapError
      ? { error: snapError.message }
      : { status: "ok" };

    // 2. Refresh materialized views
    const { error: mvError } = await supabase.rpc(
      "fn_refresh_materialized_views"
    );
    results.materialized_views = mvError
      ? { error: mvError.message }
      : { status: "ok" };

    // 3. Log agent run
    const weekStart = getWeekStart(new Date()).toISOString().slice(0, 10);
    await supabase.from("fact_agent_runs").insert({
      occurred_at: new Date().toISOString(),
      week_start: weekStart,
      agent_type: "inventory_snapshot",
      source: "edge_function",
      status: snapError ? "failed" : "success",
      error_log: snapError ? { error: snapError.message } : null,
    });

    return new Response(JSON.stringify({ success: !snapError, results }), {
      headers: { "Content-Type": "application/json" },
      status: snapError ? 500 : 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
