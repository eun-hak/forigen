"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveChangeReport } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/supabase/server";

const schema = z.object({ id: z.uuid(), status: z.enum(["resolved", "rejected"]), note: z.string().trim().max(1000).optional() });
export async function processReport(formData: FormData) {
  const user = await requireAdmin(); if (!user) throw new Error("Unauthorized");
  const value = schema.parse({ id: formData.get("id"), status: formData.get("status"), note: formData.get("note") });
  await resolveChangeReport(value.id, value.status, value.note || null, user.id);
  revalidatePath("/admin/reports");
}
