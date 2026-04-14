export interface GTMCopilotRequest {
  targets: string[];
  goal: string;
  budget?: number;
}

export interface CanaryEndpoint {
  name: string;
  url: string;
  method: string;
  status: number;
  responseTimeMs: number;
  isHealthy: boolean;
  isX402: boolean;
  x402Details?: { price?: string; network?: string; token?: string; version?: string } | null;
  settlementSuccessRate?: number | null;
  settlementSamples?: number | null;
}

interface CanaryHealthPayload {
  endpoints?: unknown[];
  providers?: unknown[];
}

export type RoutingReasonCode =
  | 'TRUST_GATES_PASSED'
  | 'FALLBACK_NO_TRUST_GATE_PASS'
  | 'DENY_INSUFFICIENT_EVIDENCE'
  | 'ROUTING_NO_PROVIDERS'
  | 'PRICE_ABOVE_CEILING'
  | 'INSUFFICIENT_SETTLEMENT_EVIDENCE'
  | 'INSUFFICIENT_PROTOCOL_EVIDENCE';

export interface ProviderScore {
  name: string;
  url: string;
  status: number;
  responseTimeMs: number;
  total: number;
  band: 'trusted' | 'strong' | 'caution' | 'experimental' | 'high-risk';
  confidence: number;
  priceValue: number | null;
  settlementReliability: number;
  withinPriceCeiling: boolean;
  evidence: {
    protocolEvidence: boolean;
    priceEvidence: boolean;
    timingEvidence: boolean;
    settlementEvidence: boolean;
  };
  gates: {
    protocolPass: boolean;
    reliabilityPass: boolean;
    securityPass: boolean;
    economicCriticalPass: boolean;
  };
}

export class RoutingDeniedError extends Error {
  readonly reasonCodes: RoutingReasonCode[];
  readonly diagnostics: {
    fallbackUsed: boolean;
    top5: ProviderScore[];
  };

  constructor(message: string, reasonCodes: RoutingReasonCode[], diagnostics: { fallbackUsed: boolean; top5: ProviderScore[] }) {
    super(message);
    this.name = 'RoutingDeniedError';
    this.reasonCodes = reasonCodes;
    this.diagnostics = diagnostics;
  }
}

function parsePrice(price?: string): number | null {
  if (!price) return null;
  const value = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) ? value : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return fallback;
}

function gradeBand(total: number): ProviderScore['band'] {
  if (total >= 90) return 'trusted';
  if (total >= 80) return 'strong';
  if (total >= 70) return 'caution';
  if (total >= 60) return 'experimental';
  return 'high-risk';
}

function getSettlementSamples(raw: Record<string, unknown>): number | null {
  const direct = toFiniteNumber(raw.settlementSamples);
  if (direct !== null) return direct;

  const settlement = raw.settlement;
  if (settlement && typeof settlement === 'object') {
    const attempts = toFiniteNumber((settlement as Record<string, unknown>).attempts);
    if (attempts !== null) return attempts;
  }

  return null;
}

function getSettlementSuccessRate(raw: Record<string, unknown>): number | null {
  const direct = toFiniteNumber(raw.settlementSuccessRate);
  if (direct !== null) {
    return Math.max(0, Math.min(1, direct));
  }

  const settlement = raw.settlement;
  if (settlement && typeof settlement === 'object') {
    const settlementObj = settlement as Record<string, unknown>;
    const rate = toFiniteNumber(settlementObj.successRate);
    if (rate !== null) {
      return Math.max(0, Math.min(1, rate));
    }

    const successes = toFiniteNumber(settlementObj.successes);
    const attempts = toFiniteNumber(settlementObj.attempts);
    if (successes !== null && attempts !== null && attempts > 0) {
      return Math.max(0, Math.min(1, successes / attempts));
    }
  }

  return null;
}

function inferX402(raw: Record<string, unknown>, status: number): boolean {
  if ('isX402' in raw) return toBoolean(raw.isX402);
  const payment = raw.x402Details;
  if (payment && typeof payment === 'object') return true;
  return status === 402;
}

