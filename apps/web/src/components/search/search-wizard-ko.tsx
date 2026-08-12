const categories = [["hair", "헤어", "커트·염색·스타일링"], ["nails", "네일", "네일아트·손발 관리"], ["head_spa", "헤드스파", "두피 관리·휴식"], ["personal_color", "퍼스널컬러", "컬러 진단"]] as const;
const areas = [["hongdae", "홍대", "활기차고 트렌디한 지역"], ["myeongdong", "명동", "서울 중심의 편리한 지역"], ["gangnam", "강남", "프리미엄 뷰티숍 밀집 지역"], ["seongsu", "성수", "감각적이고 여유로운 지역"]] as const;

export function SearchWizardKo() {
  return <form className="wizard" action="/ko/search">
    <fieldset className="wizard-step"><legend><span>01</span> 언제 방문하나요?</legend><div className="choice-grid compact"><label className="choice"><input type="radio" name="when" value="today" defaultChecked /><strong>오늘</strong><small>당일 문의 가능한 곳 찾기</small></label><label className="choice"><input type="radio" name="when" value="tomorrow" /><strong>내일</strong><small>하루 전에 계획하기</small></label><label className="choice"><input type="radio" name="when" value="later" /><strong>나중에</strong><small>검증된 장소 모두 둘러보기</small></label></div></fieldset>
    <fieldset className="wizard-step"><legend><span>02</span> 어떤 시술을 원하나요?</legend><div className="choice-grid">{categories.map(([value, title, hint], index) => <label className="choice" key={value}><input type="radio" name="category" value={value} defaultChecked={index === 0} /><strong>{title}</strong><small>{hint}</small></label>)}</div></fieldset>
    <fieldset className="wizard-step"><legend><span>03</span> 어느 지역인가요?</legend><div className="choice-grid">{areas.map(([value, title, hint], index) => <label className="choice" key={value}><input type="radio" name="area" value={value} defaultChecked={index === 0} /><strong>{title}</strong><small>{hint}</small></label>)}</div></fieldset>
    <button className="search-cta" type="submit">선택한 장소 보기 <span aria-hidden="true">→</span></button><p className="form-note">선택한 시술과 지역에 맞는 공개 장소를 보여드립니다.</p>
  </form>;
}
