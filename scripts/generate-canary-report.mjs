import { mkdir, writeFile } from 'node:fs/promises';

const CANARY_URL = 'https://canary.0x402.sh/api/health';

function parsePrice(price) {
  if (!price) return null;
  const v = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : null;
}

function scoreEndpoint(endpoint) {
  const priceValue = parsePrice(endpoint.x402Details?.price);

  const categories = {
    protocolConformance: endpoint.isX402 ? (endpoint.status === 402 ? 22 : 15) : 0,
    reliability: endpoint.isHealthy
      ? Math.max(8, Math.min(25, 25 - Math.floor((endpoint.responseTimeMs || 1000) / 40)))
      : 5,
    security: endpoint.isX402 ? 14 : 8,
    economicIntegrity:
      priceValue === null ? 8 : priceValue === 0 ? 6 : priceValue > 1000 ? 4 : 10,
    devexDiscovery: endpoint.isX402 ? 7 : 4,
    operationalTransparency: endpoint.isHealthy ? 4 : 2,
  };

  const total =
    categories.protocolConformance +
    categories.reliability +
    categories.security +
    categories.economicIntegrity +
    categories.devexDiscovery +
    categories.operationalTransparency;

  const band = total >= 90 ? 'trusted' : total >= 80 ? 'strong' : total >= 70 ? 'caution' : 'high-risk';

  return {
    name: endpoint.name,
    url: endpoint.url,
    status: endpoint.status,
    responseTimeMs: endpoint.responseTimeMs,
    isX402: endpoint.isX402,
    price: endpoint.x402Details?.price ?? 'n/a',
    total,
    band,
    confidence: 65,
    gates: {
      protocolPass: categories.protocolConformance >= 20,
      reliabilityPass: categories.reliability >= 18,
      securityPass: categories.security >= 14,
      economicCriticalPass: categories.economicIntegrity >= 10,
    },
    categories,
  };
}

function toMarkdown(summary, scored) {
  const top = scored.slice(0, 10);
  const bottom = scored.slice(-5);
  const row = (s) => `| ${s.name} | ${s.total} | ${s.band} | ${s.status} | ${s.responseTimeMs}ms | ${s.price} |`;

  return [
    '# Canary Provider Score Snapshot',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Total: ${summary.total}`,
    `- Online: ${summary.online}`,
    `- Degraded: ${summary.degraded}`,
    `- x402 Enabled: ${summary.x402Enabled}`,
    '',
    '## Top 10',
    '',
    '| Provider | Score | Band | Status | Latency | Price |',
    '|---|---:|---|---:|---:|---|',
    ...top.map(row),
    '',
    '## Bottom 5',
    '',
    '| Provider | Score | Band | Status | Latency | Price |',
    '|---|---:|---|---:|---:|---|',
    ...bottom.map(row),
    '',
    '> Note: v0 rubric preview using canary health payload, latency, and basic economics heuristics.',
    '',
  ].join('\n');
}

async function main() {
  const res = await fetch(CANARY_URL);
  if (!res.ok) throw new Error(`Canary fetch failed: ${res.status}`);
  const health = await res.json();

  const scored = health.endpoints.map(scoreEndpoint).sort((a, b) => b.total - a.total);

  await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../reports/canary-score-report.json', import.meta.url),
    JSON.stringify({ generatedAt: new Date().toISOString(), summary: health.summary, scored }, null, 2),
  );
  await writeFile(new URL('../reports/canary-score-report.md', import.meta.url), toMarkdown(health.summary, scored));

  console.log('wrote reports/canary-score-report.json');
  console.log('wrote reports/canary-score-report.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