function inferPrice(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.price === 'string') return raw.price;

  const x402Details = raw.x402Details;
  if (x402Details && typeof x402Details === 'object') {
    const price = (x402Details as Record<string, unknown>).price;
    return typeof price === 'string' ? price : undefined;
  }

  const payment = raw.payment;
  if (payment && typeof payment === 'object') {
    const price = (payment as Record<string, unknown>).price;
    return typeof price === 'string' ? price : undefined;
  }

  return undefined;
}

function normalizeIndexerRecord(raw: Record<string, unknown>): CanaryEndpoint {
  const status = toFiniteNumber(raw.status) ?? 0;
  const responseTimeMs = toFiniteNumber(raw.responseTimeMs) ?? toFiniteNumber(raw.latencyMs) ?? 0;
  const isHealthy = 'isHealthy' in raw ? toBoolean(raw.isHealthy) : status > 0 && status < 500;
  const method = typeof raw.method === 'string' ? raw.method.toUpperCase() : 'GET';
  const price = inferPrice(raw);

  const x402Details =
    raw.x402Details && typeof raw.x402Details === 'object'
      ? {
          price: typeof (raw.x402Details as Record<string, unknown>).price === 'string'
            ? ((raw.x402Details as Record<string, unknown>).price as string)
            : price,
          network: typeof (raw.x402Details as Record<string, unknown>).network === 'string'
            ? ((raw.x402Details as Record<string, unknown>).network as string)
            : undefined,
          token: typeof (raw.x402Details as Record<string, unknown>).token === 'string'
            ? ((raw.x402Details as Record<string, unknown>).token as string)
            : undefined,
          version: typeof (raw.x402Details as Record<string, unknown>).version === 'string'
            ? ((raw.x402Details as Record<string, unknown>).version as string)
            : undefined,
        }
      : price
        ? { price }
        : null;

  return {
    name: typeof raw.name === 'string' ? raw.name : typeof raw.id === 'string' ? raw.id : 'unknown-provider',
    url: typeof raw.url === 'string' ? raw.url : '',
    method,
    status,
    responseTimeMs,
    isHealthy,
    isX402: inferX402(raw, status),
    x402Details,
    settlementSuccessRate: getSettlementSuccessRate(raw),
    settlementSamples: getSettlementSamples(raw),
  };
}

