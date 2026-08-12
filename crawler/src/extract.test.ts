import { describe, expect, it } from "vitest";
import { extractFromHtml, isBookingLink } from "./extract.js";

describe("extractFromHtml", () => {
  it("extracts evidence with its official source", () => {
    const result = extractFromHtml(`
      <html><head><title>Salon</title></head><body>
      <main><p>Our consultation is fully available in English.</p>
      <p>Hair cut ₩40,000. Walk-ins are accepted.</p>
      <a href="/booking">Book now</a></main>
      <footer><a href="https://www.instagram.com/salon_official/">Instagram</a></footer></body></html>
    `, "https://example.com/en", new Date("2026-08-06T00:00:00.000Z"));
    expect(result.bookingUrl).toBe("https://example.com/booking");
    expect(result.evidence.map((item) => item.attributeType)).toEqual(expect.arrayContaining([
      "english_support", "walk_in", "price_confirmed", "booking_channel",
    ]));
    expect(result.socialAccounts).toEqual([expect.objectContaining({ platform: "instagram", handle: "salon_official", confidence: 0.96 })]);
    expect(result.bookingChannels).toEqual(expect.arrayContaining([expect.objectContaining({ channelType: "website" }), expect.objectContaining({ channelType: "instagram_dm" })]));
    expect(result.menuItems).toEqual(expect.arrayContaining([expect.objectContaining({ price: 40000, currency: "KRW" })]));
  });

  it("does not promote social or shopping links to booking channels", () => {
    expect(isBookingLink("https://www.facebook.com/example", "https://example.com")).toBe(false);
    expect(isBookingLink("https://search.shopping.naver.com/book/catalog/1", "https://example.com")).toBe(false);
    expect(isBookingLink("https://booking.naver.com/booking/13/bizes/1", "https://example.com")).toBe(true);
    expect(isBookingLink("https://example.com/reservation", "https://example.com")).toBe(true);
  });

  it("does not treat years, revenue, phone numbers, or video links as enrichment", () => {
    const result = extractFromHtml(`<body><p>SINCE 1998. Revenue 3,000. Call 1544-1234.</p><a href="https://youtu.be/video-id">Video</a></body>`, "https://example.com");
    expect(result.menuItems).toEqual([]);
    expect(result.socialAccounts).toEqual([]);
  });
});
