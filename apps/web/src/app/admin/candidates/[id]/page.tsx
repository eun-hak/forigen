import Link from "next/link";
import { notFound } from "next/navigation";
import { approveCandidateAction, saveCandidate, setCandidateStatus } from "../actions";
import { getCandidate } from "@/lib/admin-api";

interface Props { params: Promise<{ id: string }> }

function externalLink(label: string, value: unknown) {
  if (typeof value !== "string" || !value.startsWith("http")) return null;
  return <a className="button secondary" href={value} target="_blank" rel="noreferrer">{label}</a>;
}

export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();
  const place = candidate.extracted_data.place as Record<string, unknown> | undefined;
  const kakao = place?.kakaoMatch as Record<string, unknown> | undefined;
  const naver = place?.naverMatch as Record<string, unknown> | undefined;
  const evidence = Array.isArray(candidate.extracted_data.evidence) ? candidate.extracted_data.evidence : [];
  const socials = Array.isArray(place?.socialAccounts) ? place.socialAccounts as Array<Record<string, unknown>> : [];
  const channels = Array.isArray(place?.bookingChannels) ? place.bookingChannels as Array<Record<string, unknown>> : [];
  const menuItems = Array.isArray(place?.menuItems) ? place.menuItems as Array<Record<string, unknown>> : [];
  const editableJson = JSON.stringify(candidate.extracted_data, null, 2);
  return <div className="grid">
    <div className="topbar"><div><Link href="/admin/candidates">← 목록</Link><h1>{candidate.place_name}</h1><span className={`badge ${candidate.status}`}>{candidate.status}</span></div></div>
    <div className="grid detail-grid">
      <section className="grid">
        <div className="panel"><h2>원본과 매칭</h2><dl>
          <dt className="muted">공공데이터 주소</dt><dd>{String(place?.roadAddressKo ?? place?.addressKo ?? "-")}</dd>
          <dt className="muted">전화번호</dt><dd>{String(place?.phone ?? "-")}</dd>
          <dt className="muted">Kakao</dt><dd>{String(kakao?.name ?? "미확인")} · 점수 {String(kakao?.score ?? "-")}</dd>
          <dt className="muted">Naver</dt><dd>{String(naver?.title ?? "미확인")} · 점수 {String(naver?.score ?? "-")}</dd>
        </dl><div className="filters">{externalLink("Kakao 열기", kakao?.url)}{externalLink("Naver/공식 채널", naver?.link)}{externalLink("수집 페이지", candidate.source_url)}</div></div>
        <div className="panel"><h2>자동 추출 근거</h2>{evidence.length === 0 ? <p className="muted">추출된 근거가 없습니다. 링크를 직접 확인하세요.</p> : evidence.map((item, index) => {
          const row = item as Record<string, unknown>;
          return <article key={index} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}><strong>{String(row.attributeType)}</strong> · {String(row.status)} · {String(row.confidence)}<p>{String(row.evidenceText)}</p>{externalLink("출처", row.sourceUrl)}</article>;
        })}</div>
        <div className="panel"><h2>디지털 채널 후보</h2>
          {socials.length === 0 && channels.length === 0 ? <p className="muted">발견된 채널이 없습니다.</p> : <div className="grid">
            {socials.map((item, index) => <div key={`social-${index}`}><strong>{String(item.platform)}</strong> · {String(item.confidence)} {externalLink("프로필 확인", item.profileUrl)}</div>)}
            {channels.map((item, index) => <div key={`channel-${index}`}><strong>{String(item.channelType)}</strong> · {String(item.confidence)} {externalLink("채널 확인", item.url)}</div>)}
          </div>}
        </div>
        <div className="panel"><h2>메뉴·영업시간 후보</h2><p>{String(place?.openingHoursText ?? "영업시간 미발견")}</p>
          {menuItems.length === 0 ? <p className="muted">구조화된 가격 후보가 없습니다.</p> : <ul>{menuItems.slice(0, 30).map((item, index) => <li key={index}>{String(item.name)} — ₩{Number(item.price).toLocaleString("ko-KR")} · {String(item.confidence)}</li>)}</ul>}
        </div>
      </section>
      <section className="panel"><h2>공개 데이터 편집</h2><p className="muted">JSON을 수정한 뒤 저장하거나 승인합니다. 승인된 장소는 draft로 생성됩니다.</p>
        <form className="grid"><input type="hidden" name="candidateId" value={candidate.id} /><label>검수 메모<textarea className="input" name="note" defaultValue={candidate.review_note ?? ""} /></label><label>추출 데이터 JSON<textarea className="input" name="extractedData" defaultValue={editableJson} style={{ minHeight: 520, fontFamily: "monospace" }} /></label>
          <div className="filters"><button className="button secondary" formAction={saveCandidate}>저장</button>{candidate.status !== "approved" && <button className="button" formAction={approveCandidateAction}>승인</button>}<button className="button secondary" name="status" value="needs_revision" formAction={setCandidateStatus}>재조사</button><button className="button danger" name="status" value="rejected" formAction={setCandidateStatus}>반려</button></div>
        </form>
      </section>
    </div>
  </div>;
}
