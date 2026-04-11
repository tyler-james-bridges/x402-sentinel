import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const args = new Set(process.argv.slice(2));
const strictPayable = args.has('--strict-payable');
const denyInsufficientEvidence = args.has('--deny-insufficient-evidence');

const fixtureData = JSON.parse(
  await readFile(new URL('../fixtures/providers.json', import.meta.url), 'utf8'),
);

const providerPages = fixtureData.providerPages ?? [];
const payableEndpoints = fixtureData.payableEndpoints ?? [];

const RUBRIC_WEIGHTS = {
  protocolConformance: 25,
  reliabilityPerformance: 25,
  securityAbuseResistance: 20,
  economicIntegrity: 15,
  devexDiscovery: 10,
  operationalTransparency: 5,
};

function cleanBaseUrl(input) {
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

function gradeBand(total) {
  if (total >= 90) return 'trusted';
  if (total >= 80) return 'strong';
  if (total >= 70) return 'caution';
  if (total >= 60) return 'experimental';
  return 'high-risk';
}

function confidenceScore(evidenceCount, warningsCount) {
  const base = Math.min(95, 35 + evidenceCount * 15);
  return Math.max(20, base - warningsCount * 5);
}

function parsePrice(price) {
  if (!price) return null;
  const v = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : null;
}

async function discover(baseUrlInput) {
  const baseUrl = cleanBaseUrl(baseUrlInput);
  const warnings = [];

  try {
    const r = await fetch(`${baseUrl}/openapi.json`);
    if (r.ok) {
      const j = await r.json();
      const pathEntries = j?.paths && typeof j.paths === 'object' ? Object.entries(j.paths) : [];
      const samplePath = pathEntries[0]?.[0] ?? null;
      return { source: 'openapi', endpointCount: pathEntries.length, samplePath, warnings, baseUrl };
    }
    warnings.push(`openapi:${r.status}`);
  } catch {
    warnings.push('openapi:error');
  }

  try {
    const r = await fetch(`${baseUrl}/.well-known/x402`);
    if (r.ok) {
      const j = await r.json();
      const resources = Array.isArray(j?.resources) ? j.resources : [];
      return {
        source: 'well-known',
        endpointCount: resources.length,
        samplePath: resources[0] ?? null,
        warnings,
        baseUrl,
      };
    }
    warnings.push(`wellknown:${r.status}`);
  } catch {
    warnings.push('wellknown:error');
  }

  let status = 0;
  let responseTimeMs = 0;
  const started = Date.now();
  try {
    const r = await fetch(baseUrl, { method: 'GET' });
    status = r.status;
  } catch {
    status = -1;
  }
  responseTimeMs = Date.now() - started;

  return {
    source: 'endpoint',
    endpointCount: status === 402 ? 1 : 0,
    samplePath: null,
    status,
    responseTimeMs,
    warnings,
    baseUrl,
  };
}

async function probePayable(url, method = 'GET') {
  const started = Date.now();
  let status = -1;
  let challengeHeader = null;
  let authenticateHeader = null;
  let bodyText = '';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'POST' ? '{}' : undefined,
    });
    status = res.status;
    challengeHeader =
      res.headers.get('payment-required') ||
      res.headers.get('x-payment-required') ||
      null;
    authenticateHeader = res.headers.get('www-authenticate');
    bodyText = await res.text();
  } catch {
    status = -1;
  }
  const responseTimeMs = Date.now() - started;

  const bodyHash = bodyText
    ? createHash('sha256').update(bodyText).digest('hex').slice(0, 16)
    : null;

  const challengeEvidence = Boolean(challengeHeader || (authenticateHeader && authenticateHeader.toLowerCase().includes('payment')));
  const bodyEvidence = bodyText.includes('accepts') || bodyText.includes('x402') || bodyText.includes('payment');

  return {
    status,
    responseTimeMs,
    isX402Like: status === 402,
    challengeEvidence,
    bodyEvidence,
    bodyHash,
    evidenceRefs: [
      `status:${status}`,
      `challengeHeader:${challengeEvidence}`,
      `bodyEvidence:${bodyEvidence}`,
      `bodyHash:${bodyHash || 'none'}`,
    ],
  };
}

