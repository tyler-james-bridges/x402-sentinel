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

export interface CanaryHealthResponse {
  timestamp: string;
  summary: {
    total: number;
    online: number;
    degraded: number;
    x402Enabled: number;
  };
  endpoints: CanaryEndpoint[];
}

export async function fetchCanaryHealth(url = 'https://canary.0x402.sh/api/health'): Promise<CanaryHealthResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`canary health fetch failed: ${res.status}`);
  }
  return (await res.json()) as CanaryHealthResponse;
}
