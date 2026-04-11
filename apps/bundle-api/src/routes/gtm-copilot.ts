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
  band: 'trusted' | 'strong' | 'caution' | 'high-risk';
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

function scoreCanaryEndpoint(endpoint: CanaryEndpoint): ProviderScore {
  const priceValue = parsePrice(endpoint.x402Details?.price);
  const protocolConformance = endpoint.isX402 ? (endpoint.status === 402 ? 22 : 15) : 0;
  const reliability = endpoint.isHealthy
    ? Math.max(8, Math.min(25, 25 - Math.floor((endpoint.responseTimeMs || 1000) / 40)))
    : 5;
  const security = endpoint.isX402 ? 14 : 8;
  const economicIntegrity =
    priceValue === null ? 8 : priceValue === 0 ? 6 : priceValue > 1000 ? 4 : 10;
  const devexDiscovery = endpoint.isX402 ? 7 : 4;
  const operationalTransparency = endpoint.isHealthy ? 4 : 2;

  const total =
    protocolConformance +
    reliability +
    security +
    economicIntegrity +
    devexDiscovery +
    operationalTransparency;

  const band = total >= 90 ? 'trusted' : total >= 80 ? 'strong' : total >= 70 ? 'caution' : 'high-risk';

  return {
    name: endpoint.name,
    url: endpoint.url,
    status: endpoint.status,
    responseTimeMs: endpoint.responseTimeMs,
    total,
    band,
    gates: {
      protocolPass: protocolConformance >= 20,
      reliabilityPass: reliability >= 18,
      securityPass: security >= 14,
      economicCriticalPass: economicIntegrity >= 10,
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

  return {
    jobId: `job_${Date.now()}`,
    providerSelected: selected?.url ?? 'none',
    scoreSnapshot: {
      selected,
      top5: scoredTop5,
    },
    receiptEnvelope: {
      pricingMode: ['exact', 'upto'],
      steps: [
        {
          step: 'provider-selection',
          status: selected?.status,
          score: selected?.total,
          band: selected?.band,
          gates: selected?.gates,
          fallbackUsed,
        },
      ],
    },
    input,
  };
}
