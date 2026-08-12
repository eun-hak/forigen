import { resolve } from "node:path";
import { config } from "./config.js";
import { createCandidate } from "./candidate.js";
import { classifyPlaces } from "./classify.js";
import { promoteIndependentWebsites } from "./channels.js";
import { dedupePlaces } from "./dedupe.js";
import { collectOfficialPage } from "./extract.js";
import { readCandidates, readPlaces, writeCandidates, writePlaces } from "./io.js";
import { enrichWithKakao } from "./kakao.js";
import { enrichWithNaver } from "./naver.js";
import { applyWebsiteOverrides } from "./overrides.js";
import { fetchPublicData, readPublicDataCsv } from "./public-data.js";
import { mapConcurrent, withRetry } from "./runner.js";
import { buildBalancedShortlist, writeShortlistCsv } from "./shortlist.js";
import { syncApprovedEnrichment, uploadCandidates } from "./upload.js";

function usage(): never {
  console.error(`Usage:
  pnpm crawl import-csv --input FILE [--output FILE]
  pnpm crawl import-api [--page N] [--rows N] [--output FILE]
  pnpm crawl classify --input PLACES.json [--output FILE]
  pnpm crawl apply-websites --input PLACES.json --websites websites.csv [--output FILE]
  pnpm crawl enrich-kakao --input PLACES.json [--output FILE]
  pnpm crawl enrich-naver --input PLACES.json [--limit N] [--output FILE]
  pnpm crawl promote-websites --input PLACES.json [--output FILE]
  pnpm crawl shortlist --input PLACES.json [--limit 300] [--output FILE]
  pnpm crawl collect --input PLACES.json [--output FILE]
  pnpm crawl upload --input CANDIDATES.json
  pnpm crawl sync-enrichment --input CANDIDATES.json
  pnpm crawl pipeline --input LOCALDATA.csv [--websites websites.csv] [--kakao] [--naver] [--output FILE]`);
  process.exit(1);
}

function argsOf(values: readonly string[]): Map<string, string | true> {
  const args = new Map<string, string | true>();
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value?.startsWith("--")) continue;
    const next = values[index + 1];
    if (next && !next.startsWith("--")) { args.set(value.slice(2), next); index += 1; }
    else args.set(value.slice(2), true);
  }
  return args;
}

const invocationDirectory = process.env.INIT_CWD ?? process.cwd();

function resolveUserPath(path: string): string {
  return resolve(invocationDirectory, path);
}

function required(args: Map<string, string | true>, key: string): string {
  const value = args.get(key);
  if (typeof value !== "string") throw new Error(`--${key} is required`);
  return resolveUserPath(value);
}

function outputPath(args: Map<string, string | true>, fallback: string): string {
  const value = args.get("output");
  return resolveUserPath(typeof value === "string" ? value : `${config.CRAWLER_OUTPUT_DIR}/${fallback}`);
}

