import Link from "next/link";
import { getDashboardStats } from "@/lib/admin-api";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  return <div className="grid">
    <section><h1>데이터 검수 대시보드</h1><p className="muted">자동 수집 데이터는 승인 전까지 공개되지 않습니다.</p></section>
    <section className="grid stats">
      {Object.entries(stats).map(([status, count]) => <div className="panel stat" key={status}><span className={`badge ${status}`}>{status}</span><strong>{count}</strong></div>)}
    </section>
    <section className="panel"><h2>다음 작업</h2><p>후보의 공공데이터·Kakao·Naver 매칭과 근거를 비교한 뒤 수정하여 승인하세요.</p><Link className="button" href="/admin/candidates">후보 검수 시작</Link></section>
  </div>;
}
