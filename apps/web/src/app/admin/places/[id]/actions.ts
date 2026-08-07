"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { savePlaceAttribute, savePlaceService, updateAdminPlace } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/supabase/server";

async function admin() { const user = await requireAdmin(); if (!user) throw new Error("Unauthorized"); return user; }
const nullableNumber = (value: FormDataEntryValue | null) => String(value ?? "").trim() === "" ? null : Number(value);

export async function saveBasicInfo(formData: FormData) {
  const user = await admin(); const placeId = z.uuid().parse(formData.get("placeId"));
  const body = z.object({ name_ko: z.string().min(1).max(200), name_en: z.string().max(200).nullable(), primary_category: z.enum(["hair", "nails", "head_spa", "personal_color"]), area: z.enum(["hongdae", "myeongdong", "gangnam", "seongsu"]), address_ko: z.string().max(500).nullable(), phone: z.string().max(100).nullable(), official_website: z.url().nullable() }).parse({ name_ko: formData.get("nameKo"), name_en: String(formData.get("nameEn") ?? "").trim() || null, primary_category: formData.get("category"), area: formData.get("area"), address_ko: String(formData.get("address") ?? "").trim() || null, phone: String(formData.get("phone") ?? "").trim() || null, official_website: String(formData.get("website") ?? "").trim() || null });
  await updateAdminPlace(placeId, body, user.id); revalidatePath(`/admin/places/${placeId}`); revalidatePath("/en", "layout"); revalidatePath("/ko", "layout");
}

export async function saveServiceInfo(formData: FormData) {
  const user = await admin(); const placeId = z.uuid().parse(formData.get("placeId"));
  const values = z.object({ min_price: z.number().int().nonnegative().nullable(), max_price: z.number().int().nonnegative().nullable(), duration_min: z.number().int().nonnegative().nullable(), duration_max: z.number().int().nonnegative().nullable(), price_note: z.string().max(1000).nullable() }).parse({ min_price: nullableNumber(formData.get("minPrice")), max_price: nullableNumber(formData.get("maxPrice")), duration_min: nullableNumber(formData.get("durationMin")), duration_max: nullableNumber(formData.get("durationMax")), price_note: String(formData.get("priceNote") ?? "").trim() || null });
  await savePlaceService(placeId, values, user.id); revalidatePath(`/admin/places/${placeId}`);
}

export async function saveAttributeInfo(formData: FormData) {
  const user = await admin(); const placeId = z.uuid().parse(formData.get("placeId")); const type = z.enum(["english_support", "korean_phone_required", "international_phone_supported", "foreign_card", "same_day_booking", "walk_in", "solo_friendly", "price_confirmed"]).parse(formData.get("type")); const raw = z.enum(["true", "false", "unknown"]).parse(formData.get("value")); const value = raw === "unknown" ? null : raw === "true"; const status = z.enum(["business_confirmed", "official_source", "visitor_confirmed", "likely"]).parse(formData.get("verificationStatus")); const evidence = String(formData.get("evidence") ?? "").trim() || null;
  await savePlaceAttribute(placeId, type, value, status, evidence, user.id); revalidatePath(`/admin/places/${placeId}`);
}
