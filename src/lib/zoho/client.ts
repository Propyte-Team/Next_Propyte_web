// ============================================================
// Zoho CRM API Client
// OAuth2 con refresh automático + rate limiting
// ============================================================
//
// ORIGEN: Copiado de propyte-crm/src/lib/zoho/client.ts (commit base 2026-04-02).
// Probado en producción con 20K records sincronizados.
//
// Diferencia vs propyte-crm: en Z5.0 agregaremos un wrapper `findLeadByEmail`
// sobre searchRecords() (5 líneas — usado por el cron retry para evitar duplicar
// Leads cuando un PENDING_SYNC se reintenta y Zoho ya recibió la primera POST).
//
// Spec: Next_Propyte_web/specs/web-forms-zoho-integration.md (v1.5).

import type {
  ZohoTokenResponse,
  ZohoRecord,
  ZohoRecordResponse,
  ZohoUpsertResponse,
} from "./types";

// --- Rate Limiter ---

class RateLimiter {
  private callCount = 0;
  private dayStart = Date.now();
  private readonly dailyLimit: number;

  constructor(dailyLimit: number) {
    this.dailyLimit = dailyLimit;
  }

  canMakeCall(): boolean {
    this.resetIfNewDay();
    return this.callCount < this.dailyLimit;
  }

  recordCall(): void {
    this.resetIfNewDay();
    this.callCount++;
  }

  getCallsToday(): number {
    this.resetIfNewDay();
    return this.callCount;
  }

  getRemainingCalls(): number {
    this.resetIfNewDay();
    return Math.max(0, this.dailyLimit - this.callCount);
  }

  private resetIfNewDay(): void {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    if (now - this.dayStart >= msInDay) {
      this.callCount = 0;
      this.dayStart = now;
    }
  }
}

// --- Zoho Client ---

let cachedClient: ZohoClient | null = null;

export function getZohoClient(): ZohoClient {
  if (cachedClient) return cachedClient;

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const apiBase = process.env.ZOHO_API_BASE_URL || "https://www.zohoapis.com/crm/v2";
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";
  const dailyLimit = parseInt(process.env.ZOHO_DAILY_API_LIMIT || "2000", 10);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "[ZOHO] Missing env vars: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN",
    );
  }

  cachedClient = new ZohoClient({
    clientId,
    clientSecret,
    refreshToken,
    apiBase,
    accountsUrl,
    dailyLimit,
  });

  return cachedClient;
}

interface ZohoClientConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiBase: string;
  accountsUrl: string;
  dailyLimit: number;
}

export class ZohoClient {
  private config: ZohoClientConfig;
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private rateLimiter: RateLimiter;

