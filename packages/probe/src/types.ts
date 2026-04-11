export type DiscoverySource = 'openapi' | 'well-known' | 'endpoint';

export interface DiscoveredEndpoint {
  method: string;
  path: string;
  pricingMode?: 'exact' | 'upto' | 'dynamic' | 'unknown';
  protocol?: 'x402' | 'mpp' | 'unknown';
}

export interface DiscoveryResult {
  source: DiscoverySource;
  baseUrl: string;
  endpoints: DiscoveredEndpoint[];
  warnings: string[];
}
