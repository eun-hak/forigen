import type { Metadata } from "next";
import { HairMap } from "@/components/hair-map";
import { listMapPlaces } from "@/lib/public-api";

export const metadata: Metadata = { title: "서울 헤어 명소 지도 | K-Beauty Now", description: "서울의 공개 헤어숍을 카카오맵에서 한눈에 찾아보세요.", alternates: { canonical: "/ko/map", languages: { ko: "/ko/map", en: "/en/map", "x-default": "/en/map" } } };
export default async function KoreanMapPage() { const places = await listMapPlaces("hair"); return <main className="map-page"><HairMap places={places} locale="ko" apiKey={process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY ?? ""} /></main>; }
