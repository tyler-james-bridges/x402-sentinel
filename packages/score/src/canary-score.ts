import type { CategoryScores, ScoreResult } from './schema.js';

export interface CanaryEndpoint {
  name: string;
  url: string;
  method: string;
  status: number;
  responseTimeMs: number;
  isHealthy: boolean;
  isX402: boolean;
  x402Details?: {
    price?: string;
    network?: string;
    token?: string;
    version?: string;
  } | null;
}
import { scoreProvider } from './score.js';

export interface ProviderScore extends ScoreResult {
  name: string;
  url: string;
  status: number;
  responseTimeMs: number;
  isX402: boolean;
  price: string;
  categories: CategoryScores;
}

function parsePrice(price?: string): number | null {
  if (!price) return null;
  const v = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : null;
}

export function scoreCanaryEndpoint(endpoint: CanaryEndpoint): ProviderScore {
  const priceValue = parsePrice(endpoint.x402Details?.price);

  const categories: CategoryScores = {
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

  const result = scoreProvider(categories, 65);

  return {
    ...result,
    name: endpoint.name,
    url: endpoint.url,
    status: endpoint.status,
    responseTimeMs: endpoint.responseTimeMs,
    isX402: endpoint.isX402,
    price: endpoint.x402Details?.price ?? 'n/a',
    categories,
  };
}
