import { z } from "zod";

export const mapQuerySchema = z.object({
  lat: z.coerce.number().min(33).max(39),
  lng: z.coerce.number().min(124).max(132),
  width: z.coerce.number().int().min(240).max(1200).default(900),
  height: z.coerce.number().int().min(180).max(700).default(420),
});

export type MapQuery = z.infer<typeof mapQuerySchema>;

export function kakaoStaticMapUrl(query: MapQuery) {
  const location = `${query.lng},${query.lat}`;
  const params = new URLSearchParams({
    center: location,
    markers: `location:${location}|option:false`,
    size: `${query.width}x${query.height}`,
    format: "png",
    scale: "1",
    lv: "3",
    coord: "WGS84",
    logo_pos: "BOTTOM_RIGHT",
  });
  return `https://dapi.kakao.com/v2/maps/staticmap?${params}`;
}

export function kakaoMapLink(name: string, latitude: number, longitude: number) {
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${latitude},${longitude}`;
}