function scorePageDiscovery(result) {
  const categories = {
    protocolConformance: result.source === 'endpoint' && result.status !== 402 ? 8 : 20,
    reliabilityPerformance: result.responseTimeMs
      ? Math.max(8, 25 - Math.floor(result.responseTimeMs / 40))
      : 16,
    securityAbuseResistance: 10,
    economicIntegrity: 8,
    devexDiscovery: result.source === 'openapi' ? 10 : result.source === 'well-known' ? 7 : 3,
    operationalTransparency: result.source === 'openapi' || result.source === 'well-known' ? 4 : 2,
  };

  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  const evidence = {
    discoveryDoc: result.source !== 'endpoint',
    endpointCountEvidence: (result.endpointCount || 0) > 0,
    samplePathEvidence: Boolean(result.samplePath),
  };
  const evidenceCount =
    Number(evidence.discoveryDoc) +
    Number(evidence.endpointCountEvidence) +
    Number(evidence.samplePathEvidence);

  return {
    total,
    band: gradeBand(total),
    confidence: confidenceScore(evidenceCount, result.warnings.length),
    categories,
    evidence,
    gates: {
      protocolPass: categories.protocolConformance >= 20,
      reliabilityPass: categories.reliabilityPerformance >= 18,
      securityPass: categories.securityAbuseResistance >= 14,
      economicCriticalPass: categories.economicIntegrity >= 10,
    },
  };
}

function scorePayableProbe(result, price) {
  const priceValue = parsePrice(price);

  const categories = {
    protocolConformance: result.isX402Like ? 22 : 5,
    reliabilityPerformance: Math.max(8, 25 - Math.floor((result.responseTimeMs || 1000) / 40)),
    securityAbuseResistance: result.isX402Like ? 14 : 8,
    economicIntegrity:
      priceValue === null ? 6 : priceValue === 0 ? 6 : priceValue > 1000 ? 4 : 11,
    devexDiscovery: result.isX402Like ? 7 : 3,
    operationalTransparency: result.status > 0 ? 3 : 1,
  };

  const total = Object.values(categories).reduce((a, b) => a + b, 0);
  const evidence = {
    protocolEvidence: result.status > 0,
    challengeEvidence: Boolean(result.challengeEvidence),
    bodyEvidence: Boolean(result.bodyEvidence),
    timingEvidence: result.responseTimeMs > 0,
    priceEvidence: priceValue !== null,
  };
  const evidenceCount =
    Number(evidence.protocolEvidence) +
    Number(evidence.challengeEvidence) +
    Number(evidence.bodyEvidence) +
    Number(evidence.timingEvidence) +
    Number(evidence.priceEvidence);

  const gates = {
    protocolPass: categories.protocolConformance >= 20,
    reliabilityPass: categories.reliabilityPerformance >= 18,
    securityPass: categories.securityAbuseResistance >= 14,
    economicCriticalPass: categories.economicIntegrity >= 10 && evidence.priceEvidence,
  };

  return {
    total,
    band: gradeBand(total),
    confidence: confidenceScore(evidenceCount, 0),
    categories,
    evidence,
    gates,
  };
}

async function getCanaryEndpoints() {
  try {
    const res = await fetch('https://canary.0x402.sh/api/health');
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.endpoints)) return [];

    return data.endpoints
      .filter((e) => typeof e?.url === 'string')
      .map((e) => ({
        name: e.name || e.url,
        url: e.url,
        method: e.method || 'GET',
        price: e?.x402Details?.price,
      }));
  } catch {
    return [];
  }
}

