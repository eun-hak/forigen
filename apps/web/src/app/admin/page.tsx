import Link from "next/link";
import { getDashboardStats } from "@/lib/admin-api";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  return <div className="grid">
    <section><h1>데이터 검수 대시보드</h1><p className="muted">자동 수집 데이터는 승인 전까지 공개되지 않습니다.</p></section>
    <section className="grid stats">
      {Object.entries(stats).map(([status, count]) => <div className="panel stat" key={status}><span className={`badge ${status}`}>{status}</span><strong>{count}</strong></div>)}
    </section>
    <section className="panel"><h2>다음 작업</h2><p>후보를 승인한 뒤 장소 관리에서 공개 상태로 전환하세요.</p><div className="filters"><Link className="button" href="/admin/candidates">후보 검수</Link><Link className="button secondary" href="/admin/places">장소 공개 관리</Link></div></section>
  </div>;
}
