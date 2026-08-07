interface StatusPresentation { label: string; tone: "verified" | "likely" | "unknown" | "outdated" }
const unknownStatus: StatusPresentation = { label: "Not confirmed", tone: "unknown" };
const statusLabels: Record<string, StatusPresentation> = {
  business_confirmed: { label: "Confirmed by the business", tone: "verified" },
  official_source: { label: "Confirmed on the official website", tone: "verified" },
  visitor_confirmed: { label: "Confirmed by an international visitor", tone: "verified" },
  confirmed: { label: "Confirmed", tone: "verified" },
  likely: { label: "Likely — confirm before visiting", tone: "likely" },
  expired: { label: "Information may be outdated", tone: "outdated" },
  unknown: { label: "Not confirmed", tone: "unknown" },
  unverified: { label: "Not confirmed", tone: "unknown" },
};

export function verificationPresentation(status: string, expiresAt?: string | null) {
  if (expiresAt && Date.parse(expiresAt) < Date.now()) return statusLabels.expired ?? unknownStatus;
  return statusLabels[status] ?? unknownStatus;
}

export function attributeLabel(type: string) {
  return ({
    english_support: "English support",
    korean_phone_required: "Korean phone number",
    international_phone_supported: "International phone number",
    foreign_card: "Foreign-issued cards",
    same_day_booking: "Same-day requests",
    walk_in: "Walk-ins",
    solo_friendly: "Solo visitors",
    price_confirmed: "Price information",
  } as Record<string, string>)[type] ?? type.replaceAll("_", " ");
}

export function humanValue(type: string, value: unknown) {
  if (type === "korean_phone_required") return value === false ? "Not required" : value === true ? "Required" : "Not confirmed";
  if (typeof value === "boolean") return value ? "Supported" : "Not supported";
  return typeof value === "string" ? value.replaceAll("_", " ") : "Not confirmed";
}
