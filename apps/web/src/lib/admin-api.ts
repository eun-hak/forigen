import { env } from "@/lib/env";

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
