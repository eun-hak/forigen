import "server-only";
import { env, isPublicDataConfigured } from "@/lib/env";
import { attributeMap, PublicAttribute, PublicService, recommendedScore, unwrapAttributeValue, type PlaceListQuery } from "@/lib/place";

interface RawAttribute {
  attribute_type: string;
  value_json: unknown;
  verification_status: string;
  confidence: number | null;
  evidence_text: string | null;
  verified_at: string | null;
  expires_at: string | null;
}

interface RawService {
  min_price: number | null;
  max_price: number | null;
  duration_min: number | null;
  duration_max: number | null;
  price_note: string | null;
  verified_at: string | null;
  services: { code: string; name_en: string } | { code: string; name_en: string }[] | null;
}

interface RawPlace {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  primary_category: string;
  area: string;
  address_ko: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  official_website: string | null;
  booking_url: string | null;
  published_at: string | null;
  updated_at: string;
  place_services: RawService[];
  place_attributes: RawAttribute[];
}

export interface PublicPlace {
  id: string;
  slug: string;
  name: string;
  nameKo: string;
  nameEn: string | null;
  category: string;
  area: string;
  address: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  services: PublicService[];
  attributes: Record<string, unknown>;
  attributeDetails: PublicAttribute[];
  bookingChannels: { website: string | null; bookingUrl: string | null; phone: string | null };
  lastVerifiedAt: string | null;
  publishedAt: string | null;
}

export interface PublicEnrichment {
  socialAccounts: Array<{ platform: string; handle: string | null; url: string; checkedAt: string }>;
  additionalBookingChannels: Array<{ type: string; url: string | null; value: string | null; checkedAt: string }>;
  menuItems: Array<{ id: string; name: string; price: number; currency: string; checkedAt: string }>;
  openingHours: { text: string; checkedAt: string } | null;
}

const select = [
  "id", "slug", "name_ko", "name_en", "primary_category", "area", "address_ko", "latitude", "longitude", "phone",
  "official_website", "booking_url", "published_at", "updated_at",
  "place_services(min_price,max_price,duration_min,duration_max,price_note,verified_at,services(code,name_en))",
  "place_attributes(attribute_type,value_json,verification_status,confidence,evidence_text,verified_at,expires_at)",
].join(",");

