"use server";
import { redirect } from "next/navigation";
import { createChangeReport } from "@/lib/admin-api";
import { changeReportSchema } from "@/lib/change-report";

export async function submitChangeReport(formData: FormData) {
  const value = changeReportSchema.parse({ locale: formData.get("locale"), placeId: formData.get("placeId"), slug: formData.get("slug"), reportType: formData.get("reportType"), message: formData.get("message"), reporterEmail: formData.get("reporterEmail"), sourceUrl: formData.get("sourceUrl"), website: formData.get("website"), renderedAt: formData.get("renderedAt") });
  await createChangeReport({ place_id: value.placeId, report_type: value.reportType, message: value.message, reporter_email: value.reporterEmail || null, source_url: value.sourceUrl || null, locale: value.locale });
  redirect(`/${value.locale}/places/${value.slug}?reported=1`);
}
