export interface CandidatePlaceView {
  area: string;
  category: string;
  address: string;
  kakaoScore: string;
  naverScore: string;
}

export function candidatePlaceView(extractedData: Record<string, unknown>): CandidatePlaceView {
  const place = extractedData.place && typeof extractedData.place === "object" ? extractedData.place as Record<string, unknown> : {};
  const kakao = place.kakaoMatch && typeof place.kakaoMatch === "object" ? place.kakaoMatch as Record<string, unknown> : {};
  const naver = place.naverMatch && typeof place.naverMatch === "object" ? place.naverMatch as Record<string, unknown> : {};
  return {
    area: String(place.area ?? "-"),
    category: String(place.primaryCategory ?? "-"),
    address: String(place.roadAddressKo ?? place.addressKo ?? "주소 없음"),
    kakaoScore: String(kakao.score ?? "-"),
    naverScore: String(naver.score ?? "-"),
  };
}
