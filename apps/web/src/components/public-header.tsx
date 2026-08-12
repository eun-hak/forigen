import Link from "next/link";

export function PublicHeader({ locale = "en" }: { locale?: "en" | "ko" }) {
  const korean = locale === "ko";
  return <header className="public-header">
    <Link href={`/${locale}`} className="brand"><span className="brand-mark">K</span><span>K-Beauty Now</span></Link>
    <nav><Link href={`/${locale}/search`}>{korean ? "장소 둘러보기" : "Explore spots"}</Link><Link href={`/${locale}/map`}>{korean ? "지도로 보기" : "View map"}</Link><Link href={korean ? "/en" : "/ko"} className="language-link">{korean ? "EN" : "한국어"}</Link><Link href="/admin" className="admin-link">Admin</Link></nav>
  </header>;
}
