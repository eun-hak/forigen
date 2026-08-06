"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { approveCandidate, getCandidate, updateCandidate } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/supabase/server";

const actionSchema = z.object({ candidateId: z.uuid(), note: z.string().max(2000).optional() });

async function admin() {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function saveCandidate(formData: FormData) {
  await admin();
  const candidateId = z.uuid().parse(formData.get("candidateId"));
  const extractedData = z.record(z.string(), z.unknown()).parse(JSON.parse(String(formData.get("extractedData"))));
  await updateCandidate(candidateId, { extracted_data: extractedData, review_note: String(formData.get("note") ?? "") || null });
  revalidatePath(`/admin/candidates/${candidateId}`);
}

export async function approveCandidateAction(formData: FormData) {
  const user = await admin();
  const candidateId = z.uuid().parse(formData.get("candidateId"));
  const extractedData = z.record(z.string(), z.unknown()).parse(JSON.parse(String(formData.get("extractedData"))));
  await approveCandidate(candidateId, extractedData, user.id);
  revalidatePath("/admin"); revalidatePath("/admin/candidates");
  redirect("/admin/candidates");
}

export async function setCandidateStatus(formData: FormData) {
  const user = await admin();
  const parsed = actionSchema.extend({ status: z.enum(["rejected", "needs_revision"]) }).parse({
    candidateId: formData.get("candidateId"), note: formData.get("note") || undefined, status: formData.get("status"),
  });
  const before = await getCandidate(parsed.candidateId);
  if (!before) throw new Error("Candidate not found");
  await updateCandidate(parsed.candidateId, { status: parsed.status, review_note: parsed.note ?? null, reviewed_at: new Date().toISOString(), reviewed_by: user.id });
  revalidatePath("/admin"); revalidatePath("/admin/candidates");
  redirect("/admin/candidates");
}
