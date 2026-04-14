import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const strictPayable = args.has('--strict-payable');
const denyInsufficientEvidence = args.has('--deny-insufficient-evidence');
const withPayment = args.has('--with-payment');

function getArgValue(flag, fallback) {
  const idx = rawArgs.indexOf(flag);
  if (idx >= 0 && rawArgs[idx + 1]) return rawArgs[idx + 1];
  return fallback;
}

const maxPaymentUsd = Number(getArgValue('--max-payment', '0.01'));
const paymentLimit = Number(getArgValue('--payment-limit', '3'));

const REPORTS_DIR_URL = new URL('../reports/', import.meta.url);
const PROVIDERS_REPORT_JSON_URL = new URL('../reports/providers-score-report.json', import.meta.url);
const PROVIDERS_REPORT_MD_URL = new URL('../reports/providers-score-report.md', import.meta.url);

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

function getEndpointKey(endpoint) {
  return `${endpoint.method || 'GET'}::${endpoint.url}`;
}

function toMoney(amount) {
  return Number(Number(amount || 0).toFixed(6));
}

async function loadPreviousReport() {
  try {
    const previousRaw = await readFile(PROVIDERS_REPORT_JSON_URL, 'utf8');
    return JSON.parse(previousRaw);
  } catch {
    return null;
  }
}

function normalizeHistoricalEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const attempts = Number(entry.attempts || 0);
  const successes = Number(entry.successes || 0);
  const amountUsd = Number(entry.amountUsd || entry.totalPaidUsd || 0);

  const url = typeof entry.url === 'string' ? entry.url : null;
  const method = typeof entry.method === 'string' ? entry.method : 'GET';
  if (!url) return null;

  return {
    key: getEndpointKey({ method, url }),
    name: typeof entry.name === 'string' ? entry.name : url,
    method,
    url,
    attempts: Number.isFinite(attempts) ? attempts : 0,
    successes: Number.isFinite(successes) ? successes : 0,
    failures: Math.max(0, (Number.isFinite(attempts) ? attempts : 0) - (Number.isFinite(successes) ? successes : 0)),
    amountUsd: Number.isFinite(amountUsd) ? amountUsd : 0,
    lastError: typeof entry.lastError === 'string' && entry.lastError.length ? entry.lastError : null,
  };
}

function collectHistoricalSeed(previousReport) {
  const seed = [];

  const explicitHistorical = previousReport?.settlementReliabilityHistorical?.byEndpoint;
  if (Array.isArray(explicitHistorical)) seed.push(...explicitHistorical);

  // Backward compatibility: previous versions emitted settlementReliability as an array.
  if (Array.isArray(previousReport?.settlementReliability)) seed.push(...previousReport.settlementReliability);

  return seed.map(normalizeHistoricalEntry).filter(Boolean);
}

