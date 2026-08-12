import * as cheerio from "cheerio";
import { createRequire } from "node:module";
import type { Config } from "./config.js";
import { bookingChannelSchema, evidenceSchema, menuItemSchema, socialAccountSchema, type Evidence, type PlaceSeed } from "./domain.js";
import { safeFetch } from "./safe-fetch.js";

interface RobotsRules {
  isAllowed(url: string, userAgent?: string): boolean | undefined;
}

type RobotsParser = (url: string, content: string) => RobotsRules;
const robotsParser = createRequire(import.meta.url)("robots-parser") as RobotsParser;

const RULES: ReadonlyArray<{
  type: Evidence["attributeType"];
  pattern: RegExp;
  value: boolean | string;
  confidence: number;
  status?: Evidence["status"];
}> = [
  { type: "english_support", pattern: /(?:consultation|service|session|support|staff|speaks?|available|conducted|provided)[^.\n]{0,70}(?:in\s+)?english|(?:fully|entirely|available)\s+in\s+english/i, value: true, confidence: 0.82 },
  { type: "international_phone_supported", pattern: /(?:accept(?:s|ed)?|support(?:s|ed)?|enter|include)[^.\n]{0,50}(?:country\s*code|international\s+(?:phone|number))|(?:country\s*code|international\s+(?:phone|number))[^.\n]{0,50}(?:accepted|supported|required)/i, value: true, confidence: 0.76 },
  { type: "foreign_card", pattern: /(?:foreign|international|overseas)[^.\n]{0,50}(?:visa|mastercard|card)|(?:visa|mastercard)[^.\n]{0,50}(?:accepted|payment)/i, value: true, confidence: 0.76 },
  { type: "same_day_booking", pattern: /(?:same[ -]?day\s+(?:booking|appointment|reservation)[^.\n]{0,40}(?:accepted|available|supported)|(?:accept|support|offer)(?:s|ed)?[^.\n]{0,40}same[ -]?day|book\s+(?:for\s+)?today)/i, value: true, confidence: 0.78 },
  { type: "walk_in", pattern: /walk[ -]?ins?\s+(?:are\s+)?(?:accepted|available|welcome|supported)|accept(?:s|ed)?\s+walk[ -]?ins?/i, value: true, confidence: 0.8 },
  { type: "price_confirmed", pattern: /(?:₩|KRW|원)\s?[\d,]+|[\d,]+\s?(?:₩|KRW|원)/i, value: true, confidence: 0.86 },
  { type: "opening_hours", pattern: /(?:hours?|open)\s*[:\-]?[^.\n]{0,80}(?:am|pm|\d{1,2}:\d{2})/i, value: true, confidence: 0.7 },
];

export interface PageExtraction {
  url: string;
  title?: string;
  description?: string;
  text: string;
  links: string[];
  bookingUrl?: string;
  socialAccounts: NonNullable<PlaceSeed["socialAccounts"]>;
  bookingChannels: NonNullable<PlaceSeed["bookingChannels"]>;
  openingHoursText?: string;
  menuItems: NonNullable<PlaceSeed["menuItems"]>;
  evidence: Evidence[];
}

function socialAccount(link: string, checkedAt: string): NonNullable<PlaceSeed["socialAccounts"]>[number] | undefined {
  const url = new URL(link);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const platform = hostname === "instagram.com" ? "instagram" : hostname === "youtube.com" ? "youtube" : hostname === "tiktok.com" ? "tiktok" : undefined;
  if (!platform) return undefined;
  const firstSegment = url.pathname.split("/").filter(Boolean)[0];
  if (!firstSegment || ["p", "reel", "shorts", "watch", "share"].includes(firstSegment.toLowerCase())) return undefined;
  if (platform === "youtube" && !["channel", "user", "c"].includes(firstSegment.toLowerCase()) && !firstSegment.startsWith("@")) return undefined;
  return socialAccountSchema.parse({ platform, profileUrl: link, handle: firstSegment.replace(/^@/, ""), confidence: 0.96, discoveryMethod: "official_website_link", status: "candidate", checkedAt });
}

