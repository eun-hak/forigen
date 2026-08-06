import type { PlaceSeed } from "./domain.js";

const NON_WEBSITE_HOSTS = [
  "instagram.com", "blog.naver.com", "m.blog.naver.com", "cafe.naver.com", "pf.kakao.com",
  "open.kakao.com", "youtube.com", "youtu.be", "wa.me", "app.catchtable.co.kr", "toss-order.tossplace.com",
] as const;

export function isIndependentWebsite(link: string): boolean {
  const hostname = new URL(link).hostname.replace(/^www\./, "").toLowerCase();
  return !NON_WEBSITE_HOSTS.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`));
}

export function promoteIndependentWebsites(places: readonly PlaceSeed[]): PlaceSeed[] {
  return places.map((place) => {
    const link = place.naverMatch?.link;
    if (!link || !isIndependentWebsite(link)) return place;
    return { ...place, officialWebsite: link };
  });
}