function buildHistoricalRollup(previousReport, currentRunEntries) {
  const map = new Map();

  for (const row of collectHistoricalSeed(previousReport)) {
    map.set(row.key, { ...row });
  }

  for (const entry of currentRunEntries) {
    const key = entry.key;
    const existing = map.get(key) || {
      key,
      name: entry.name,
      method: entry.method,
      url: entry.url,
      attempts: 0,
      successes: 0,
      failures: 0,
      amountUsd: 0,
      lastError: null,
    };

    const merged = {
      ...existing,
      name: entry.name,
      method: entry.method,
      url: entry.url,
      attempts: existing.attempts + entry.attempts,
      successes: existing.successes + entry.successes,
      failures: existing.failures + entry.failures,
      amountUsd: toMoney(existing.amountUsd + entry.amountUsd),
      lastError: entry.lastError || existing.lastError,
    };

    map.set(key, merged);
  }

  const byEndpoint = [...map.values()]
    .map((entry) => ({
      ...entry,
      successRate: entry.attempts > 0 ? Number((entry.successes / entry.attempts).toFixed(4)) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts || b.successRate - a.successRate);

  const totalAttempts = byEndpoint.reduce((sum, e) => sum + e.attempts, 0);
  const totalSuccesses = byEndpoint.reduce((sum, e) => sum + e.successes, 0);
  const totalFailures = byEndpoint.reduce((sum, e) => sum + e.failures, 0);
  const totalPaidUsd = toMoney(byEndpoint.reduce((sum, e) => sum + e.amountUsd, 0));

  return {
    hasHistory: Boolean(previousReport),
    sourceGeneratedAt: previousReport?.generatedAt || null,
    endpointCount: byEndpoint.length,
    totalAttempts,
    totalSuccesses,
    totalFailures,
    successRate: totalAttempts > 0 ? Number((totalSuccesses / totalAttempts).toFixed(4)) : 0,
    totalPaidUsd,
    byEndpoint,
  };
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

  const challengeEvidence = Boolean(
    challengeHeader || (authenticateHeader && authenticateHeader.toLowerCase().includes('payment')),
  );
  const bodyEvidence =
    bodyText.includes('accepts') || bodyText.includes('x402') || bodyText.includes('payment');

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
    settlementEvidence: false,
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

function enforceTrustedRequiresSettlementEvidence(item) {
  const settlementEvidenceConfirmed = Boolean(item.evidence?.settlementEvidence);
  const reasonCodes = [
    settlementEvidenceConfirmed ? 'SETTLEMENT_EVIDENCE_CONFIRMED' : 'SETTLEMENT_EVIDENCE_MISSING',
  ];

  const trustedBandPolicy = {
    requiresConfirmedSettlementEvidence: true,
    originalBand: item.band,
    effectiveBand: item.band,
    settlementEvidenceConfirmed,
  };

  if (item.band === 'trusted' && !settlementEvidenceConfirmed) {
    trustedBandPolicy.effectiveBand = 'strong';
    reasonCodes.push('TRUSTED_REQUIRES_CONFIRMED_SETTLEMENT_EVIDENCE');
  }

  if (item.band === 'trusted' && settlementEvidenceConfirmed) {
    reasonCodes.push('TRUSTED_ALLOWED_CONFIRMED_SETTLEMENT_EVIDENCE');
  }

  return {
    ...item,
    band: trustedBandPolicy.effectiveBand,
    trustAdjustments:
      trustedBandPolicy.effectiveBand !== trustedBandPolicy.originalBand
        ? [
            ...(item.trustAdjustments || []),
            'downgraded-trusted-without-settlement-evidence',
          ]
        : item.trustAdjustments || [],
    reasonCodes: [...(item.reasonCodes || []), ...reasonCodes],
    trustedBandPolicy,
  };
}

function parseBankrCallJson(output) {
  const first = output.indexOf('{');
  const last = output.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  try {
    return JSON.parse(output.slice(first, last + 1));
  } catch {
    return null;
  }
}

function runPaidProbe(endpoint) {
  try {
    const out = execFileSync(
      'bankr',
      [
        'x402',
        'call',
        endpoint.url,
        '--method',
        endpoint.method,
        '--max-payment',
        String(maxPaymentUsd),
        '--yes',
        '--raw',
      ],
      { encoding: 'utf8', timeout: 120000 },
    );

    const parsed = parseBankrCallJson(out);
    const paymentMade = parsed?.paymentMade ?? null;
    const success = Boolean(parsed?.success && paymentMade);

    return {
      attempted: true,
      success,
      paymentMade,
      settlementEvidenceRefs: [
        `paidProbe:success:${success}`,
        `paidProbe:amount:${paymentMade?.amountUsd ?? 'none'}`,
        `paidProbe:network:${paymentMade?.network ?? 'none'}`,
        `paidProbe:scheme:${paymentMade?.scheme ?? 'none'}`,
      ],
      error: null,
    };
  } catch (err) {
    return {
      attempted: true,
      success: false,
      paymentMade: null,
      settlementEvidenceRefs: ['paidProbe:success:false'],
      error: err instanceof Error ? err.message : String(err),
    };
  }
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

const previousReport = await loadPreviousReport();

const pageScores = [];
for (const p of providerPages) {
  const d = await discover(p.url);
  const s = scorePageDiscovery(d);
  pageScores.push({ type: 'page', name: p.name, url: p.url, ...d, ...s });
}

const canaryEndpoints = await getCanaryEndpoints();
const mergedPayables = [...payableEndpoints, ...canaryEndpoints].reduce(
  (acc, cur) => {
    const key = `${cur.method || 'GET'}::${cur.url}`;
    if (!acc.map.has(key)) {
      acc.map.set(key, true);
      acc.items.push(cur);
    }
    return acc;
  },
  { map: new Map(), items: [] },
).items;

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

// Optional paid probes for settlement evidence
let paidProbeBudgetSpent = 0;
let paidProbeCandidatesEvaluated = 0;
if (withPayment) {
  const payableCandidates = endpointScores
    .filter((e) => e.isX402Like && e.gates.protocolPass)
    .filter((e) => {
      const p = parsePrice(e.price);
      return p !== null && p <= maxPaymentUsd;
    })
    .sort((a, b) => {
      const methodScoreA = a.method === 'GET' ? 0 : 1;
      const methodScoreB = b.method === 'GET' ? 0 : 1;
      if (methodScoreA !== methodScoreB) return methodScoreA - methodScoreB;
      return a.responseTimeMs - b.responseTimeMs;
    })
    .slice(0, paymentLimit);

  paidProbeCandidatesEvaluated = payableCandidates.length;

  for (const candidate of payableCandidates) {
    const paid = runPaidProbe(candidate);
    paidProbeBudgetSpent += paid.success ? Number(paid.paymentMade?.amountUsd || 0) : 0;

    candidate.paidProbe = paid;
    candidate.evidence.settlementEvidence = paid.success;
    candidate.evidenceRefs = [...(candidate.evidenceRefs || []), ...paid.settlementEvidenceRefs];
  }
}

endpointScores.sort((a, b) => b.total - a.total);

const adjustedEndpointScores = endpointScores.map(enforceTrustedRequiresSettlementEvidence);
adjustedEndpointScores.sort((a, b) => b.total - a.total);

const selectedForRouting = adjustedEndpointScores.filter(
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
  ? adjustedEndpointScores
  : adjustedEndpointScores.slice(0, Math.max(20, adjustedEndpointScores.length));

const settlementReliabilityCurrentRun = adjustedEndpointScores
  .filter((e) => e.paidProbe?.attempted)
  .map((e) => {
    const attempts = 1;
    const successes = e.paidProbe?.success ? 1 : 0;
    const failures = attempts - successes;

    return {
      key: getEndpointKey(e),
      name: e.name,
      method: e.method,
      url: e.url,
      attempts,
      successes,
      failures,
      successRate: successes / attempts,
      amountUsd: Number(e.paidProbe?.paymentMade?.amountUsd || 0),
      lastError: e.paidProbe?.error || null,
      settlementEvidenceConfirmed: Boolean(e.evidence?.settlementEvidence),
      reasonCodes: e.reasonCodes || [],
    };
  })
  .sort((a, b) => b.successRate - a.successRate);

const settlementReliabilityMetrics = {
  policy: {
    trustedRequiresConfirmedSettlementEvidence: true,
    reasonCode: 'TRUSTED_REQUIRES_CONFIRMED_SETTLEMENT_EVIDENCE',
  },
  paidProbeMode: withPayment ? 'enabled' : 'disabled',
  paidProbeCandidatesEvaluated,
  paidProbeAttempts: settlementReliabilityCurrentRun.length,
  paidProbeSuccesses: settlementReliabilityCurrentRun.reduce((sum, s) => sum + s.successes, 0),
  paidProbeFailures: settlementReliabilityCurrentRun.reduce((sum, s) => sum + s.failures, 0),
  paidProbeSuccessRate:
    settlementReliabilityCurrentRun.length > 0
      ? Number(
          (
            settlementReliabilityCurrentRun.reduce((sum, s) => sum + s.successes, 0) /
            settlementReliabilityCurrentRun.length
          ).toFixed(4),
        )
      : 0,
  settlementEvidenceConfirmedCount: adjustedEndpointScores.filter((e) => e.evidence?.settlementEvidence)
    .length,
  trustedBandDowngradedCount: adjustedEndpointScores.filter(
    (e) => e.trustedBandPolicy?.originalBand === 'trusted' && e.trustedBandPolicy?.effectiveBand !== 'trusted',
  ).length,
  paidProbeBudgetSpent: toMoney(paidProbeBudgetSpent),
  paidProbeBudgetMax: toMoney(maxPaymentUsd * paymentLimit),
};

const settlementReliabilityHistorical = buildHistoricalRollup(
  previousReport,
  settlementReliabilityCurrentRun,
);

const md = [
  '# Providers Score Snapshot',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Mode: ${strictPayable ? 'strict-payable' : 'catalog+payable'}`,
  `Rubric Weights: ${JSON.stringify(RUBRIC_WEIGHTS)}`,
  `Paid Probe Mode: ${withPayment ? 'enabled' : 'disabled'}`,
  withPayment ? `Paid Probe Budget Spent: $${paidProbeBudgetSpent.toFixed(4)}` : '',
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
  '| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence | Reason Codes |',
  '|---|---|---:|---|---:|---:|---:|---|---|---|---|---|---|',
  ...selectedEndpoints.map(
    (s) =>
      `| ${s.name} | ${s.method} | ${s.total} | ${s.band} | ${s.confidence} | ${s.status} | ${s.responseTimeMs}ms | ${s.isX402Like ? 'yes' : 'no'} | ${s.price} | ${s.gates.economicCriticalPass ? 'pass' : 'fail'} | ${s.evidence.challengeEvidence ? 'yes' : 'no'} | ${s.evidence.settlementEvidence ? 'yes' : 'no'} | ${(s.reasonCodes || []).join(', ') || 'n/a'} |`,
  ),
  '',
  `Total payable endpoints scored: ${adjustedEndpointScores.length}`,
  `Routing candidates passing gates: ${selectedForRouting.length}`,
  `Routing decision: ${routingDecision.allowed ? 'allow' : 'deny'} (${routingDecision.reason})`,
  '',
  '## Settlement Reliability',
  '',
  `- Policy: trusted requires confirmed settlement evidence (${settlementReliabilityMetrics.policy.reasonCode})`,
  `- Paid probe attempts: ${settlementReliabilityMetrics.paidProbeAttempts}`,
  `- Paid probe success rate: ${(settlementReliabilityMetrics.paidProbeSuccessRate * 100).toFixed(1)}%`,
  `- Confirmed settlement evidence: ${settlementReliabilityMetrics.settlementEvidenceConfirmedCount}`,
  `- Budget spent / max: $${settlementReliabilityMetrics.paidProbeBudgetSpent.toFixed(4)} / $${settlementReliabilityMetrics.paidProbeBudgetMax.toFixed(4)}`,
  '',
  '### Current Run',
  '',
  '| Endpoint | Attempts | Successes | Success Rate | Paid USD | Evidence Confirmed | Last Error |',
  '|---|---:|---:|---:|---:|---|---|',
  ...(settlementReliabilityCurrentRun.length
    ? settlementReliabilityCurrentRun.map(
        (s) =>
          `| ${s.name} | ${s.attempts} | ${s.successes} | ${(s.successRate * 100).toFixed(0)}% | ${s.amountUsd.toFixed(4)} | ${s.settlementEvidenceConfirmed ? 'yes' : 'no'} | ${s.lastError ? 'yes' : 'no'} |`,
      )
    : ['| (no paid probes yet) | 0 | 0 | 0% | 0.0000 | no | n/a |']),
  '',
  '### Historical Rollup',
  '',
  `- Historical source report: ${settlementReliabilityHistorical.sourceGeneratedAt || 'none'}`,
  `- Historical attempts: ${settlementReliabilityHistorical.totalAttempts}`,
  `- Historical success rate: ${(settlementReliabilityHistorical.successRate * 100).toFixed(1)}%`,
  '',
  '| Endpoint | Attempts | Successes | Success Rate | Total Paid USD |',
  '|---|---:|---:|---:|---:|',
  ...(settlementReliabilityHistorical.byEndpoint.length
    ? settlementReliabilityHistorical.byEndpoint.map(
        (s) =>
          `| ${s.name} | ${s.attempts} | ${s.successes} | ${(s.successRate * 100).toFixed(0)}% | ${Number(s.amountUsd || 0).toFixed(4)} |`,
      )
    : ['| (no historical settlement data yet) | 0 | 0 | 0% | 0.0000 |']),
  '',
].join('\n');

await mkdir(REPORTS_DIR_URL, { recursive: true });
await writeFile(
  PROVIDERS_REPORT_JSON_URL,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      mode: strictPayable ? 'strict-payable' : 'catalog+payable',
      withPayment,
      paymentConfig: { maxPaymentUsd, paymentLimit },
      paidProbeBudgetSpent,
      rubricWeights: RUBRIC_WEIGHTS,
      pageScores,
      endpointScores: adjustedEndpointScores,
      selectedForRouting,
      routingDecision,
      settlementReliability: settlementReliabilityCurrentRun,
      settlementReliabilityMetrics,
      settlementReliabilityHistorical,
    },
    null,
    2,
  ),
);
await writeFile(PROVIDERS_REPORT_MD_URL, md);

console.log('wrote reports/providers-score-report.json');
console.log('wrote reports/providers-score-report.md');