  constructor(config: ZohoClientConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.dailyLimit);
  }

  // --- Token Management ---

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.accessToken;
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
    });

    const res = await fetch(
      `${this.config.accountsUrl}/oauth/v2/token`,
      { method: "POST", body: params },
    );

    if (!res.ok) {
      throw new Error(`[ZOHO] Token refresh failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as ZohoTokenResponse;

    if (data.error) {
      throw new Error(`[ZOHO] Token refresh error: ${data.error}`);
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }

  // --- Rate Limit Info ---

  getCallsToday(): number {
    return this.rateLimiter.getCallsToday();
  }

  getRemainingCalls(): number {
    return this.rateLimiter.getRemainingCalls();
  }

  getDailyLimit(): number {
    return this.config.dailyLimit;
  }

  // --- Core API Methods ---

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.rateLimiter.canMakeCall()) {
      throw new Error(
        `[ZOHO] Daily API rate limit reached (${this.config.dailyLimit}). Retry tomorrow.`,
      );
    }

    const token = await this.getAccessToken();

    const res = await fetch(`${this.config.apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    this.rateLimiter.recordCall();

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `[ZOHO] API ${method} ${path} failed: ${res.status} — ${errorText}`,
      );
    }

    if (res.status === 204) return {} as T;

    return (await res.json()) as T;
  }

  async getRecords(
    module: string,
    options: {
      page?: number;
      perPage?: number;
      modifiedSince?: string;
      fields?: string[];
    } = {},
  ): Promise<ZohoRecordResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    params.set("per_page", String(options.perPage || 200));
    if (options.fields?.length) params.set("fields", options.fields.join(","));

    const headers: Record<string, string> = {};
    if (options.modifiedSince) {
      headers["If-Modified-Since"] = options.modifiedSince;
    }

    if (!this.rateLimiter.canMakeCall()) {
      throw new Error("[ZOHO] Daily API rate limit reached.");
    }

    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.config.apiBase}/${module}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          ...headers,
        },
      },
    );

    this.rateLimiter.recordCall();

    if (res.status === 304) {
      return { data: [], info: { per_page: 200, count: 0, page: 1, more_records: false } };
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`[ZOHO] GET /${module} failed: ${res.status} — ${errorText}`);
    }

    return (await res.json()) as ZohoRecordResponse;
  }

  /**
   * Create records in a module (POST /crm/v2/<Module>). Returns Zoho's upsert
   * response shape so the caller can read `details.id` of each created record.
   * Max 100 records per call.
   */
  async createRecords(
    module: string,
    records: ZohoRecord[],
  ): Promise<ZohoUpsertResponse> {
    if (records.length === 0) return { data: [] };
    if (records.length > 100) {
      throw new Error(`[ZOHO] Max 100 records per create, got ${records.length}`);
    }
    return this.request<ZohoUpsertResponse>("POST", `/${module}`, { data: records });
  }

  /**
   * Upsert (insert or update). NO duplicate_check_fields para web leads —
   * cada submission es un evento independiente (ver §6.6 spec: descartamos
   * dedup por email para preservar first-touchpoint).
   */
  async upsertRecords(
    module: string,
    records: ZohoRecord[],
    duplicateCheckFields?: string[],
  ): Promise<ZohoUpsertResponse> {
    if (records.length === 0) return { data: [] };
    if (records.length > 100) {
      throw new Error(`[ZOHO] Max 100 records per upsert, got ${records.length}`);
    }

    const body: Record<string, unknown> = { data: records };
    if (duplicateCheckFields?.length) {
      body.duplicate_check_fields = duplicateCheckFields;
    }

    return this.request<ZohoUpsertResponse>("POST", `/${module}/upsert`, body);
  }

  async getRecord(module: string, recordId: string): Promise<ZohoRecord | null> {
    try {
      const result = await this.request<ZohoRecordResponse>(
        "GET",
        `/${module}/${recordId}`,
      );
      return result.data?.[0] || null;
    } catch (err) {
      if (err instanceof Error && err.message.includes("204")) return null;
      throw err;
    }
  }

  /**
   * Search records by criteria. Criteria format: "(Email:equals:test@example.com)".
   * Devuelve 204 → ZohoRecordResponse vacío (data: []).
   */
  async searchRecords(
    module: string,
    criteria: string,
    page = 1,
  ): Promise<ZohoRecordResponse> {
    const params = new URLSearchParams({
      criteria,
      page: String(page),
      per_page: "200",
    });

    try {
      return await this.request<ZohoRecordResponse>(
        "GET",
        `/${module}/search?${params.toString()}`,
      );
    } catch (err) {
      // 204 No Content (no matches) → respuesta vacía en vez de error
      if (err instanceof Error && err.message.includes("204")) {
        return { data: [], info: { per_page: 200, count: 0, page: 1, more_records: false } };
      }
      throw err;
    }
  }

  /**
   * Crea una Nota asociada a un record (Lead/Account/Deal/etc).
   * Usado cuando Zoho rechaza un Lead nuevo por DUPLICATE_DATA — en vez de
   * perder el touchpoint, anexamos el contexto al Lead existente como Nota
   * (Opción C del spec § Duplicados).
   *
   * @param parentId    ID del record padre (ej. Lead existente).
   * @param parentModule Nombre del módulo padre ("Leads", "Accounts", etc.).
   * @param title       Note_Title (máx ~120 chars recomendado).
   * @param content     Note_Content (texto libre, soporta saltos de línea).
   * @returns { id } de la nota creada, o null si falla.
   */
  async createNote(
    parentId: string,
    parentModule: string,
    title: string,
    content: string,
  ): Promise<{ id: string } | null> {
    if (!parentId) return null;
    const result = await this.createRecords("Notes", [
      {
        Parent_Id: parentId,
        se_module: parentModule,
        Note_Title: title.slice(0, 120),
        Note_Content: content.slice(0, 32_000),
      },
    ]);
    const detail = result.data?.[0];
    if (detail?.status === "success" && detail.details?.id) {
      return { id: detail.details.id };
    }
    return null;
  }

  /**
   * Wrapper sobre searchRecords() — busca un Lead por Email exact-match.
   * Usado por el cron retry para evitar duplicar cuando un PENDING_SYNC se
   * reintenta y Zoho ya recibió el primer POST (REQ-F-10, REQ-F-20).
   *
   * @returns { id } del primer Lead que matchea, o null si no hay.
   */
  async findLeadByEmail(email: string): Promise<{ id: string } | null> {
    if (!email) return null;
    const criteria = `(Email:equals:${encodeURIComponent(email)})`;
    const r = await this.searchRecords("Leads", criteria);
    const firstId = r.data?.[0]?.id;
    return firstId ? { id: firstId } : null;
  }

  async getAllRecords(
    module: string,
    options: {
      modifiedSince?: string;
      fields?: string[];
      maxPages?: number;
      startPage?: number;
    } = {},
  ): Promise<{ records: ZohoRecord[]; hasMore: boolean; lastPage: number }> {
    const maxPages = options.maxPages || 5;
    const allRecords: ZohoRecord[] = [];
    const startPage = options.startPage || 1;
    let page = startPage;
    let hasMore = true;

    while (hasMore && page < startPage + maxPages) {
      if (!this.rateLimiter.canMakeCall()) {
        return { records: allRecords, hasMore: true, lastPage: page - 1 };
      }

      const result = await this.getRecords(module, {
        page,
        perPage: 200,
        modifiedSince: options.modifiedSince,
        fields: options.fields,
      });

      allRecords.push(...result.data);
      hasMore = result.info.more_records;
      page++;
    }

    return { records: allRecords, hasMore, lastPage: page - 1 };
  }
}
