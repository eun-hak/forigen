import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingMessageGenerator } from "@/components/booking/booking-message-generator";
import { getPublicPlace } from "@/lib/public-api";
import { attributeLabel, humanValue, verificationPresentation } from "@/lib/presentation";
import { kakaoMapLink } from "@/lib/map";
import { ChangeReportForm } from "@/components/change-report-form";

interface Props { params: Promise<{ slug: string }> }
const labels: Record<string, string> = { hongdae: "Hongdae", myeongdong: "Myeongdong", gangnam: "Gangnam", seongsu: "Seongsu", hair: "Hair", nails: "Nails", head_spa: "Head spa", personal_color: "Personal color" };
const money = (value: number | null) => value === null ? null : `₩${value.toLocaleString("en-US")}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await getPublicPlace((await params).slug);
  if (!place) return { title: "Place not found | K-Beauty Now" };
  const slug = (await params).slug;
  return { title: `${place.name} — English booking, price & visitor guide | K-Beauty Now`, description: `Check verified booking conditions, price information and visitor guidance for ${place.name} in ${labels[place.area] ?? place.area}.`, alternates: { canonical: `/en/places/${slug}`, languages: { en: `/en/places/${slug}`, ko: `/ko/places/${slug}`, "x-default": `/en/places/${slug}` } } };
}

export default async function PlaceDetailPage({ params }: Props) {
  const place = await getPublicPlace((await params).slug);
  if (!place) notFound();
  const primaryService = place.services[0];
  const officialHref = place.bookingChannels.website;
  const jsonLd = { "@context": "https://schema.org", "@type": "BeautySalon", name: place.name, alternateName: place.nameKo, address: place.address, telephone: place.bookingChannels.phone, url: place.bookingChannels.website, geo: place.coordinates ? { "@type": "GeoCoordinates", latitude: place.coordinates.latitude, longitude: place.coordinates.longitude } : undefined };
  return <main className="place-detail-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
    <nav className="breadcrumbs"><Link href="/en">Home</Link><span>›</span><Link href={`/en/search?area=${place.area}&category=${place.category}`}>{labels[place.area]}</Link><span>›</span><span>{place.name}</span></nav>
    <section className="detail-hero">
      <div><span className="place-kicker">{labels[place.area]} · {labels[place.category]}</span><h1>{place.name}</h1>{place.nameEn && <p className="local-name">{place.nameKo}</p>}<p className="detail-address">{place.address ?? "Address details are being verified."}</p></div>
      <div className="detail-trust"><span className="verified-dot">Evidence-backed profile</span><small>{place.lastVerifiedAt ? `Latest check ${new Date(place.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Verification date not recorded"}</small></div>
    </section>
    <div className="detail-layout">
      <div className="detail-content">
        <section className="decision-panel"><div><span className="eyebrow">QUICK DECISION</span><h2>Can I actually use this place?</h2></div><div className="decision-grid">{place.attributeDetails.length ? place.attributeDetails.slice(0, 6).map((attribute) => { const status = verificationPresentation(attribute.verificationStatus, attribute.expiresAt); return <article key={attribute.type} className={`decision-item ${status.tone}`}><span className="status-symbol">{status.tone === "verified" ? "✓" : status.tone === "likely" ? "~" : "?"}</span><div><h3>{attributeLabel(attribute.type)}</h3><strong>{humanValue(attribute.type, attribute.value)}</strong><p>{status.label}</p>{attribute.verifiedAt && <small>Checked {new Date(attribute.verifiedAt).toLocaleDateString("en-US")}</small>}</div></article>; }) : <div className="detail-empty">Booking conditions have not been confirmed yet. Contact the salon before visiting.</div>}</div></section>
        <section className="detail-section"><div className="section-title-row"><div><span className="eyebrow">SERVICES</span><h2>Price & duration</h2></div><span>KRW</span></div>{place.services.length ? <div className="service-list">{place.services.map((service) => <article key={service.code}><div><h3>{service.name}</h3>{service.priceNote && <p>{service.priceNote}</p>}</div><div><strong>{[money(service.minPrice), money(service.maxPrice)].filter(Boolean).join(" – ") || "Ask for price"}</strong><span>{service.durationMin ? `${service.durationMin}${service.durationMax ? `–${service.durationMax}` : ""} min` : "Duration not confirmed"}</span></div></article>)}</div> : <div className="detail-empty">Prices are not confirmed. Ask for a quote before booking.</div>}</section>
        <section className="detail-section"><span className="eyebrow">CONTACT</span><h2>Check directly with the salon</h2><div className="booking-steps"><div><span>1</span><p>Review the salon’s official website.</p></div><div><span>2</span><p>Prepare your preferred service and time.</p></div><div><span>3</span><p>Copy the message below and contact the salon.</p></div></div><div className="booking-links">{place.bookingChannels.website && <a className="button secondary" href={place.bookingChannels.website} target="_blank" rel="noreferrer">Official website ↗</a>}{place.bookingChannels.phone && <a className="button secondary" href={`tel:${place.bookingChannels.phone}`}>Call {place.bookingChannels.phone}</a>}{!officialHref && !place.bookingChannels.phone && <span className="notice">No official contact channel is confirmed yet.</span>}</div></section>
        <section className="detail-section" id="message"><span className="eyebrow">MESSAGE ASSISTANT</span><h2>Ask without the language stress</h2><p className="section-copy">Fill in what you know, then copy the English or Korean message into the salon’s booking channel.</p><BookingMessageGenerator placeName={place.name} defaultService={primaryService?.name ?? labels[place.category] ?? "beauty service"} /></section>
        {place.coordinates && <section className="detail-section"><span className="eyebrow">LOCATION</span><h2>Know where you’re going</h2><div className="place-map"><img src={`/api/v1/map?${new URLSearchParams({ lat: String(place.coordinates.latitude), lng: String(place.coordinates.longitude), width: "900", height: "420" })}`} alt={`Map showing the location of ${place.name}`} loading="lazy" /><div className="map-caption"><div><strong>{place.name}</strong><span>{place.address ?? `${labels[place.area]}, Seoul`}</span></div><a className="button secondary" href={kakaoMapLink(place.name, place.coordinates.latitude, place.coordinates.longitude)} target="_blank" rel="noreferrer">Open in Kakao Map ↗</a></div></div></section>}
        <section className="detail-section"><span className="eyebrow">EVIDENCE</span><h2>Why you can trust this information</h2><p className="section-copy">We verify each condition separately. A place is never marked fully verified based on one source.</p><div className="source-list">{place.sources.length ? place.sources.map((source) => <article key={source.id}><div><strong>{source.title ?? source.type.replaceAll("_", " ")}</strong><span>Checked {new Date(source.checkedAt).toLocaleDateString("en-US")}</span></div>{source.url && <a href={source.url} target="_blank" rel="noreferrer">View source ↗</a>}</article>) : <div className="detail-empty">Source details are being prepared.</div>}</div></section>
        {place.relatedPlaces.length > 0 && <section className="detail-section"><span className="eyebrow">MORE OPTIONS</span><h2>Similar spots nearby</h2><div className="related-grid">{place.relatedPlaces.map((related) => <Link href={`/en/places/${related.slug}`} key={related.id}><span>{labels[related.area]} · {labels[related.category]}</span><strong>{related.name}</strong><small>View verified details →</small></Link>)}</div></section>}
        <ChangeReportForm placeId={place.id} slug={place.slug} locale="en" />
      </div>
      <aside className="booking-card"><span className="eyebrow">CONTACT THE SALON</span><h2>{primaryService ? [money(primaryService.minPrice), money(primaryService.maxPrice)].filter(Boolean).join(" – ") || "Price on request" : "Price on request"}</h2><p>{primaryService?.durationMin ? `${primaryService.durationMin}${primaryService.durationMax ? `–${primaryService.durationMax}` : ""} minutes` : "Duration not confirmed"}</p><div className="booking-card-facts"><span><b>{officialHref ? "✓" : "?"}</b> Official website</span><span><b>{place.attributes.english_support ? "✓" : "?"}</b> English support</span><span><b>{place.attributes.korean_phone_required === false ? "✓" : "?"}</b> No Korean phone</span></div>{officialHref ? <a className="search-cta" href={officialHref} target="_blank" rel="noreferrer">Official website <span>→</span></a> : <a className="search-cta" href="#message">Prepare a message <span>↓</span></a>}<small>We do not guarantee that an external page supports booking. Confirm the method directly with the salon.</small></aside>
    </div>
    <div className="mobile-booking-bar"><span><strong>{place.name}</strong><small>{primaryService ? money(primaryService.minPrice) ?? "Price on request" : "Price on request"}</small></span>{officialHref ? <a href={officialHref} target="_blank" rel="noreferrer">Official site</a> : <a href="#message">Message</a>}</div>
  </main>;
}