function bookingChannel(link: string, sourceUrl: string, checkedAt: string): NonNullable<PlaceSeed["bookingChannels"]>[number] | undefined {
  const url = new URL(link); const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const channelType = host === "booking.naver.com" || host === "m.booking.naver.com" ? "naver_booking" : host === "wa.me" || host === "api.whatsapp.com" ? "whatsapp" : host === "line.me" ? "line" : host === "pf.kakao.com" || host === "open.kakao.com" ? "kakao" : host === "instagram.com" ? "instagram_dm" : isBookingLink(link, sourceUrl) ? "website" : undefined;
  return channelType ? bookingChannelSchema.parse({ channelType, url: link, confidence: channelType === "website" ? 0.9 : 0.94, status: "candidate", checkedAt }) : undefined;
}

function extractMenuItems(text: string, sourceUrl: string, checkedAt: string): NonNullable<PlaceSeed["menuItems"]> {
  const items = new Map<string, NonNullable<PlaceSeed["menuItems"]>[number]>();
  const pattern = /([A-Za-z가-힣][A-Za-z가-힣\s+&()/-]{1,70}?)\s*(?:[:\-]|\.{2,})?\s*(?:(?:₩|KRW\s*)([1-9][\d,]{3,8})|([1-9][\d,]{3,8})\s*원)/gi;
  const servicePattern = /hair|cut|perm|color|dye|spa|scalp|care|treatment|nail|manicure|pedicure|consult|analysis|헤어|컷|펌|염색|탈색|스파|두피|케어|클리닉|트리트먼트|네일|매니큐어|페디큐어|상담|진단|퍼스널\s*컬러/i;
  for (const match of text.matchAll(pattern)) {
    const name = match[1]?.replace(/\s+/g, " ").trim(); const rawPrice = match[2] ?? match[3]; const price = Number(rawPrice?.replaceAll(",", ""));
    if (!name || !servicePattern.test(name) || price < 1_000 || price > 10_000_000) continue;
    const evidenceText = match[0].replace(/\s+/g, " ").trim();
    const item = menuItemSchema.parse({ name, price, currency: "KRW", evidenceText, sourceUrl, confidence: 0.72, status: "candidate", checkedAt });
    items.set(`${name.toLowerCase()}:${price}`, item);
    if (items.size >= 30) break;
  }
  return [...items.values()];
}

function sentenceAround(text: string, index: number, length: number): string {
  const start = Math.max(0, text.lastIndexOf(".", index) + 1, index - 160);
  const nextPeriod = text.indexOf(".", index + length);
  const end = Math.min(text.length, nextPeriod === -1 ? index + length + 160 : nextPeriod + 1, index + length + 220);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function absoluteLinks($: cheerio.CheerioAPI, base: URL): string[] {
  const links = new Set<string>();
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || /^(?:mailto:|tel:|javascript:|#)/i.test(href)) return;
    try {
      const url = new URL(href, base);
      if (["http:", "https:"].includes(url.protocol)) links.add(url.toString());
    } catch { /* Ignore malformed links. */ }
  });
  return [...links].slice(0, 200);
}

