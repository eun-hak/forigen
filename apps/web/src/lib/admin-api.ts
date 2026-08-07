import { env } from "@/lib/env";
import { placeStatusUpdate, type PlaceStatus } from "@/lib/admin-place";

export interface CandidateRow {
  id: string;
  external_key: string;
  place_name: string;
  source_url: string | null;
  extracted_data: Record<string, unknown>;
  evidence_text: string | null;
  confidence: number | null;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  review_note: string | null;
  created_at: string;
}

export type { PlaceStatus } from "@/lib/admin-place";

export interface AdminPlaceRow {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  primary_category: string;
  area: string;
  address_ko: string | null;
  status: PlaceStatus;
  published_at: string | null;
  updated_at: string;
}

export interface AdminServiceRow { id: string; min_price: number | null; max_price: number | null; duration_min: number | null; duration_max: number | null; price_note: string | null; verified_at: string | null; services: { id: string; code: string; name_en: string } | null }
export interface AdminAttributeRow { id: string; attribute_type: string; value_json: { value?: unknown }; verification_status: string; confidence: number | null; evidence_text: string | null; verified_at: string | null; expires_at: string | null }
export interface AdminSourceRow { id: string; source_type: string; source_url: string | null; title: string | null; checked_at: string }
export interface AdminPlaceDetail extends AdminPlaceRow { phone: string | null; official_website: string | null; latitude: number | null; longitude: number | null; place_services: AdminServiceRow[]; place_attributes: AdminAttributeRow[]; sources: AdminSourceRow[] }

const headers = { apikey: env.SUPABASE_SECRET_KEY, "Content-Type": "application/json" };

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; count?: number }> {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase admin request failed (${response.status}): ${await response.text()}`);
  const contentRange = response.headers.get("content-range");
  const count = contentRange ? Number(contentRange.split("/")[1]) : undefined;
  const text = await response.text();
  const data = (text ? JSON.parse(text) : null) as T;
  return typeof count === "number" && Number.isFinite(count) ? { data, count } : { data };
}

export async function listCandidates(filters: { status?: string; area?: string; category?: string; query?: string; page?: number }) {
  const page = filters.page ?? 1;
  const limit = 30;
  const params = new URLSearchParams({ select: "*", order: "confidence.desc.nullslast,created_at.desc", limit: String(limit), offset: String((page - 1) * limit) });
  if (filters.status) params.set("status", `eq.${filters.status}`);
  if (filters.area) params.set("extracted_data->place->>area", `eq.${filters.area}`);
  if (filters.category) params.set("extracted_data->place->>primaryCategory", `eq.${filters.category}`);
  if (filters.query) params.set("place_name", `ilike.*${filters.query.replaceAll("*", "")}*`);
  return request<CandidateRow[]>(`crawl_candidates?${params}`, { headers: { Prefer: "count=exact" } });
}

export async function getCandidate(id: string): Promise<CandidateRow | null> {
  const result = await request<CandidateRow[]>(`crawl_candidates?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return result.data[0] ?? null;
}

export async function updateCandidate(id: string, body: Record<string, unknown>): Promise<void> {
  await request(`crawl_candidates?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) });
}

export async function approveCandidate(id: string, extractedData: Record<string, unknown>, reviewerId: string): Promise<string> {
  const result = await request<string>("rpc/approve_crawl_candidate", { method: "POST", body: JSON.stringify({ p_candidate_id: id, p_extracted_data: extractedData, p_reviewer: reviewerId }) });
  return result.data;
}

export async function getDashboardStats() {
  const statuses = await Promise.all(["pending", "approved", "rejected", "needs_revision"].map(async (status) => {
    const result = await request<[]>(`crawl_candidates?status=eq.${status}&select=id&limit=0`, { headers: { Prefer: "count=exact" } });
    return [status, result.count ?? 0] as const;
  }));
  return Object.fromEntries(statuses) as Record<string, number>;
}

export async function listAdminPlaces(filters: { status?: string; area?: string; category?: string; query?: string; page?: number }) {
  const page = filters.page ?? 1;
  const limit = 30;
  const params = new URLSearchParams({ select: "id,slug,name_ko,name_en,primary_category,area,address_ko,status,published_at,updated_at", order: "updated_at.desc", limit: String(limit), offset: String((page - 1) * limit) });
  if (filters.status) params.set("status", `eq.${filters.status}`);
  if (filters.area) params.set("area", `eq.${filters.area}`);
  if (filters.category) params.set("primary_category", `eq.${filters.category}`);
  if (filters.query) params.set("or", `(name_ko.ilike.*${filters.query.replaceAll("*", "")}*,name_en.ilike.*${filters.query.replaceAll("*", "")}*)`);
  return request<AdminPlaceRow[]>(`places?${params}`, { headers: { Prefer: "count=exact" } });
}

export async function updatePlaceStatus(id: string, status: PlaceStatus, actorId: string): Promise<void> {
  const before = await request<AdminPlaceRow[]>(`places?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  if (!before.data[0]) throw new Error("Place not found");
  const update = placeStatusUpdate(status);
  await request(`places?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(update) });
  await request("admin_audit_logs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ actor_id: actorId, action: "change_status", entity_type: "place", entity_id: id, before_data: before.data[0], after_data: update }),
  });
}

export async function getAdminPlace(id: string): Promise<AdminPlaceDetail | null> {
  const select = "id,slug,name_ko,name_en,primary_category,area,address_ko,phone,official_website,latitude,longitude,status,published_at,updated_at,place_services(id,min_price,max_price,duration_min,duration_max,price_note,verified_at,services(id,code,name_en)),place_attributes(id,attribute_type,value_json,verification_status,confidence,evidence_text,verified_at,expires_at),sources(id,source_type,source_url,title,checked_at)";
  const result = await request<AdminPlaceDetail[]>(`places?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(select)}&limit=1`);
  return result.data[0] ?? null;
}

async function audit(actorId: string, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
  await request("admin_audit_logs", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, before_data: before, after_data: after }) });
}

export async function updateAdminPlace(id: string, body: Record<string, unknown>, actorId: string) {
  const before = await getAdminPlace(id); if (!before) throw new Error("Place not found");
  await request(`places?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }) });
  await audit(actorId, "update", "place", id, before, body);
}

