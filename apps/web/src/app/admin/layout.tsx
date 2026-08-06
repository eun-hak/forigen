import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { requireAdmin } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();
  if (!user) redirect("/login");
  return <main className="shell">
    <header className="topbar">
      <div><Link href="/admin" style={{ textDecoration: "none" }}><strong>K-Beauty Now Admin</strong></Link><div className="muted">{user.email}</div></div>
      <nav style={{ display: "flex", gap: 10, alignItems: "center" }}><Link href="/admin/candidates">후보 검수</Link><Link href="/admin/places">장소 관리</Link><LogoutButton /></nav>
    </header>
    {children}
  </main>;
}
