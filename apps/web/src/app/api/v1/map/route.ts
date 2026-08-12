import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { kakaoStaticMapUrl, mapQuerySchema } from "@/lib/map";

export async function GET(request: NextRequest) {
  const parsed = mapQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid map coordinates", details: parsed.error.issues }, { status: 400 });
  if (!env.KAKAO_REST_API_KEY) return NextResponse.json({ error: "Map service is not configured" }, { status: 503 });
  try {
    const response = await fetch(kakaoStaticMapUrl(parsed.data), {
      headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) {
      console.error("Kakao static map request failed", response.status, await response.text());
      return NextResponse.json({ error: "Map is temporarily unavailable" }, { status: 502 });
    }
    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to load Kakao static map", error);
    return NextResponse.json({ error: "Map is temporarily unavailable" }, { status: 502 });
  }
}