export async function savePlaceService(placeId: string, values: { min_price: number | null; max_price: number | null; duration_min: number | null; duration_max: number | null; price_note: string | null }, actorId: string) {
  const place = await getAdminPlace(placeId); if (!place) throw new Error("Place not found");
  const serviceResult = await request<Array<{ id: string }>>(`services?code=eq.${place.primary_category}&select=id&limit=1`);
  const serviceId = serviceResult.data[0]?.id; if (!serviceId) throw new Error("Service not found");
  const existing = place.place_services[0]; const after = { ...values, verified_at: new Date().toISOString() };
  if (existing) await request(`place_services?id=eq.${existing.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(after) });
  else await request("place_services", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ place_id: placeId, service_id: serviceId, ...after }) });
  await audit(actorId, "update_service", "place", placeId, existing ?? null, after);
}

export async function savePlaceAttribute(placeId: string, type: string, value: boolean | null, status: string, evidence: string | null, actorId: string) {
  const place = await getAdminPlace(placeId); if (!place) throw new Error("Place not found");
  const existing = place.place_attributes.find((item) => item.attribute_type === type);
  if (value === null) {
    if (existing) await request(`place_attributes?id=eq.${existing.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await audit(actorId, "remove_attribute", "place", placeId, existing ?? null, { attribute_type: type, value: null }); return;
  }
  const after = { value_json: { value }, verification_status: status, confidence: status === "business_confirmed" ? 1 : .8, evidence_text: evidence, verified_at: new Date().toISOString(), expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString() };
  if (existing) await request(`place_attributes?id=eq.${existing.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(after) });
  else await request("place_attributes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ place_id: placeId, attribute_type: type, ...after }) });
  await audit(actorId, "update_attribute", "place", placeId, existing ?? null, { attribute_type: type, ...after });
}

export async function listStaleAttributes() {
  const now = new Date().toISOString();
  return request<Array<AdminAttributeRow & { places: { id: string; name_ko: string; slug: string } | null }>>(`place_attributes?or=(expires_at.lt.${encodeURIComponent(now)},verified_at.is.null)&select=*,places(id,name_ko,slug)&order=expires_at.asc.nullsfirst&limit=200`);
}

export async function listAuditLogs(page = 1) {
  return request<Array<{ id: string; action: string; entity_type: string; entity_id: string; created_at: string; before_data: unknown; after_data: unknown }>>(`admin_audit_logs?select=*&order=created_at.desc&limit=50&offset=${(page - 1) * 50}`, { headers: { Prefer: "count=exact" } });
}

export interface ChangeReportRow { id: string; place_id: string; reporter_email: string | null; report_type: string; message: string; source_url: string | null; locale: string; status: string; resolution_note: string | null; created_at: string; places: { name_ko: string; slug: string } | null }

export async function createChangeReport(body: { place_id: string; reporter_email: string | null; report_type: string; message: string; source_url: string | null; locale: "en" | "ko" }) {
  await request("change_reports", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) });
}

export async function listChangeReports(status = "pending") {
  return request<ChangeReportRow[]>(`change_reports?status=eq.${encodeURIComponent(status)}&select=*,places(name_ko,slug)&order=created_at.desc&limit=200`);
}

export async function resolveChangeReport(id: string, status: "resolved" | "rejected", note: string | null, actorId: string) {
  const before = await request<ChangeReportRow[]>(`change_reports?id=eq.${encodeURIComponent(id)}&select=*,places(name_ko,slug)&limit=1`);
  const report = before.data[0]; if (!report) throw new Error("Report not found");
  const after = { status, resolution_note: note, resolved_at: new Date().toISOString(), resolved_by: actorId };
  await request(`change_reports?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(after) });
  await audit(actorId, "resolve_report", "change_report", id, report, after);
}
