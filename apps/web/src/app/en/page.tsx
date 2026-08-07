import type { Metadata } from "next";
import Link from "next/link";
import { SearchWizard } from "@/components/search/search-wizard";

export const metadata: Metadata = {
  title: "K-Beauty Now — Find a beauty spot you can actually book",
  description: "Find verified K-beauty salons in Seoul with English support, foreign card information and booking conditions.",
  alternates: { canonical: "/en", languages: { en: "/en", ko: "/ko", "x-default": "/en" } },
};

export default function EnglishHomePage() {
  return <main>
    <section className="hero">
      <div className="eyebrow">SEOUL BEAUTY, MADE BOOKABLE</div>
      <h1>Find a K-beauty spot<br />you can <em>actually book.</em></h1>
      <p>Clear answers on English support, Korean phone requirements, foreign cards and same-day booking.</p>
      <div className="trust-row"><span>✓ Easy to compare</span><span>✓ Foreigner-first</span><span>✓ Honest about unknowns</span></div>
    </section>
    <section className="search-section"><div className="section-heading"><div><span className="eyebrow">START HERE</span><h2>Build your beauty plan</h2></div><p>Four quick choices. No account needed.</p></div><SearchWizard /></section>
    <section className="promise-grid">
      <article><span>01</span><h3>Not just “foreigner friendly”</h3><p>Each booking condition is checked and shown separately, so you know what is confirmed.</p></article>
      <article><span>02</span><h3>Designed for real decisions</h3><p>Compare booking routes, price ranges and communication options before you travel.</p></article>
      <article><span>03</span><h3>Honest about uncertainty</h3><p>If something is likely or outdated, we say so. No false promises about live availability.</p></article>
    </section>
    <div className="browse-link"><Link href="/en/search">Browse every published spot →</Link></div>
  </main>;
}
