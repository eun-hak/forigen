"use client";
export function SearchError({ locale, reset }: { locale: "en" | "ko"; reset: () => void }) {
  return <main className="search-page"><div className="empty-state"><span>!</span><h2>{locale === "ko" ? "장소를 불러오지 못했습니다" : "We couldn’t load the places"}</h2><p>{locale === "ko" ? "잠시 후 다시 시도해 주세요. 계속되면 관리자에게 알려주세요." : "Please try again in a moment. If it continues, let us know."}</p><button className="button" onClick={reset}>{locale === "ko" ? "다시 시도" : "Try again"}</button></div></main>;
}