export function normalizeIndexerEndpoints(payload: unknown): CanaryEndpoint[] {
  const source: unknown[] = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? Array.isArray((payload as CanaryHealthPayload).endpoints)
        ? ((payload as CanaryHealthPayload).endpoints as unknown[])
        : Array.isArray((payload as CanaryHealthPayload).providers)
          ? ((payload as CanaryHealthPayload).providers as unknown[])
          : []
      : [];

  const normalized = source
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map(normalizeIndexerRecord)
    .filter((item) => item.url.length > 0);

  const deduped = new Map<string, CanaryEndpoint>();
  for (const item of normalized) {
    const key = `${item.method}::${item.url}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    if (item.status > existing.status || item.responseTimeMs < existing.responseTimeMs) {
      deduped.set(key, item);
    }
  }

  return [...deduped.values()];
}

export function scoreCanaryEndpoint(endpoint: CanaryEndpoint, priceCeilingUsd: number): ProviderScore {
  const priceValue = parsePrice(endpoint.x402Details?.price);
  const protocolConformance = endpoint.isX402 ? (endpoint.status === 402 ? 22 : 15) : 0;
  const reliability = endpoint.isHealthy
    ? Math.max(8, Math.min(25, 25 - Math.floor((endpoint.responseTimeMs || 1000) / 40)))
    : 5;
  const security = endpoint.isX402 ? 14 : 8;
  const economicIntegrity =
    priceValue === null ? 6 : priceValue === 0 ? 6 : priceValue > 1000 ? 4 : 11;
  const devexDiscovery = endpoint.isX402 ? 7 : 4;
  const operationalTransparency = endpoint.isHealthy ? 3 : 1;

  const total =
    protocolConformance +
    reliability +
    security +
    economicIntegrity +
    devexDiscovery +
    operationalTransparency;

  const settlementReliability = Math.round(Math.max(0, Math.min(1, endpoint.settlementSuccessRate ?? 0)) * 100);
  const settlementSamples = endpoint.settlementSamples ?? 0;

  const evidence = {
    protocolEvidence: endpoint.status > 0,
    priceEvidence: priceValue !== null,
    timingEvidence: endpoint.responseTimeMs > 0,
    settlementEvidence: settlementSamples > 0,
  };

  const evidenceCount =
    Number(evidence.protocolEvidence) +
    Number(evidence.priceEvidence) +
    Number(evidence.timingEvidence) +
    Number(evidence.settlementEvidence);
  const confidence = Math.min(95, 40 + evidenceCount * 15);

  const band = gradeBand(total);
  const finalBand = band === 'trusted' && !evidence.settlementEvidence ? 'strong' : band;

  return {
    name: endpoint.name,
    url: endpoint.url,
    status: endpoint.status,
    responseTimeMs: endpoint.responseTimeMs,
    total,
    band: finalBand,
    confidence,
    priceValue,
    settlementReliability,
    withinPriceCeiling: priceValue !== null ? priceValue <= priceCeilingUsd : false,
    evidence,
    gates: {
      protocolPass: protocolConformance >= 20,
      reliabilityPass: reliability >= 18,
      securityPass: security >= 14,
      economicCriticalPass: economicIntegrity >= 10 && evidence.priceEvidence,
    },
  };
}

function compareCandidates(a: ProviderScore, b: ProviderScore): number {
  const trustA = Number(a.gates.protocolPass && a.gates.reliabilityPass && a.gates.securityPass && a.gates.economicCriticalPass);
  const trustB = Number(b.gates.protocolPass && b.gates.reliabilityPass && b.gates.securityPass && b.gates.economicCriticalPass);
  if (trustA !== trustB) return trustB - trustA;

  const ceilingA = Number(a.withinPriceCeiling);
  const ceilingB = Number(b.withinPriceCeiling);
  if (ceilingA !== ceilingB) return ceilingB - ceilingA;

  const settlementEvidenceA = Number(a.evidence.settlementEvidence);
  const settlementEvidenceB = Number(b.evidence.settlementEvidence);
  if (settlementEvidenceA !== settlementEvidenceB) return settlementEvidenceB - settlementEvidenceA;

  if (a.settlementReliability !== b.settlementReliability) return b.settlementReliability - a.settlementReliability;
  if (a.responseTimeMs !== b.responseTimeMs) return a.responseTimeMs - b.responseTimeMs;

  const priceA = a.priceValue === null ? Number.POSITIVE_INFINITY : a.priceValue;
  const priceB = b.priceValue === null ? Number.POSITIVE_INFINITY : b.priceValue;
  if (priceA !== priceB) return priceA - priceB;

  if (a.total !== b.total) return b.total - a.total;
  return a.url.localeCompare(b.url) || a.name.localeCompare(b.name);
}

export function pickProvider(
  endpoints: CanaryEndpoint[],
  options: { priceCeilingUsd?: number; denyInsufficientEvidence?: boolean } = {},
) {
  const priceCeilingUsd = options.priceCeilingUsd ?? Number.POSITIVE_INFINITY;
  const denyInsufficientEvidence = options.denyInsufficientEvidence ?? false;

  const scored: ProviderScore[] = endpoints
    .map((endpoint) => scoreCanaryEndpoint(endpoint, priceCeilingUsd))
    .sort(compareCandidates);

  const selected =
    scored.find((candidate) => candidate.withinPriceCeiling && candidate.evidence.settlementEvidence) ??
    scored.find((candidate) => candidate.withinPriceCeiling) ??
    scored[0];

  if (!selected) {
    const reasonCodes: RoutingReasonCode[] = ['ROUTING_NO_PROVIDERS'];
    if (denyInsufficientEvidence) reasonCodes.push('DENY_INSUFFICIENT_EVIDENCE');
    if (denyInsufficientEvidence) {
      throw new RoutingDeniedError('routing denied: no providers available after indexer normalization', reasonCodes, {
        fallbackUsed: true,
        top5: [],
      });
    }
    return { selected: null, scoredTop5: [], fallbackUsed: true, reasonCodes };
  }

  const passedTrustGates =
    selected.gates.protocolPass &&
    selected.gates.reliabilityPass &&
    selected.gates.securityPass &&
    selected.gates.economicCriticalPass;

  const fallbackUsed = !passedTrustGates;
  const reasonCodes: RoutingReasonCode[] = [
    passedTrustGates ? 'TRUST_GATES_PASSED' : 'FALLBACK_NO_TRUST_GATE_PASS',
  ];

  if (!selected.withinPriceCeiling) reasonCodes.push('PRICE_ABOVE_CEILING');
  if (!selected.evidence.settlementEvidence) reasonCodes.push('INSUFFICIENT_SETTLEMENT_EVIDENCE');
  if (!selected.evidence.protocolEvidence) reasonCodes.push('INSUFFICIENT_PROTOCOL_EVIDENCE');

  if (denyInsufficientEvidence && fallbackUsed) {
    reasonCodes.push('DENY_INSUFFICIENT_EVIDENCE');
    throw new RoutingDeniedError(
      'routing denied: no provider satisfied trust gates with sufficient evidence',
      reasonCodes,
      {
        fallbackUsed,
        top5: scored.slice(0, 5),
      },
    );
  }

  return { selected, scoredTop5: scored.slice(0, 5), fallbackUsed, reasonCodes };
}

async function fetchProvidersFromIndexer(indexerUrl: string): Promise<CanaryEndpoint[]> {
  const res = await fetch(indexerUrl);
  if (!res.ok) {
    throw new Error(`indexer provider fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as CanaryHealthPayload;
  return normalizeIndexerEndpoints(data);
}

export async function runGTMCopilotBundle(input: GTMCopilotRequest) {
  const denyInsufficientEvidence = process.env.SENTINEL_DENY_INSUFFICIENT_EVIDENCE === 'true';
  const indexerUrl = process.env.SENTINEL_INDEXER_URL ?? 'https://canary.0x402.sh/api/health';
  const priceCeilingUsd = Number(process.env.SENTINEL_PRICE_CEILING_USD ?? '0.01');

  const providers = await fetchProvidersFromIndexer(indexerUrl);
  const { selected, scoredTop5, fallbackUsed, reasonCodes } = pickProvider(providers, {
    priceCeilingUsd: Number.isFinite(priceCeilingUsd) ? priceCeilingUsd : Number.POSITIVE_INFINITY,
    denyInsufficientEvidence,
  });

  const nowIso = new Date().toISOString();

  return {
    jobId: `job_${Date.now()}`,
    createdAt: nowIso,
    providerSelected: selected?.url ?? 'none',
    scoreSnapshot: {
      selected,
      top5: scoredTop5,
      reasonCodes,
    },
    receiptEnvelope: {
      envelopeId: `receipt_${Date.now()}`,
      generatedAt: nowIso,
      pricingMode: ['exact', 'upto'],
      audit: {
        policyVersion: 'v2',
        fallbackUsed,
        denyInsufficientEvidence,
        reasonCodes,
        indexerUrl,
        priceCeilingUsd,
      },
      steps: [
        {
          stepId: 'step-provider-selection-001',
          step: 'provider-selection',
          timestamp: nowIso,
          status: selected?.status,
          score: selected?.total,
          band: selected?.band,
          confidence: selected?.confidence,
          gates: selected?.gates,
          reasonCodes,
          evidenceRefs: selected
            ? [
                `provider:${selected.url}`,
                `status:${selected.status}`,
                `latencyMs:${selected.responseTimeMs}`,
                `priceEvidence:${selected.evidence.priceEvidence}`,
                `settlementEvidence:${selected.evidence.settlementEvidence}`,
                `settlementReliability:${selected.settlementReliability}`,
              ]
            : [],
          fallbackUsed,
        },
      ],
    },
    input,
  };
}