async function collect(places: Awaited<ReturnType<typeof readPlaces>>) {
  const collectionErrors: Array<{ index: number; message: string }> = [];
  const result = await mapConcurrent(places, config.CRAWLER_CONCURRENCY, async (place, index) => {
    try {
      const page = await withRetry(() => collectOfficialPage(place, config));
      return createCandidate(place, page);
    } catch (error) {
      collectionErrors.push({ index, message: error instanceof Error ? error.message : String(error) });
      return createCandidate(place);
    }
  });
  return { values: result.values, errors: [...collectionErrors, ...result.errors] };
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) usage();
  const args = argsOf(rest);
  if (command === "import-csv") {
    const places = dedupePlaces(await readPublicDataCsv(required(args, "input")));
    const output = outputPath(args, "places.json");
    await writePlaces(output, places);
    console.log(JSON.stringify({ imported: places.length, output }));
    return;
  }
  if (command === "import-api") {
    const page = Number(args.get("page") ?? 1);
    const rows = Number(args.get("rows") ?? 1000);
    const places = dedupePlaces(await fetchPublicData(config, page, rows));
    const output = outputPath(args, "places.json");
    await writePlaces(output, places);
    console.log(JSON.stringify({ imported: places.length, output }));
    return;
  }
  if (command === "classify") {
    const result = classifyPlaces(await readPlaces(required(args, "input")));
    const output = outputPath(args, "places-classified.json");
    await writePlaces(output, result.included);
    console.log(JSON.stringify({ included: result.included.length, excluded: result.excluded.length, output }));
    return;
  }
  if (command === "apply-websites") {
    const places = await applyWebsiteOverrides(await readPlaces(required(args, "input")), required(args, "websites"));
    const output = outputPath(args, "places-with-websites.json");
    await writePlaces(output, places);
    console.log(JSON.stringify({ places: places.length, withWebsite: places.filter((place) => place.officialWebsite).length, output }));
    return;
  }
  if (command === "enrich-kakao") {
    const allPlaces = await readPlaces(required(args, "input"));
    const limit = Number(args.get("limit") ?? allPlaces.length);
    const places = allPlaces.slice(0, limit);
    let completed = 0;
    const result = await mapConcurrent(places, config.CRAWLER_CONCURRENCY, async (place) => {
      const enriched = await withRetry(() => enrichWithKakao(place, config));
      completed += 1;
      if (completed % 100 === 0 || completed === places.length) console.error(`Kakao enrichment: ${completed}/${places.length}`);
      return enriched;
    });
    const output = outputPath(args, "places-enriched.json");
    await writePlaces(output, result.values);
    const matched = result.values.filter((place) => place.kakaoMatch);
    const unmatched = result.values.filter((place) => !place.kakaoMatch);
    const matchedOutput = outputPath(new Map([["output", output.replace(/\.json$/i, "-matched.json")]]), "kakao-matched.json");
    const unmatchedOutput = outputPath(new Map([["output", output.replace(/\.json$/i, "-unmatched.json")]]), "kakao-unmatched.json");
    await writePlaces(matchedOutput, matched);
    await writePlaces(unmatchedOutput, unmatched);
    console.log(JSON.stringify({ processed: result.values.length, matched: matched.length, unmatched: unmatched.length, errors: result.errors.length, output, matchedOutput, unmatchedOutput }));
    return;
  }
  if (command === "enrich-naver") {
    const allPlaces = await readPlaces(required(args, "input"));
    const limit = Number(args.get("limit") ?? allPlaces.length);
    const places = allPlaces.slice(0, limit);
    let completed = 0;
    const result = await mapConcurrent(places, 1, async (place) => {
      const enriched = await withRetry(() => enrichWithNaver(place, config));
      completed += 1;
      if (completed % 100 === 0 || completed === places.length) console.error(`Naver enrichment: ${completed}/${places.length}`);
      return enriched;
    });
    const output = outputPath(args, "places-naver-enriched.json");
    await writePlaces(output, result.values);
    console.log(JSON.stringify({ processed: result.values.length, matched: result.values.filter((place) => place.naverMatch).length, linked: result.values.filter((place) => place.naverMatch?.link).length, errors: result.errors.length, errorSamples: result.errors.slice(0, 5), output }));
    return;
  }
  if (command === "promote-websites") {
    const places = promoteIndependentWebsites(await readPlaces(required(args, "input")));
    const output = outputPath(args, "places-with-websites.json");
    await writePlaces(output, places);
    console.log(JSON.stringify({ places: places.length, promoted: places.filter((place) => place.officialWebsite).length, output }));
    return;
  }
  if (command === "shortlist") {
    const limit = Number(args.get("limit") ?? 300);
    const items = buildBalancedShortlist(await readPlaces(required(args, "input")), limit);
    const output = outputPath(args, "research-shortlist.csv");
    const jsonOutput = output.replace(/\.csv$/i, ".json");
    await writeShortlistCsv(output, items);
    await writePlaces(jsonOutput, items.map(({ place }) => place));
    console.log(JSON.stringify({ shortlisted: items.length, output, jsonOutput }));
    return;
  }
  if (command === "collect") {
    const result = await collect(await readPlaces(required(args, "input")));
    const output = outputPath(args, "candidates.json");
    await writeCandidates(output, result.values);
    console.log(JSON.stringify({ candidates: result.values.length, errors: result.errors, output }));
    return;
  }
  if (command === "upload") {
    const count = await uploadCandidates(await readCandidates(required(args, "input")), config);
    console.log(JSON.stringify({ uploaded: count }));
    return;
  }
  if (command === "sync-enrichment") {
    const result = await syncApprovedEnrichment(await readCandidates(required(args, "input")), config);
    console.log(JSON.stringify(result));
    return;
  }
  if (command === "pipeline") {
    let places = dedupePlaces(await readPublicDataCsv(required(args, "input")));
    const websites = args.get("websites");
    if (typeof websites === "string") places = await applyWebsiteOverrides(places, resolveUserPath(websites));
    if (args.has("kakao")) {
      const enriched = await mapConcurrent(places, config.CRAWLER_CONCURRENCY, (place) => withRetry(() => enrichWithKakao(place, config)));
      places = enriched.values;
    }
    if (args.has("naver")) {
      const enriched = await mapConcurrent(places, 1, (place) => withRetry(() => enrichWithNaver(place, config)));
      places = promoteIndependentWebsites(enriched.values);
    }
    const result = await collect(places);
    const output = outputPath(args, "candidates.json");
    await writeCandidates(output, result.values);
    console.log(JSON.stringify({ places: places.length, candidates: result.values.length, errors: result.errors, output }));
    return;
  }
  usage();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