async function supabaseRequest<T>(path: string): Promise<T> {
  // Local UI previews should render their empty states when Supabase has not
  // been configured yet, instead of failing every data-backed route.
  if (!isPublicDataConfigured) return [] as T;
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Public data request failed (${response.status}): ${await response.text()}`);
  return response.json() as Promise<T>;
}

function serviceRelation(value: RawService["services"]): { code: string; name_en: string } | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapPlace(row: RawPlace): PublicPlace {
  const attributeDetails = row.place_attributes.map((item) => ({
    type: item.attribute_type,
    value: unwrapAttributeValue(item.value_json),
    verificationStatus: item.verification_status,
    confidence: item.confidence,
    evidenceText: item.evidence_text,
    verifiedAt: item.verified_at,
    expiresAt: item.expires_at,
  }));
  const services = row.place_services.flatMap((item) => {
    const service = serviceRelation(item.services);
    return service ? [{
      code: service.code, name: service.name_en, minPrice: item.min_price, maxPrice: item.max_price,
      durationMin: item.duration_min, durationMax: item.duration_max, priceNote: item.price_note, verifiedAt: item.verified_at,
    }] : [];
  });
  const verifiedDates = [...attributeDetails.map((item) => item.verifiedAt), ...services.map((item) => item.verifiedAt)].filter(Boolean) as string[];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name_en ?? row.name_ko,
    nameKo: row.name_ko,
    nameEn: row.name_en,
    category: row.primary_category,
    area: row.area,
    address: row.address_ko,
    coordinates: row.latitude !== null && row.longitude !== null ? { latitude: Number(row.latitude), longitude: Number(row.longitude) } : null,
    services,
    attributes: attributeMap(attributeDetails),
    attributeDetails,
    bookingChannels: { website: row.official_website, bookingUrl: row.booking_url, phone: row.phone },
    lastVerifiedAt: verifiedDates.sort().at(-1) ?? null,
    publishedAt: row.published_at,
  };
}

function isConfirmed(value: unknown): boolean {
  return value === true || value === "confirmed" || value === "business_confirmed" || value === "official_source" || value === "visitor_confirmed";
}

function matchesFilters(place: PublicPlace, query: PlaceListQuery): boolean {
  if (query.english_support && query.english_support !== "unknown" && !isConfirmed(place.attributes.english_support)) return false;
  if (query.english_support === "unknown" && place.attributes.english_support !== undefined) return false;
  if (query.same_day_booking && Boolean(place.attributes.same_day_booking) !== (query.same_day_booking === "true")) return false;
  if (query.no_korean_phone && (place.attributes.korean_phone_required === false) !== (query.no_korean_phone === "true")) return false;
  if (query.foreign_card && query.foreign_card !== "unknown" && !isConfirmed(place.attributes.foreign_card)) return false;
  if (query.foreign_card === "unknown" && place.attributes.foreign_card !== undefined) return false;
  return true;
}

async function fetchPublishedPlaces(query?: Pick<PlaceListQuery, "area" | "category">): Promise<PublicPlace[]> {
  const params = new URLSearchParams({ select, status: "eq.published", limit: "1000" });
  if (query?.area) params.set("area", `eq.${query.area}`);
  if (query?.category) params.set("primary_category", `eq.${query.category}`);
  return (await supabaseRequest<RawPlace[]>(`places?${params}`)).map(mapPlace);
}

export async function listPublicPlaces(query: PlaceListQuery) {
  const filtered = (await fetchPublishedPlaces(query)).filter((place) => matchesFilters(place, query));
  filtered.sort((a, b) => {
    if (query.sort === "name") return a.name.localeCompare(b.name, "en");
    if (query.sort === "recent") return Date.parse(b.lastVerifiedAt ?? b.publishedAt ?? "0") - Date.parse(a.lastVerifiedAt ?? a.publishedAt ?? "0");
    return recommendedScore(b.attributeDetails, b.services) - recommendedScore(a.attributeDetails, a.services) || a.name.localeCompare(b.name, "en");
  });
  const offset = (query.page - 1) * query.limit;
  return { items: filtered.slice(offset, offset + query.limit), page: query.page, limit: query.limit, total: filtered.length };
}

export async function listMapPlaces(category: PlaceListQuery["category"] = "hair") {
  return (await fetchPublishedPlaces({ category })).filter((place) => place.coordinates !== null).map((place) => ({
    id: place.id, slug: place.slug, name: place.name, nameKo: place.nameKo, nameEn: place.nameEn,
    area: place.area, address: place.address, coordinates: place.coordinates!, phone: place.bookingChannels.phone,
    minPrice: place.services[0]?.minPrice ?? null, maxPrice: place.services[0]?.maxPrice ?? null,
  }));
}

export async function getPublicPlace(slug: string) {
  const params = new URLSearchParams({ select, status: "eq.published", slug: `eq.${slug}`, limit: "1" });
  const row = (await supabaseRequest<RawPlace[]>(`places?${params}`))[0];
  if (!row) return null;
  const place = mapPlace(row);
  const sourceParams = new URLSearchParams({
    select: "id,source_type,source_url,title,checked_at", place_id: `eq.${row.id}`, order: "checked_at.desc",
  });
  const enrichmentFilter = `place_id=eq.${row.id}&verification_status=eq.verified`;
  const [sources, socialRows, channelRows, menuRows, hourRows] = await Promise.all([
    supabaseRequest<Array<{ id: string; source_type: string; source_url: string | null; title: string | null; checked_at: string }>>(`sources?${sourceParams}`),
    supabaseRequest<Array<{ platform: string; handle: string | null; profile_url: string; checked_at: string }>>(`place_social_accounts?${enrichmentFilter}&select=platform,handle,profile_url,checked_at`),
    supabaseRequest<Array<{ channel_type: string; channel_url: string | null; channel_value: string | null; checked_at: string }>>(`place_booking_channels?${enrichmentFilter}&select=channel_type,channel_url,channel_value,checked_at&order=is_primary.desc,confidence.desc`),
    supabaseRequest<Array<{ id: string; name: string; price: number; currency: string; checked_at: string }>>(`place_menu_items?${enrichmentFilter}&select=id,name,price,currency,checked_at&order=price.asc&limit=50`),
    supabaseRequest<Array<{ hours_text: string; checked_at: string }>>(`place_opening_hours?${enrichmentFilter}&select=hours_text,checked_at&limit=1`),
  ]);
  const related = (await fetchPublishedPlaces({ area: place.area as PlaceListQuery["area"], category: place.category as PlaceListQuery["category"] }))
    .filter((item) => item.id !== place.id).slice(0, 4).map(({ id, slug: relatedSlug, name, category, area }) => ({ id, slug: relatedSlug, name, category, area }));
  return {
    ...place,
    sources: sources.map((source) => ({ id: source.id, type: source.source_type, url: source.source_url, title: source.title, checkedAt: source.checked_at })),
    socialAccounts: socialRows.map((item) => ({ platform: item.platform, handle: item.handle, url: item.profile_url, checkedAt: item.checked_at })),
    additionalBookingChannels: channelRows.map((item) => ({ type: item.channel_type, url: item.channel_url, value: item.channel_value, checkedAt: item.checked_at })),
    menuItems: menuRows.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), currency: item.currency, checkedAt: item.checked_at })),
    openingHours: hourRows[0] ? { text: hourRows[0].hours_text, checkedAt: hourRows[0].checked_at } : null,
    relatedPlaces: related,
  };
}
