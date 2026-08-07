import Link from "next/link";

export function PublicHeader() {
  return <header className="public-header">
    <Link href="/en" className="brand"><span className="brand-mark">K</span><span>K-Beauty Now</span></Link>
    <nav><Link href="/en/search">Explore spots</Link><Link href="/admin" className="admin-link">Admin</Link></nav>
  </header>;
}
