import { NextResponse } from "next/server";
import { getPublicPlace } from "@/lib/public-api";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const place = await getPublicPlace(slug);
    if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });
    return NextResponse.json(place);
  } catch (error) {
    console.error("Failed to load public place", error);
    return NextResponse.json({ error: "Failed to load place" }, { status: 500 });
  }
}
