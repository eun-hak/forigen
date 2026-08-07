export function SearchLoading({ locale }: { locale: "en" | "ko" }) {
  return <main className="search-page"><div className="search-title"><div><span className="eyebrow">K-BEAUTY NOW</span><h1>{locale === "ko" ? "장소를 찾고 있어요" : "Finding your places"}</h1><p>{locale === "ko" ? "확인된 장소 정보를 불러오는 중입니다." : "Loading verified place information."}</p></div></div><div className="loading-list" aria-busy="true">{[1, 2, 3].map((item) => <div className="loading-card" key={item} />)}</div></main>;
}
