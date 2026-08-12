import { z } from "zod";

const httpUrl = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Only HTTP(S) URLs are allowed");

export const changeReportSchema = z.object({
  locale: z.enum(["en", "ko"]),
  placeId: z.uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
  reportType: z.enum(["closed", "contact", "location", "price", "booking", "other"]),
  message: z.string().trim().min(10).max(2000),
  reporterEmail: z.union([z.literal(""), z.email()]),
  sourceUrl: z.union([z.literal(""), httpUrl]),
  website: z.string().max(0),
  renderedAt: z.coerce.number().int().positive(),
}).superRefine(({ renderedAt }, context) => {
  const elapsed = Date.now() - renderedAt;
  if (elapsed < 1_000 || elapsed > 24 * 60 * 60 * 1_000) {
    context.addIssue({ code: "custom", path: ["renderedAt"], message: "Invalid submission timing" });
  }
});

