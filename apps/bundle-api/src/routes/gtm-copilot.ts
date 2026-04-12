export interface GTMCopilotRequest {
  targets: string[];
  goal: string;
  budget?: number;
}

interface CanaryEndpoint {
  name: string;
  url: string;
  method: string;
  status: number;
  responseTimeMs: number;
  isHealthy: boolean;
  isX402: boolean;
  x402Details?: { price?: string; network?: string; token?: string; version?: string } | null;
}

interface CanaryHealthPayload {
  endpoints: CanaryEndpoint[];
}

interface ProviderScore {
  name: string;
  url: string;
  status: number;
  responseTimeMs: number;
  total: number;
  band: 'trusted' | 'strong' | 'caution' | 'experimental' | 'high-risk';
  confidence: number;
  evidence: {
    protocolEvidence: boolean;
    priceEvidence: boolean;
    timingEvidence: boolean;
  };
  gates: {
    protocolPass: boolean;
    reliabilityPass: boolean;
    securityPass: boolean;
    economicCriticalPass: boolean;
  };
}

function parsePrice(price?: string): number | null {
  if (!price) return null;
  const value = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) ? value : null;
}

function gradeBand(total: number): ProviderScore['band'] {
  if (total >= 90) return 'trusted';
  if (total >= 80) return 'strong';
  if (total >= 70) return 'caution';
  if (total >= 60) return 'experimental';
  return 'high-risk';
}

function scoreCanaryEndpoint(endpoint: CanaryEndpoint): ProviderScore {
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

  const evidence = {
    protocolEvidence: endpoint.status > 0,
    priceEvidence: priceValue !== null,
    timingEvidence: endpoint.responseTimeMs > 0,
    settlementEvidence: false,
  };

  const evidenceCount = Number(evidence.protocolEvidence) + Number(evidence.priceEvidence) + Number(evidence.timingEvidence);
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
    evidence,
    gates: {
      protocolPass: protocolConformance >= 20,
      reliabilityPass: reliability >= 18,
      securityPass: security >= 14,
      economicCriticalPass: economicIntegrity >= 10 && evidence.priceEvidence,
    },
  };
}

async function fetchProvidersFromCanary(): Promise<CanaryHealthPayload['endpoints']> {
  const res = await fetch('https://canary.0x402.sh/api/health');
  if (!res.ok) {
    throw new Error(`canary provider fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as CanaryHealthPayload;
  return data.endpoints;
}

function pickProvider(endpoints: CanaryHealthPayload['endpoints']) {
  const scored: ProviderScore[] = endpoints
    .map((endpoint) => scoreCanaryEndpoint(endpoint))
    .sort((a, b) => b.total - a.total);

  const gatePassed = scored.find(
    (s) =>
      s.gates.protocolPass &&
      s.gates.reliabilityPass &&
      s.gates.securityPass &&
      s.gates.economicCriticalPass,
  );

  const selected = gatePassed ?? scored[0];
  const fallbackUsed = !gatePassed;

  return { selected, scoredTop5: scored.slice(0, 5), fallbackUsed };
}

export async function runGTMCopilotBundle(input: GTMCopilotRequest) {
  const providers = await fetchProvidersFromCanary();
  const { selected, scoredTop5, fallbackUsed } = pickProvider(providers);
  const nowIso = new Date().toISOString();
  const denyInsufficientEvidence = process.env.SENTINEL_DENY_INSUFFICIENT_EVIDENCE === 'true';

  if (denyInsufficientEvidence && fallbackUsed) {
    throw new Error('routing denied: no provider satisfied trust gates with sufficient evidence');
  }

  return {
    jobId: `job_${Date.now()}`,
    createdAt: nowIso,
    providerSelected: selected?.url ?? 'none',
    scoreSnapshot: {
      selected,
      top5: scoredTop5,
    },
    receiptEnvelope: {
      envelopeId: `receipt_${Date.now()}`,
      generatedAt: nowIso,
      pricingMode: ['exact', 'upto'],
      audit: {
        policyVersion: 'v1',
        fallbackUsed,
        denyInsufficientEvidence,
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
          evidenceRefs: selected
            ? [
                `provider:${selected.url}`,
                `status:${selected.status}`,
                `latencyMs:${selected.responseTimeMs}`,
                `priceEvidence:${selected.evidence.priceEvidence}`,
              ]
            : [],
          fallbackUsed,
        },
      ],
    },
    input,
  };
}
