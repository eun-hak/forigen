const categories = [
  ["hair", "Hair", "Cut, color & styling"],
  ["nails", "Nails", "Nail art & care"],
  ["head_spa", "Head spa", "Scalp care & relaxation"],
  ["personal_color", "Personal color", "Color analysis"],
] as const;

const areas = [
  ["hongdae", "Hongdae", "Youthful & creative"],
  ["myeongdong", "Myeongdong", "Central & convenient"],
  ["gangnam", "Gangnam", "Premium & polished"],
  ["seongsu", "Seongsu", "Trendy & relaxed"],
] as const;

export function SearchWizard() {
  return <form className="wizard" action="/en/search">
    <fieldset className="wizard-step">
      <legend><span>01</span> When are you going?</legend>
      <div className="choice-grid compact">
        <label className="choice"><input type="radio" name="when" value="today" defaultChecked /><strong>Today</strong><small>Find flexible options</small></label>
        <label className="choice"><input type="radio" name="when" value="tomorrow" /><strong>Tomorrow</strong><small>Plan one day ahead</small></label>
        <label className="choice"><input type="radio" name="when" value="later" /><strong>Later</strong><small>Browse all verified spots</small></label>
      </div>
    </fieldset>
    <fieldset className="wizard-step">
      <legend><span>02</span> What do you want?</legend>
      <div className="choice-grid">{categories.map(([value, title, hint], index) => <label className="choice" key={value}><input type="radio" name="category" value={value} defaultChecked={index === 0} /><strong>{title}</strong><small>{hint}</small></label>)}</div>
    </fieldset>
    <fieldset className="wizard-step">
      <legend><span>03</span> Where in Seoul?</legend>
      <div className="choice-grid">{areas.map(([value, title, hint], index) => <label className="choice" key={value}><input type="radio" name="area" value={value} defaultChecked={index === 0} /><strong>{title}</strong><small>{hint}</small></label>)}</div>
    </fieldset>
    <button className="search-cta" type="submit">Show matching spots <span aria-hidden="true">→</span></button>
    <p className="form-note">We’ll show published places matching your selected service and area.</p>
  </form>;
}
