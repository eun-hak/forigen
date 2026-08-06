import Link from "next/link";
import { listCandidates } from "@/lib/admin-api";
import { candidatePlaceView } from "@/lib/candidate";

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }
const value = (input: string | string[] | undefined) => typeof input === "string" ? input : "";

export default async function CandidatesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = { status: value(params.status) || "pending", area: value(params.area), category: value(params.category), query: value(params.query), page: Number(value(params.page) || 1) };
  const result = await listCandidates(filters);
  const pageCount = Math.max(1, Math.ceil((result.count ?? 0) / 30));
  return <div>
    <div className="topbar"><div><h1>후보 검수</h1><p className="muted">총 {result.count ?? result.data.length}건</p></div></div>
    <form className="filters">
      <input className="input" name="query" placeholder="업체명 검색" defaultValue={filters.query} />
      <select className="input" name="status" defaultValue={filters.status}><option value="pending">검수 대기</option><option value="needs_revision">재조사</option><option value="approved">승인</option><option value="rejected">반려</option></select>
      <select className="input" name="area" defaultValue={filters.area}><option value="">전체 지역</option><option value="hongdae">홍대</option><option value="myeongdong">명동</option><option value="gangnam">강남</option><option value="seongsu">성수</option></select>
      <select className="input" name="category" defaultValue={filters.category}><option value="">전체 업종</option><option value="hair">헤어</option><option value="nails">네일</option><option value="head_spa">헤드스파</option><option value="personal_color">퍼스널컬러</option></select>
      <button className="button">검색</button>
    </form>
    <div className="panel"><table><thead><tr><th>업체</th><th>지역·업종</th><th>매칭</th><th>신뢰도</th><th>상태</th></tr></thead><tbody>
      {result.data.map((candidate) => {
        const place = candidatePlaceView(candidate.extracted_data);
        return <tr key={candidate.id}>
          <td><Link href={`/admin/candidates/${candidate.id}`}><strong>{candidate.place_name}</strong></Link><div className="muted">{place.address}</div></td>
          <td>{place.area}<br />{place.category}</td>
          <td>Kakao {place.kakaoScore}<br />Naver {place.naverScore}</td>
          <td>{candidate.confidence ?? "-"}</td><td><span className={`badge ${candidate.status}`}>{candidate.status}</span></td>
        </tr>;
      })}
    </tbody></table>{result.data.length === 0 && <p className="muted">조건에 맞는 후보가 없습니다.</p>}</div>
    <div className="filters" style={{ marginTop: 16 }}>{filters.page > 1 && <Link className="button secondary" href={`?${new URLSearchParams({ ...filters, page: String(filters.page - 1) })}`}>이전</Link>}<span>페이지 {filters.page}/{pageCount}</span>{filters.page < pageCount && <Link className="button secondary" href={`?${new URLSearchParams({ ...filters, page: String(filters.page + 1) })}`}>다음</Link>}</div>
  </div>;
}