export function isBookingLink(link: string, sourceUrl: string): boolean {
  try {
    const url = new URL(link);
    const source = new URL(sourceUrl);
    const bookingPath = /(?:^|\/)(?:book(?:ing)?|reserv(?:e|ation)?|appointment)(?:\/|$)/i.test(url.pathname);
    if (url.origin === source.origin) return bookingPath;
    return ["booking.naver.com", "m.booking.naver.com", "creatrip.com", "www.creatrip.com", "klook.com", "www.klook.com", "trazy.com", "www.trazy.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function extractFromHtml(html: string, sourceUrl: string, checkedAt = new Date()): PageExtraction {
  const $ = cheerio.load(html);
  const links = absoluteLinks($, new URL(sourceUrl));
  $("script, style, noscript, svg, nav, footer").remove();
  const title = $("title").first().text().trim() || undefined;
  const description = $('meta[name="description"]').attr("content")?.trim() || undefined;
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const bookingUrl = links.find((link) => isBookingLink(link, sourceUrl));
  const checkedAtIso = checkedAt.toISOString();
  const socialAccounts = links.flatMap((link) => { try { const result = socialAccount(link, checkedAtIso); return result ? [result] : []; } catch { return []; } });
  const uniqueSocialAccounts = [...new Map(socialAccounts.map((item) => [`${item.platform}:${item.handle}`, item])).values()];
  const bookingChannels = links.flatMap((link) => { try { const result = bookingChannel(link, sourceUrl, checkedAtIso); return result ? [result] : []; } catch { return []; } });
  const uniqueBookingChannels = [...new Map(bookingChannels.map((item) => [`${item.channelType}:${item.url}`, item])).values()];
  const openingMatch = /(?:hours?|open|영업시간|운영시간)\s*[:\-]?\s*([^|]{3,180}?(?:am|pm|\d{1,2}:\d{2})[^|]{0,80})/i.exec(text);
  const openingHoursText = openingMatch?.[0].split(/(?:문의\s*전화|전화\s*문의|Contact)/i)[0]?.replace(/\s+/g, " ").trim().slice(0, 500);
  const menuItems = extractMenuItems(text, sourceUrl, checkedAtIso);
  const evidence: Evidence[] = [];
  for (const rule of RULES) {
    const match = rule.pattern.exec(text);
    if (!match?.[0] || match.index === undefined) continue;
    evidence.push(evidenceSchema.parse({
      attributeType: rule.type,
      value: rule.value,
      status: rule.status ?? "official_source",
      evidenceText: sentenceAround(text, match.index, match[0].length),
      sourceUrl,
      checkedAt: checkedAtIso,
      confidence: rule.confidence,
    }));
  }
  if (bookingUrl) evidence.push(evidenceSchema.parse({
    attributeType: "booking_channel",
    value: bookingUrl,
    status: "official_source",
    evidenceText: `Booking-related link found on the official page: ${bookingUrl}`,
    sourceUrl,
    checkedAt: checkedAtIso,
    confidence: 0.9,
  }));
  return { url: sourceUrl, ...(title ? { title } : {}), ...(description ? { description } : {}), text, links, ...(bookingUrl ? { bookingUrl } : {}), socialAccounts: uniqueSocialAccounts, bookingChannels: uniqueBookingChannels, ...(openingHoursText ? { openingHoursText } : {}), menuItems, evidence };
}

export async function collectOfficialPage(place: PlaceSeed, config: Config): Promise<PageExtraction | undefined> {
  if (!place.officialWebsite) return undefined;
  const target = new URL(place.officialWebsite);
  const robotsUrl = new URL("/robots.txt", target).toString();
  try {
    const robotsResponse = await safeFetch(robotsUrl, config);
    if (robotsResponse.ok) {
      const robots = robotsParser(robotsUrl, await robotsResponse.text());
      if (robots.isAllowed(target.toString(), config.CRAWLER_USER_AGENT) === false) {
        throw new Error(`robots.txt disallows collection: ${target.hostname}`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("robots.txt disallows")) throw error;
    // A missing or temporarily unreachable robots file does not assert a disallow rule.
  }
  const response = await safeFetch(place.officialWebsite, config);
  if (!response.ok) throw new Error(`Official page request failed: ${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 5_000_000) throw new Error("Page is larger than 5 MB");
  const html = await response.text();
  if (html.length > 5_000_000) throw new Error("Page is larger than 5 MB");
  return extractFromHtml(html, response.url || place.officialWebsite);
}
