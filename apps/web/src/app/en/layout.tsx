import Link from "next/link";
import { PublicHeader } from "@/components/public-header";

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-shell"><PublicHeader locale="en" />{children}<footer className="public-footer"><strong>K-Beauty Now</strong><span>Verified booking conditions for international visitors in Seoul.</span><span><Link href="/en/legal/privacy">Privacy</Link> · <Link href="/en/legal/terms">Terms</Link> · <Link href="/en/legal/data-sources">Data sources</Link></span></footer></div>;
}
