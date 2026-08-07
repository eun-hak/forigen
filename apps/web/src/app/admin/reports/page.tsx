import Link from "next/link";
import { listChangeReports } from "@/lib/admin-api";
import { processReport } from "./actions";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status = (await searchParams).status ?? "pending"; const reports = (await listChangeReports(status)).data;
  return <div className="grid"><div><h1>변경 제보</h1><p className="muted">사용자 제보는 자동 반영하지 않고 검토 후 처리합니다.</p><p><Link href="?status=pending">대기</Link> · <Link href="?status=resolved">처리 완료</Link> · <Link href="?status=rejected">반려</Link></p></div>{reports.length === 0 ? <section className="panel">제보가 없습니다.</section> : reports.map((report) => <section className="panel" key={report.id}><div className="section-title-row"><div><strong>{report.places?.name_ko ?? report.place_id}</strong><p className="muted">{report.report_type} · {new Date(report.created_at).toLocaleString("ko-KR")}</p></div>{report.places && <Link href={`/admin/places/${report.place_id}`}>장소 편집 →</Link>}</div><p style={{ whiteSpace: "pre-wrap" }}>{report.message}</p>{report.source_url && <p><a href={report.source_url} target="_blank" rel="noreferrer">제보 근거 보기 ↗</a></p>}{report.status === "pending" && <form action={processReport} className="admin-form"><input type="hidden" name="id" value={report.id} /><label className="wide">처리 메모<input className="input" name="note" /></label><button className="button" name="status" value="resolved">처리 완료</button><button className="button secondary" name="status" value="rejected">반려</button></form>}</section>)}</div>;
}
