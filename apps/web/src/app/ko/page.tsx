import type { Metadata } from "next";
import Link from "next/link";
import { SearchWizardKo } from "@/components/search/search-wizard-ko";

export const metadata: Metadata = { title: "K-Beauty Now — 실제 예약 가능한 서울 뷰티숍 찾기", description: "영어 응대, 한국 전화번호, 해외 카드와 예약 조건을 확인한 서울 K-뷰티 장소를 찾아보세요.", alternates: { canonical: "/ko", languages: { en: "/en", ko: "/ko", "x-default": "/en" } } };

export default function KoreanHomePage() {
  return <main>
    <section className="hero"><div className="eyebrow">외국인을 위한 서울 뷰티 예약</div><h1>서울의 K-뷰티,<br /><em>예약 걱정 없이.</em></h1><p>영어 응대부터 예약 방법, 결제 조건까지 미리 확인하고<br />나에게 맞는 뷰티숍을 찾아보세요.</p><div className="trust-row"><span>✓ 한눈에 비교</span><span>✓ 외국인 조건 중심</span><span>✓ 모르는 정보는 솔직하게</span></div></section>
    <section className="search-section"><div className="section-heading"><div><span className="eyebrow">검색 시작</span><h2>나에게 맞는 장소 찾기</h2></div><p>회원가입 없이 세 가지만 선택하세요.</p></div><SearchWizardKo /></section>
    <section className="promise-grid"><article><span>01</span><h3>막연한 외국인 친화 표시 대신</h3><p>예약에 필요한 조건을 항목별로 확인해 무엇이 확실하고 불확실한지 보여드립니다.</p></article><article><span>02</span><h3>방문 결정에 필요한 정보부터</h3><p>사진과 후기보다 예약 경로, 가격, 소요 시간과 언어 지원 여부를 먼저 비교합니다.</p></article><article><span>03</span><h3>모르는 정보는 솔직하게</h3><p>확인되지 않았거나 오래된 정보는 숨기지 않고 다시 확인해야 한다고 안내합니다.</p></article></section>
    <div className="browse-link"><Link href="/ko/search">공개된 장소 전체 보기 →</Link></div>
  </main>;
}