const pageScores = [];
for (const p of providerPages) {
  const d = await discover(p.url);
  const s = scorePageDiscovery(d);
  pageScores.push({ type: 'page', name: p.name, url: p.url, ...d, ...s });
}

const canaryEndpoints = await getCanaryEndpoints();
const mergedPayables = [...payableEndpoints, ...canaryEndpoints]
  .reduce((acc, cur) => {
    const key = `${cur.method || 'GET'}::${cur.url}`;
    if (!acc.map.has(key)) {
      acc.map.set(key, true);
      acc.items.push(cur);
    }
    return acc;
  }, { map: new Map(), items: [] }).items;

const endpointScores = [];
for (const p of mergedPayables) {
  const probe = await probePayable(p.url, p.method || 'GET');
  const s = scorePayableProbe(probe, p.price);
  endpointScores.push({
    type: 'payable',
    name: p.name,
    url: p.url,
    method: p.method || 'GET',
    price: p.price || 'n/a',
    ...probe,
    ...s,
  });
}

pageScores.sort((a, b) => b.total - a.total);
endpointScores.sort((a, b) => b.total - a.total);

const selectedForRouting = endpointScores.filter(
  (e) =>
    e.isX402Like &&
    e.gates.protocolPass &&
    e.gates.reliabilityPass &&
    e.gates.securityPass &&
    e.gates.economicCriticalPass &&
    e.evidence.challengeEvidence,
);

const routingDecision = {
  denyInsufficientEvidence,
  allowed: selectedForRouting.length > 0 || !denyInsufficientEvidence,
  reason:
    selectedForRouting.length > 0
      ? 'at-least-one-provider-passed'
      : denyInsufficientEvidence
        ? 'no-provider-met-evidence-gates'
        : 'fallback-allowed',
};

const selectedEndpoints = strictPayable
  ? endpointScores
  : endpointScores.slice(0, Math.max(20, endpointScores.length));

const md = [
  '# Providers Score Snapshot',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Mode: ${strictPayable ? 'strict-payable' : 'catalog+payable'}`,
  `Rubric Weights: ${JSON.stringify(RUBRIC_WEIGHTS)}`,
  '',
  '## Provider Pages (catalog/discovery scoring)',
  '',
  '| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |',
  '|---|---:|---|---:|---|---:|---:|---:|',
  ...pageScores.map(
    (s) =>
      `| ${s.name} | ${s.total} | ${s.band} | ${s.confidence} | ${s.source} | ${s.endpointCount || 0} | ${s.status || ''} | ${s.responseTimeMs || ''}ms |`,
  ),
  '',
  '## Payable Endpoint Probes (routing candidates)',
  '',
  '| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence |',
  '|---|---|---:|---|---:|---:|---:|---|---|---|---|',
  ...selectedEndpoints.map(
    (s) =>
      `| ${s.name} | ${s.method} | ${s.total} | ${s.band} | ${s.confidence} | ${s.status} | ${s.responseTimeMs}ms | ${s.isX402Like ? 'yes' : 'no'} | ${s.price} | ${s.gates.economicCriticalPass ? 'pass' : 'fail'} | ${s.evidence.challengeEvidence ? 'yes' : 'no'} |`,
  ),
  '',
  `Total payable endpoints scored: ${endpointScores.length}`,
  `Routing candidates passing gates: ${selectedForRouting.length}`,
  `Routing decision: ${routingDecision.allowed ? 'allow' : 'deny'} (${routingDecision.reason})`,
  '',
].join('\n');

await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../reports/providers-score-report.json', import.meta.url),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      mode: strictPayable ? 'strict-payable' : 'catalog+payable',
      rubricWeights: RUBRIC_WEIGHTS,
      pageScores,
      endpointScores,
      selectedForRouting,
      routingDecision,
    },
    null,
    2,
  ),
);
await writeFile(new URL('../reports/providers-score-report.md', import.meta.url), md);

console.log('wrote reports/providers-score-report.json');
console.log('wrote reports/providers-score-report.md');
