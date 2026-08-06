export type PlaceStatus = "draft" | "published" | "hidden" | "closed";

export function placeStatusUpdate(status: PlaceStatus, now = new Date().toISOString()) {
  return { status, published_at: status === "published" ? now : null, updated_at: now };
}
