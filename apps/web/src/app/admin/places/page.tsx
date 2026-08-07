import Link from "next/link";
import { listAdminPlaces, type PlaceStatus } from "@/lib/admin-api";
import { setPlaceStatus } from "./actions";

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }
const value = (input: string | string[] | undefined) => typeof input === "string" ? input : "";
const labels: Record<PlaceStatus, string> = { draft: "초안", published: "공개", hidden: "숨김", closed: "폐업" };

export default async function AdminPlacesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = { status: value(params.status), area: value(params.area), category: value(params.category), query: value(params.query), page: Math.max(1, Number(value(params.page) || 1)) };
  const result = await listAdminPlaces(filters);
  const pageCount = Math.max(1, Math.ceil((result.count ?? 0) / 30));
  return <div>
    <div className="topbar"><div><h1>장소 관리</h1><p className="muted">총 {result.count ?? result.data.length}건 · 공개 상태인 장소만 사용자 API에 노출됩니다.</p></div></div>
    <form className="filters">
      <input className="input" name="query" placeholder="한글·영문 업체명 검색" defaultValue={filters.query} />
      <select className="input" name="status" defaultValue={filters.status}><option value="">전체 상태</option>{Object.entries(labels).map(([status, label]) => <option value={status} key={status}>{label}</option>)}</select>
      <select className="input" name="area" defaultValue={filters.area}><option value="">전체 지역</option><option value="hongdae">홍대</option><option value="myeongdong">명동</option><option value="gangnam">강남</option><option value="seongsu">성수</option></select>
      <select className="input" name="category" defaultValue={filters.category}><option value="">전체 업종</option><option value="hair">헤어</option><option value="nails">네일</option><option value="head_spa">헤드스파</option><option value="personal_color">퍼스널컬러</option></select>
      <button className="button">검색</button>
    </form>
    <div className="panel"><table><thead><tr><th>업체</th><th>지역·업종</th><th>현재 상태</th><th>공개 상태 변경</th><th>API</th></tr></thead><tbody>
      {result.data.map((place) => <tr key={place.id}>
        <td><Link href={`/admin/places/${place.id}`}><strong>{place.name_en ?? place.name_ko}</strong></Link>{place.name_en && <div className="muted">{place.name_ko}</div>}<div className="muted">{place.address_ko}</div></td>
        <td>{place.area}<br />{place.primary_category}</td>
        <td><span className={`badge ${place.status}`}>{labels[place.status]}</span>{place.published_at && <div className="muted">{new Date(place.published_at).toLocaleDateString("ko-KR")}</div>}</td>
        <td><form action={setPlaceStatus} className="filters" style={{ margin: 0 }}><input type="hidden" name="placeId" value={place.id} /><select className="input" name="status" defaultValue={place.status}>{Object.entries(labels).map(([status, label]) => <option value={status} key={status}>{label}</option>)}</select><button className="button secondary">적용</button></form></td>
        <td>{place.status === "published" ? <Link href={`/api/v1/places/${place.slug}`} target="_blank">JSON 보기</Link> : <span className="muted">비공개</span>}</td>
      </tr>)}
    </tbody></table>{result.data.length === 0 && <p className="muted">조건에 맞는 장소가 없습니다. 먼저 후보를 승인하세요.</p>}</div>
    <div className="filters" style={{ marginTop: 16 }}>{filters.page > 1 && <Link className="button secondary" href={`?${new URLSearchParams({ ...filters, page: String(filters.page - 1) })}`}>이전</Link>}<span>페이지 {filters.page}/{pageCount}</span>{filters.page < pageCount && <Link className="button secondary" href={`?${new URLSearchParams({ ...filters, page: String(filters.page + 1) })}`}>다음</Link>}</div>
  </div>;
}
