#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const REPORT_PATH = fileURLToPath(new URL('../reports/providers-score-report.json', import.meta.url));
const OUT_PATH = fileURLToPath(new URL('../reports/indexer-settlement-payload.json', import.meta.url));

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const targetUrl = argValue('--to') || process.env.SENTINEL_INDEXER_PUBLISH_URL || null;
const token = process.env.SENTINEL_INDEXER_PUBLISH_TOKEN || null;

const report = JSON.parse(await readFile(REPORT_PATH, 'utf8'));
const endpoints = Array.isArray(report?.endpointScores) ? report.endpointScores : [];

const providers = endpoints
  .filter((p) => p && typeof p === 'object' && typeof p.url === 'string' && typeof p.method === 'string')
  .map((p) => {
    const attempts = toNumber(p?.paidProbe?.attempted ? 1 : p?.settlementSamples) ?? (p?.evidence?.settlementEvidence ? 1 : 0);
    const successes = p?.paidProbe?.success === true || p?.evidence?.settlementEvidence === true ? Math.max(1, attempts) : 0;
    const successRate = attempts > 0 ? successes / attempts : 0;

    return {
      name: p.name,
      url: p.url,
      method: String(p.method).toUpperCase(),
      settlementSamples: attempts,
      settlementSuccessRate: successRate,
      settlement: {
        attempts,
        successes,
        successRate,
        status: successes > 0 ? 'settled' : attempts > 0 ? 'failed' : 'unknown',
      },
      source: 'providers-score-report',
      sourceGeneratedAt: report.generatedAt,
    };
  });

const payload = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  sourceReportGeneratedAt: report.generatedAt ?? null,
  providers,
};

await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n');
console.log(`wrote ${OUT_PATH}`);

if (!targetUrl) {
  console.log('no publish target configured, skipping remote publish');
  process.exit(0);
}

const headers = { 'content-type': 'application/json' };
if (token) headers.authorization = `Bearer ${token}`;

const res = await fetch(targetUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const text = await res.text().catch(() => '');
  throw new Error(`publish failed: ${res.status} ${text}`);
}

console.log(`published settlement evidence to ${targetUrl}`);
