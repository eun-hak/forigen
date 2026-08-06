import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Config } from "./config.js";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
    (a === 172 && b !== undefined && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export async function assertPublicUrl(input: string): Promise<URL> {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed");
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) throw new Error("Local hosts are not allowed");
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`Private or unresolved host is not allowed: ${url.hostname}`);
  }
  return url;
}

export async function safeFetch(input: string, config: Config, maxRedirects = 5): Promise<Response> {
  let current = await assertPublicUrl(input);
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": config.CRAWLER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirect response did not include a location");
    current = await assertPublicUrl(new URL(location, current).toString());
  }
  throw new Error(`Too many redirects for ${input}`);
}
