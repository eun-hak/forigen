import { z } from "zod";

export const placeListQuerySchema = z.object({
  area: z.enum(["hongdae", "myeongdong", "gangnam", "seongsu"]).optional(),
  category: z.enum(["hair", "nails", "head_spa", "personal_color"]).optional(),
  english_support: z.enum(["confirmed", "available", "unknown"]).optional(),
  same_day_booking: z.enum(["true", "false"]).optional(),
  no_korean_phone: z.enum(["true", "false"]).optional(),
  foreign_card: z.enum(["confirmed", "available", "unknown"]).optional(),
  sort: z.enum(["recommended", "recent", "name"]).default("recommended"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PlaceListQuery = z.infer<typeof placeListQuerySchema>;

export function hasVerificationFilters(query: PlaceListQuery) {
  return Boolean(query.english_support || query.same_day_booking || query.no_korean_phone || query.foreign_card);
}

export function withoutVerificationFilters(query: PlaceListQuery): PlaceListQuery {
  const { english_support: _english, same_day_booking: _sameDay, no_korean_phone: _phone, foreign_card: _card, ...base } = query;
  return base;
}

export interface PublicAttribute {
  type: string;
  value: unknown;
  verificationStatus: string;
  confidence: number | null;
  evidenceText: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
}

export interface PublicService {
  code: string;
  name: string;
  minPrice: number | null;
  maxPrice: number | null;
  durationMin: number | null;
  durationMax: number | null;
  priceNote: string | null;
  verifiedAt: string | null;
}

export function unwrapAttributeValue(value: unknown): unknown {
  if (value && typeof value === "object" && "value" in value) return (value as { value: unknown }).value;
  return value;
}

export function attributeMap(attributes: PublicAttribute[]): Record<string, unknown> {
  return Object.fromEntries(attributes.map((attribute) => [attribute.type, attribute.value]));
}

export function recommendedScore(attributes: PublicAttribute[], services: PublicService[]): number {
  const verified = attributes.filter((item) => item.verificationStatus !== "unverified").length;
  const recent = attributes.some((item) => item.verifiedAt && Date.now() - Date.parse(item.verifiedAt) < 1000 * 60 * 60 * 24 * 90);
  const sameDay = attributes.some((item) => item.type === "same_day_booking" && item.value === true);
  const hasPrice = services.some((item) => item.minPrice !== null || item.maxPrice !== null);
  return Math.min(35, verified * 7) + (recent ? 20 : 0) + (sameDay ? 20 : 0) + Math.min(15, attributes.length * 3) + (hasPrice ? 10 : 0);
}
