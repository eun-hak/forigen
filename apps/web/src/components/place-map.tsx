"use client";

import { useEffect, useRef, useState } from "react";
import { kakaoMapLink } from "@/lib/map";
import { KakaoMapInstance, KakaoMarker, loadKakaoMaps } from "@/lib/kakao-map-sdk";

interface PlaceMapProps {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  locale: "ko" | "en";
  apiKey: string;
}

export function PlaceMap({ name, address, latitude, longitude, locale, apiKey }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const [failed, setFailed] = useState(!apiKey);
  const ko = locale === "ko";

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;
    let layoutFrame = 0;
    let observer: ResizeObserver | null = null;

    loadKakaoMaps(apiKey).then(() => {
      if (cancelled || !containerRef.current || !window.kakao) return;
      const maps = window.kakao.maps;
      const position = new maps.LatLng(latitude, longitude);
      const map = new maps.Map(containerRef.current, { center: position, level: 4 });
      const marker = new maps.Marker({ map, position, title: name });
      mapRef.current = map;
      markerRef.current = marker;

      observer = new ResizeObserver(() => {
        cancelAnimationFrame(layoutFrame);
        layoutFrame = requestAnimationFrame(() => {
          map.relayout();
          map.setCenter(position);
        });
      });
      observer.observe(containerRef.current);
    }).catch(() => setFailed(true));

    return () => {
      cancelled = true;
      cancelAnimationFrame(layoutFrame);
      observer?.disconnect();
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, latitude, longitude, name]);

  return <div className="place-map">
    <div ref={containerRef} className="place-map-canvas" aria-label={ko ? `${name} 위치 지도` : `Map showing the location of ${name}`}>
      {failed && <div className="place-map-fallback">{ko ? "동적 지도를 불러오지 못했습니다." : "The interactive map couldn’t load."}</div>}
    </div>
    <div className="map-caption"><div><strong>{name}</strong><span>{address}</span></div><a className="button secondary" href={kakaoMapLink(name, latitude, longitude)} target="_blank" rel="noreferrer">{ko ? "카카오맵에서 길찾기 ↗" : "Directions in Kakao Map ↗"}</a></div>
  </div>;
}
