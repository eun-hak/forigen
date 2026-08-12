export interface KakaoMapInstance {
  setBounds(bounds: KakaoBounds): void;
  setCenter(position: unknown): void;
  panTo(position: unknown): void;
  setLevel(level: number): void;
  relayout(): void;
}

export interface KakaoMarker {
  setMap(map: KakaoMapInstance | null): void;
  getPosition(): unknown;
}

export interface KakaoBounds { extend(position: unknown): void }

export interface KakaoMaps {
  load(callback: () => void): void;
  disableHD(): void;
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (container: HTMLElement, options: unknown) => KakaoMapInstance;
  Marker: new (options: unknown) => KakaoMarker;
  LatLngBounds: new () => KakaoBounds;
  MarkerClusterer: new (options: unknown) => { clear(): void };
}

declare global {
  interface Window { kakao?: { maps: KakaoMaps } }
}

let sdkPromise: Promise<void> | null = null;

export function loadKakaoMaps(key: string) {
  if (window.kakao?.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-kakao-map]");
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.dataset.kakaoMap = "true";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=clusterer&autoload=false`;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => window.kakao?.maps.load(resolve), { once: true });
    script.addEventListener("error", () => reject(new Error("Kakao Maps SDK failed to load")), { once: true });
  });

  return sdkPromise;
}
