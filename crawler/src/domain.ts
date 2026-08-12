import { z } from "zod";

export const targetAreaSchema = z.enum(["hongdae", "myeongdong", "gangnam", "seongsu"]);
export type TargetArea = z.infer<typeof targetAreaSchema>;
export const primaryCategorySchema = z.enum(["hair", "nails", "head_spa", "personal_color"]);

export const sourceSchema = z.object({
  sourceType: z.enum(["public_data", "kakao_local", "naver_local", "official_website", "booking_page"]),
  sourceUrl: z.url().optional(),
  externalId: z.string().min(1).optional(),
  checkedAt: z.iso.datetime(),
});

export const socialAccountSchema = z.object({
  platform: z.enum(["instagram", "youtube", "tiktok"]),
  profileUrl: z.url(),
  handle: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1),
  discoveryMethod: z.enum(["official_website_link"]),
  status: z.literal("candidate"),
  checkedAt: z.iso.datetime(),
});

export const bookingChannelSchema = z.object({
  channelType: z.enum(["website", "instagram_dm", "whatsapp", "line", "kakao", "naver_booking", "email", "phone"]),
  url: z.url().optional(),
  value: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1),
  status: z.literal("candidate"),
  checkedAt: z.iso.datetime(),
}).refine((item) => item.url || item.value, "A channel URL or value is required");

export const menuItemSchema = z.object({
  name: z.string().min(1).max(160),
  price: z.number().int().nonnegative(),
  currency: z.literal("KRW"),
  evidenceText: z.string().min(1),
  sourceUrl: z.url(),
  confidence: z.number().min(0).max(1),
  status: z.literal("candidate"),
  checkedAt: z.iso.datetime(),
});

export const placeSeedSchema = z.object({
  externalKey: z.string().min(1),
  nameKo: z.string().min(1),
  addressKo: z.string().optional(),
  roadAddressKo: z.string().optional(),
  phone: z.string().optional(),
  categoryRaw: z.string().optional(),
  businessStatus: z.string().optional(),
  licensedAt: z.string().optional(),
  closedAt: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  area: targetAreaSchema.optional(),
  primaryCategory: primaryCategorySchema.optional(),
  categoryConfidence: z.number().min(0).max(1).optional(),
  kakaoMatch: z.object({
    id: z.string(),
    url: z.url(),
    score: z.number().min(0).max(100),
    name: z.string(),
    address: z.string().optional(),
    phone: z.string().optional(),
    category: z.string().optional(),
  }).optional(),
  naverMatch: z.object({
    title: z.string(),
    link: z.url().optional(),
    score: z.number().min(0).max(100),
    address: z.string().optional(),
    category: z.string().optional(),
  }).optional(),
  officialWebsite: z.url().optional(),
  bookingUrl: z.url().optional(),
  socialAccounts: z.array(socialAccountSchema).optional(),
  bookingChannels: z.array(bookingChannelSchema).optional(),
  openingHoursText: z.string().max(500).optional(),
  menuItems: z.array(menuItemSchema).optional(),
  sources: z.array(sourceSchema).min(1),
});
export type PlaceSeed = z.infer<typeof placeSeedSchema>;

export const evidenceSchema = z.object({
  attributeType: z.enum([
    "english_support",
    "international_phone_supported",
    "foreign_card",
    "same_day_booking",
    "walk_in",
    "price_confirmed",
    "booking_channel",
    "opening_hours",
  ]),
  value: z.union([z.boolean(), z.string(), z.number()]),
  status: z.enum(["official_source", "likely"]),
  evidenceText: z.string().min(1),
  sourceUrl: z.url(),
  checkedAt: z.iso.datetime(),
  confidence: z.number().min(0).max(1),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const crawlCandidateSchema = z.object({
  externalKey: z.string().min(1),
  placeName: z.string().min(1),
  sourceUrl: z.url().optional(),
  rawData: z.record(z.string(), z.unknown()),
  extractedData: z.object({
    place: placeSeedSchema,
    evidence: z.array(evidenceSchema),
    page: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      links: z.array(z.url()),
    }).optional(),
  }),
  evidenceText: z.string().optional(),
  confidence: z.number().min(0).max(1),
});
export type CrawlCandidate = z.infer<typeof crawlCandidateSchema>;
