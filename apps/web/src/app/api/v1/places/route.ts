import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { placeListQuerySchema } from "@/lib/place";
import { listPublicPlaces } from "@/lib/public-api";

export async function GET(request: NextRequest) {
  try {
    const query = placeListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(await listPublicPlaces(query));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.issues }, { status: 400 });
    }
    console.error("Failed to list public places", error);
    return NextResponse.json({ error: "Failed to load places" }, { status: 500 });
  }
}
