"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createChangeReport } from "@/lib/admin-api";

const schema = z.object({ locale: z.enum(["en", "ko"]), placeId: z.uuid(), slug: z.string().min(1), reportType: z.enum(["closed", "contact", "location", "price", "booking", "other"]), message: z.string().trim().min(10).max(2000), reporterEmail: z.union([z.literal(""), z.email()]), sourceUrl: z.union([z.literal(""), z.url()]) });
export async function submitChangeReport(formData: FormData) {
  const value = schema.parse({ locale: formData.get("locale"), placeId: formData.get("placeId"), slug: formData.get("slug"), reportType: formData.get("reportType"), message: formData.get("message"), reporterEmail: formData.get("reporterEmail"), sourceUrl: formData.get("sourceUrl") });
  await createChangeReport({ place_id: value.placeId, report_type: value.reportType, message: value.message, reporter_email: value.reporterEmail || null, source_url: value.sourceUrl || null, locale: value.locale });
  redirect(`/${value.locale}/places/${value.slug}?reported=1`);
}
