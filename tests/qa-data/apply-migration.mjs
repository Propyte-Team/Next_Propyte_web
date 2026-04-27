// Aplica una migration SQL a Supabase via Session Pooler
import { Client } from 'pg';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; })
);

const projectRef = (env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\./)?.[1];
const password = env.SUPABASE_DB_PASSWORD;
if (!projectRef || !password) { console.error('Missing project ref or DB password'); process.exit(1); }

const migrationFile = process.argv[2];
if (!migrationFile) { console.error('Usage: node apply-migration.mjs <path-to.sql>'); process.exit(1); }
const sql = readFileSync(migrationFile, 'utf8');

const hosts = [
  // Session Pooler primary regions
  { host: `aws-1-us-east-2.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
  { host: `aws-0-us-east-2.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
  { host: `aws-1-us-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
  { host: `aws-1-us-west-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
];

let connected = null;
for (const h of hosts) {
  const c = new Client({
    host: h.host, port: h.port, user: h.user, password, database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await c.connect();
    console.log(`✅ Conectado: ${h.host}:${h.port} as ${h.user}`);
    connected = c;
    break;
  } catch (e) {
    console.log(`❌ ${h.host}:${h.port} — ${e.message}`);
    try { await c.end(); } catch {}
  }
}

if (!connected) {
  console.error('\nNo pude conectar a ningún pooler. Necesito el host correcto.');
  console.error('Verifica en Supabase Dashboard → Settings → Database → Connection string (Session Pooler)');
  process.exit(1);
}

console.log(`\nEjecutando ${migrationFile} (${sql.length} chars)...\n`);
try {
  const startTime = Date.now();
  const result = await connected.query(sql);
  const ms = Date.now() - startTime;
  console.log(`\n✅ Migration aplicada en ${ms}ms`);
  if (Array.isArray(result)) {
    result.forEach((r, i) => {
      if (r.command) console.log(`  [${i}] ${r.command} → ${r.rowCount ?? 0} rows`);
    });
  } else if (result.command) {
    console.log(`  ${result.command} → ${result.rowCount ?? 0} rows`);
  }
} catch (e) {
  console.error(`\n❌ ERROR: ${e.message}`);
  if (e.position) {
    const lines = sql.split('\n');
    let cumul = 0, lineNum = 1;
    for (const l of lines) {
      if (cumul + l.length >= e.position) break;
      cumul += l.length + 1;
      lineNum++;
    }
    console.error(`Línea aprox: ${lineNum}`);
    console.error(`  ${lines[lineNum - 1]}`);
  }
  process.exitCode = 1;
} finally {
  await connected.end();
}
