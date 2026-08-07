import { PublicHeader } from "@/components/public-header";

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-shell"><PublicHeader />{children}<footer className="public-footer"><strong>K-Beauty Now</strong><span>Verified booking conditions for international visitors in Seoul.</span></footer></div>;
}
