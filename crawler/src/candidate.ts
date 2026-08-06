import { crawlCandidateSchema, type CrawlCandidate, type PlaceSeed } from "./domain.js";
import type { PageExtraction } from "./extract.js";

export function createCandidate(place: PlaceSeed, page?: PageExtraction): CrawlCandidate {
  const confidence = Math.min(0.98, 0.45 + (place.roadAddressKo ? 0.15 : 0) +
    (place.phone ? 0.1 : 0) + (place.latitude ? 0.1 : 0) + (page ? 0.08 : 0) +
    (page?.evidence.length ? 0.1 : 0));
  const enrichedPlace: PlaceSeed = page?.bookingUrl ? { ...place, bookingUrl: page.bookingUrl } : place;
  return crawlCandidateSchema.parse({
    externalKey: place.externalKey,
    placeName: place.nameKo,
    ...(page ? { sourceUrl: page.url } : {}),
    rawData: page ? { pageText: page.text.slice(0, 20_000), publicSources: place.sources } : { publicSources: place.sources },
    extractedData: {
      place: enrichedPlace,
      evidence: page?.evidence ?? [],
      ...(page ? { page: { ...(page.title ? { title: page.title } : {}), ...(page.description ? { description: page.description } : {}), links: page.links } } : {}),
    },
    evidenceText: page?.evidence.map((item) => item.evidenceText).join("\n"),
    confidence,
  });
}
