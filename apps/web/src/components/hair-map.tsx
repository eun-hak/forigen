"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { KakaoBounds, KakaoMapInstance, KakaoMarker, loadKakaoMaps } from "@/lib/kakao-map-sdk";

export interface HairMapPlace { id: string; slug: string; name: string; nameKo: string; nameEn: string | null; area: string; address: string | null; coordinates: { latitude: number; longitude: number }; phone: string | null; minPrice: number | null; maxPrice: number | null }

const areaLabels: Record<string, { ko: string; en: string }> = { hongdae: { ko: "홍대", en: "Hongdae" }, myeongdong: { ko: "명동", en: "Myeongdong" }, gangnam: { ko: "강남", en: "Gangnam" }, seongsu: { ko: "성수", en: "Seongsu" } };
const mobileCenters: Record<string, [number, number]> = { all: [37.5665, 126.978], hongdae: [37.5563, 126.9236], myeongdong: [37.5636, 126.9869], gangnam: [37.4979, 127.0276], seongsu: [37.5445, 127.056] };
const money = (value: number | null, locale: "ko" | "en") => value === null ? null : locale === "ko" ? `${value.toLocaleString("ko-KR")}원` : `₩${value.toLocaleString("en-US")}`;

export function HairMap({ places, locale, apiKey }: { places: HairMapPlace[]; locale: "ko" | "en"; apiKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null); const mapRef = useRef<KakaoMapInstance | null>(null); const markerRefs = useRef(new Map<string, KakaoMarker>()); const locationMarkerRef = useRef<KakaoMarker | null>(null);
  const [selected, setSelected] = useState<HairMapPlace | null>(null); const [area, setArea] = useState("all"); const [error, setError] = useState(!apiKey); const [locating, setLocating] = useState(false); const [locationError, setLocationError] = useState("");
  const visible = area === "all" ? places : places.filter((place) => place.area === area);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false; let clusterer: { clear(): void } | null = null; let layoutFrame = 0; let boundsFrame = 0;
    loadKakaoMaps(apiKey).then(() => {
      if (cancelled || !containerRef.current || !window.kakao) return; const maps = window.kakao.maps; maps.disableHD();
      const center = new maps.LatLng(37.5519, 126.9918); const map = new maps.Map(containerRef.current, { center, level: 8 }); mapRef.current = map;
      const bounds = new maps.LatLngBounds(); const markers = visible.map((place) => { const position = new maps.LatLng(place.coordinates.latitude, place.coordinates.longitude); const marker = new maps.Marker({ position, title: place.nameKo }); markerRefs.current.set(place.id, marker); bounds.extend(position); marker.setMap(map); return marker; });
      const mobilePoint = mobileCenters[area] ?? [37.5665, 126.978]; const mobileCenter = new maps.LatLng(mobilePoint[0], mobilePoint[1]);
      const fitVisiblePlaces = () => { cancelAnimationFrame(layoutFrame); cancelAnimationFrame(boundsFrame); layoutFrame = requestAnimationFrame(() => { map.relayout(); boundsFrame = requestAnimationFrame(() => { if (!markers.length) return; if (window.matchMedia("(max-width: 800px)").matches) { map.setLevel(area === "all" ? 9 : 7); map.setCenter(mobileCenter); } else map.setBounds(bounds); }); }); };
      clusterer = new maps.MarkerClusterer({ map, averageCenter: true, minLevel: 5, markers, disableClickZoom: true }); fitVisiblePlaces();
      visible.forEach((place) => { const marker = markerRefs.current.get(place.id); const kakaoMaps = window.kakao?.maps as unknown as { event?: { addListener(target: unknown, event: string, handler: () => void): void } }; kakaoMaps.event?.addListener(marker, "click", () => setSelected(place)); });
    }).catch(() => setError(true));
    return () => { cancelled = true; cancelAnimationFrame(layoutFrame); cancelAnimationFrame(boundsFrame); clusterer?.clear(); markerRefs.current.forEach((marker) => marker.setMap(null)); markerRefs.current.clear(); locationMarkerRef.current?.setMap(null); locationMarkerRef.current = null; };
  }, [apiKey, area]);

  function focus(place: HairMapPlace) { setSelected(place); const marker = markerRefs.current.get(place.id); if (marker && mapRef.current) { mapRef.current.setLevel(5); if (window.matchMedia("(max-width: 800px)").matches) mapRef.current.setCenter(marker.getPosition()); else mapRef.current.panTo(marker.getPosition()); } }
  function locateMe() {
    const map = mapRef.current; const maps = window.kakao?.maps;
    if (!map || !maps || locating) return;
    setLocating(true); setLocationError("");
    if (!navigator.geolocation) { setLocating(false); setLocationError(locale === "ko" ? "이 기기에서는 현재 위치를 사용할 수 없습니다." : "Location is unavailable on this device."); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = new maps.LatLng(coords.latitude, coords.longitude);
      locationMarkerRef.current?.setMap(null);
      locationMarkerRef.current = new maps.Marker({ map, position, title: locale === "ko" ? "현재 위치" : "Current location" });
      map.setLevel(4); map.setCenter(position); setSelected(null); setLocating(false);
    }, (reason) => {
      const denied = reason.code === reason.PERMISSION_DENIED;
      setLocationError(locale === "ko" ? (denied ? "위치 권한을 허용해 주세요." : "현재 위치를 확인하지 못했습니다.") : (denied ? "Please allow location access." : "Couldn’t determine your location.")); setLocating(false);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }
  function changeArea(value: string) { setArea(value); setSelected(null); }
  const ko = locale === "ko"; const price = selected ? [money(selected.minPrice, locale), money(selected.maxPrice, locale)].filter(Boolean).join(" – ") : "";
  return <div className="directory-map-layout">
    <aside className="map-directory"><div className="map-directory-head"><span className="eyebrow">{ko ? "서울 헤어 지도" : "SEOUL HAIR MAP"}</span><h1>{ko ? "헤어 명소를 지도에서 찾아보세요" : "Find your hair spot on the map"}</h1><p>{ko ? `공개된 헤어 장소 ${places.length}곳` : `${places.length} published hair spots`}</p><select value={area} onChange={(event) => changeArea(event.target.value)} aria-label={ko ? "지역 선택" : "Select area"}><option value="all">{ko ? "서울 전체" : "All Seoul"}</option>{Object.entries(areaLabels).map(([value, label]) => <option value={value} key={value}>{label[locale]}</option>)}</select></div><div className="map-place-list">{visible.map((place) => <button className={selected?.id === place.id ? "active" : ""} onClick={() => focus(place)} key={place.id}><span>{areaLabels[place.area]?.[locale] ?? place.area}</span><strong>{ko ? place.nameKo : place.name}</strong><small>{place.address ?? (ko ? "주소 확인 중" : "Address coming soon")}</small></button>)}</div></aside>
    <section className="interactive-map-shell"><div ref={containerRef} className="interactive-map" aria-label={ko ? "서울 헤어 장소 지도" : "Map of Seoul hair spots"}>{error && <div className="map-error"><strong>{ko ? "지도를 불러오지 못했습니다" : "The map couldn’t load"}</strong><span>{ko ? "카카오 JavaScript 키와 등록 도메인을 확인해 주세요." : "Check the Kakao JavaScript key and registered domain."}</span></div>}</div><button type="button" className="map-location-button" onClick={locateMe} disabled={locating} aria-label={ko ? "내 위치로 이동" : "Go to my location"}><span aria-hidden="true">⌖</span>{locating ? (ko ? "찾는 중" : "Locating") : (ko ? "내 위치" : "My location")}</button>{locationError && <div className="map-location-error" role="status">{locationError}</div>}{selected && <article className="map-info-card"><button className="map-card-close" onClick={() => setSelected(null)} aria-label={ko ? "닫기" : "Close"}>×</button><span>{areaLabels[selected.area]?.[locale] ?? selected.area} · HAIR</span><h2>{ko ? selected.nameKo : selected.name}</h2>{selected.nameEn && ko && <p>{selected.nameEn}</p>}<p>{selected.address ?? (ko ? "주소 확인 중" : "Address coming soon")}</p>{price && <strong>{price}</strong>}<div><Link className="button" href={`/${locale}/places/${selected.slug}`}>{ko ? "상세 보기" : "View details"}</Link>{selected.phone && <a className="button secondary" href={`tel:${selected.phone}`}>{ko ? "전화" : "Call"}</a>}</div></article>}</section>
  </div>;
}
