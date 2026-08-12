import type { MetadataRoute } from "next";
import { listPublicPlaces } from "@/lib/public-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const firstPage = await listPublicPlaces({ sort: "recommended", page: 1, limit: 100 });
  const remainingPages = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(firstPage.total / 100) - 1) }, (_, index) => listPublicPlaces({ sort: "recommended", page: index + 2, limit: 100 })));
  const places = [...firstPage.items, ...remainingPages.flatMap((page) => page.items)];
  const staticPages: MetadataRoute.Sitemap = ["en", "ko"].flatMap((locale) => [
    { url: `${base}/${locale}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/${locale}/map`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .9 },
  ]);
  const placePages: MetadataRoute.Sitemap = places.flatMap((place) => ["en", "ko"].map((locale) => ({ url: `${base}/${locale}/places/${place.slug}`, lastModified: new Date(place.lastVerifiedAt ?? place.publishedAt ?? Date.now()), changeFrequency: "weekly" as const, priority: 0.8, alternates: { languages: { en: `${base}/en/places/${place.slug}`, ko: `${base}/ko/places/${place.slug}` } } })));
  return [...staticPages, ...placePages];
}
