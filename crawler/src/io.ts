import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { crawlCandidateSchema, placeSeedSchema, type CrawlCandidate, type PlaceSeed } from "./domain.js";

async function ensureParent(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

export async function readPlaces(path: string): Promise<PlaceSeed[]> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(value)) throw new Error("Place input must be a JSON array");
  return value.map((item) => placeSeedSchema.parse(item));
}

export async function writePlaces(path: string, places: readonly PlaceSeed[]): Promise<void> {
  await ensureParent(path);
  await writeFile(path, `${JSON.stringify(places, null, 2)}\n`, "utf8");
}

export async function readCandidates(path: string): Promise<CrawlCandidate[]> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(value)) throw new Error("Candidate input must be a JSON array");
  return value.map((item) => crawlCandidateSchema.parse(item));
}

export async function writeCandidates(path: string, candidates: readonly CrawlCandidate[]): Promise<void> {
  await ensureParent(path);
  await writeFile(path, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
}
