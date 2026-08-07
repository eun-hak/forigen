import Link from "next/link";
import { PublicHeader } from "@/components/public-header";

export default function KoreanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-shell ko"><PublicHeader locale="ko" />{children}<footer className="public-footer"><strong>K-Beauty Now</strong><span>외국인 방문객을 위한 서울 뷰티 예약 안내</span><span><Link href="/ko/legal/privacy">개인정보</Link> · <Link href="/ko/legal/terms">이용약관</Link></span></footer></div>;
}
