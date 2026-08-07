import type { Metadata } from "next";
import Link from "next/link";
import { placeListQuerySchema } from "@/lib/place";
import { listPublicPlaces, type PublicPlace } from "@/lib/public-api";

export const metadata: Metadata = { title: "Search verified K-beauty spots | K-Beauty Now", robots: { index: false, follow: true } };

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const labels: Record<string, string> = { hongdae: "Hongdae", myeongdong: "Myeongdong", gangnam: "Gangnam", seongsu: "Seongsu", hair: "Hair", nails: "Nails", head_spa: "Head spa", personal_color: "Personal color" };

function money(value: number | null) { return value === null ? null : `₩${value.toLocaleString("en-US")}`; }
function truth(value: unknown) { return value === true || ["confirmed", "business_confirmed", "official_source", "visitor_confirmed"].includes(String(value)); }

function PlaceCard({ place }: { place: PublicPlace }) {
  const service = place.services[0];
  return <article className="place-card">
    <div className="place-card-top"><div><span className="place-kicker">{labels[place.area] ?? place.area} · {labels[place.category] ?? place.category}</span><h2>{place.name}</h2>{place.nameEn && <p className="muted">{place.nameKo}</p>}</div><span className="verified-dot">Verified</span></div>
    <p className="place-address">{place.address ?? "Address details coming soon"}</p>
    <div className="fact-row">
      <span><small>PRICE</small><strong>{service ? [money(service.minPrice), money(service.maxPrice)].filter(Boolean).join(" – ") || "Check directly" : "Check directly"}</strong></span>
      <span><small>DURATION</small><strong>{service?.durationMin ? `${service.durationMin}${service.durationMax ? `–${service.durationMax}` : ""} min` : "Not confirmed"}</strong></span>
      <span><small>LAST CHECKED</small><strong>{place.lastVerifiedAt ? new Date(place.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not recorded"}</strong></span>
    </div>
    <div className="tag-row"><span className={truth(place.attributes.english_support) ? "positive" : ""}>English {truth(place.attributes.english_support) ? "confirmed" : "unconfirmed"}</span><span className={place.attributes.korean_phone_required === false ? "positive" : ""}>No Korean phone</span><span className={truth(place.attributes.foreign_card) ? "positive" : ""}>Foreign cards</span></div>
    <div className="card-actions"><Link className="button secondary" href={`/api/v1/places/${place.slug}`} target="_blank">View data</Link>{place.bookingChannels.bookingUrl && <a className="button" href={place.bookingChannels.bookingUrl} target="_blank" rel="noreferrer">Check booking</a>}</div>
  </article>;
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const parsed = placeListQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, first(value)]).filter(([, value]) => value !== undefined)));
  const query = parsed.success ? parsed.data : placeListQuerySchema.parse({});
  const result = await listPublicPlaces(query);
  const title = [query.category && labels[query.category], query.area && `in ${labels[query.area]}`].filter(Boolean).join(" ") || "All verified spots";
  return <main className="search-page">
    <div className="search-title"><div><span className="eyebrow">VERIFIED DIRECTORY</span><h1>{title}</h1><p>{result.total} spot{result.total === 1 ? "" : "s"} match your booking conditions.</p></div><Link className="button secondary" href="/en">Change search</Link></div>
    {!parsed.success && <div className="notice">Some search filters were invalid, so we showed all published spots.</div>}
    <div className="results-layout"><aside className="filter-summary"><h2>Your plan</h2><dl><div><dt>Category</dt><dd>{query.category ? labels[query.category] : "Any"}</dd></div><div><dt>Area</dt><dd>{query.area ? labels[query.area] : "Anywhere"}</dd></div><div><dt>Sort</dt><dd>{query.sort}</dd></div></dl><Link href="/en" className="text-link">Start over</Link></aside>
      <section className="result-list">{result.items.map((place) => <PlaceCard place={place} key={place.id} />)}{result.items.length === 0 && <div className="empty-state"><span>◇</span><h2>No published spots match yet</h2><p>Try fewer conditions, or check back after more places are verified and published.</p><Link className="button" href="/en">Adjust your search</Link></div>}
      {result.total > query.limit && <nav className="pagination">{query.page > 1 && <Link className="button secondary" href={{ query: { ...query, page: query.page - 1 } }}>Previous</Link>}<span>Page {query.page} of {Math.ceil(result.total / query.limit)}</span>{query.page * query.limit < result.total && <Link className="button secondary" href={{ query: { ...query, page: query.page + 1 } }}>Next</Link>}</nav>}</section>
    </div>
  </main>;
}
