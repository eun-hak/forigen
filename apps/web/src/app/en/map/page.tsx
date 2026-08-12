import type { Metadata } from "next";
import { HairMap } from "@/components/hair-map";
import { listMapPlaces } from "@/lib/public-api";

export const metadata: Metadata = { title: "Seoul hair spot map | K-Beauty Now", description: "Explore published Seoul hair spots together on an interactive Kakao Map.", alternates: { canonical: "/en/map", languages: { ko: "/ko/map", en: "/en/map", "x-default": "/en/map" } } };
export default async function EnglishMapPage() { const places = await listMapPlaces("hair"); return <main className="map-page"><HairMap places={places} locale="en" apiKey={process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY ?? ""} /></main>; }
