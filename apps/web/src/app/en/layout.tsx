import Link from "next/link";
import { PublicHeader } from "@/components/public-header";

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-shell"><PublicHeader locale="en" />{children}<footer className="public-footer"><strong>K-Beauty Now</strong><span>Booking guidance for international visitors in Seoul.</span><span><Link href="/en/legal/privacy">Privacy</Link> · <Link href="/en/legal/terms">Terms</Link></span></footer></div>;
}
