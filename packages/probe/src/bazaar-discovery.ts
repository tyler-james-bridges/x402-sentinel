export interface BazaarDiscoveryFilters {
  network?: string;
  asset?: string;
  scheme?: string;
  maxPrice?: string | number;
}

export interface BazaarDiscoveryResource {
  id: string;
  endpoint: string;
  method: string;
  network?: string;
  asset?: string;
  scheme?: string;
  maxPrice?: string;
  raw: unknown;
}

interface BazaarDiscoveryResponse {
  resources: BazaarDiscoveryResource[];
  raw: unknown;
}

function cleanBaseUrl(input: string): string {
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toMethod(value: unknown): string {
  const method = toOptionalString(value);
  return method ? method.toUpperCase() : 'GET';
}

function toPrice(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return toOptionalString(value);
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function extractResourceArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = getRecord(payload);
  if (!root) return [];

  if (Array.isArray(root.resources)) return root.resources;
  if (Array.isArray(root.data)) return root.data;

  const dataObj = getRecord(root.data);
  if (dataObj && Array.isArray(dataObj.resources)) return dataObj.resources;

  return [];
}

function parseResource(item: unknown, index: number): BazaarDiscoveryResource | null {
  const record = getRecord(item);
  if (!record) return null;

  const endpoint =
    toOptionalString(record.endpoint) ??
    toOptionalString(record.url) ??
    toOptionalString(record.resource) ??
    toOptionalString(record.resourceUrl);

  if (!endpoint) return null;

  const id =
    toOptionalString(record.id) ??
    toOptionalString(record.resourceId) ??
    toOptionalString(record.slug) ??
    `${endpoint}#${index}`;

  return {
    id,
    endpoint,
    method: toMethod(record.method),
    network: toOptionalString(record.network) ?? toOptionalString(record.chain),
    asset: toOptionalString(record.asset) ?? toOptionalString(record.token),
    scheme: toOptionalString(record.scheme) ?? toOptionalString(record.paymentScheme),
    maxPrice:
      toPrice(record.maxPrice) ??
      toPrice(record.max_price) ??
      toPrice(record.price) ??
      toPrice(getRecord(record.pricing)?.max),
    raw: item,
  };
}

export function parseBazaarDiscoveryResponse(payload: unknown): BazaarDiscoveryResponse {
  const resources = extractResourceArray(payload)
    .map((item, index) => parseResource(item, index))
    .filter((resource): resource is BazaarDiscoveryResource => resource !== null);

  return {
    resources,
    raw: payload,
  };
}

export function buildBazaarDiscoveryUrl(baseUrlInput: string, filters: BazaarDiscoveryFilters = {}): URL {
  const baseUrl = cleanBaseUrl(baseUrlInput);
  const url = new URL(`${baseUrl}/v2/x402/discovery/resources`);

  if (filters.network) url.searchParams.set('network', filters.network);
  if (filters.asset) url.searchParams.set('asset', filters.asset);
  if (filters.scheme) url.searchParams.set('scheme', filters.scheme);
  if (filters.maxPrice !== undefined) url.searchParams.set('maxPrice', String(filters.maxPrice));

  return url;
}

export async function fetchBazaarDiscoveryResources(
  baseUrl: string,
  filters: BazaarDiscoveryFilters = {},
  init: RequestInit = {}
): Promise<BazaarDiscoveryResponse> {
  const url = buildBazaarDiscoveryUrl(baseUrl, filters);
  const res = await fetch(url, {
    ...init,
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`bazaar discovery fetch failed: ${res.status}`);
  }

  const payload = (await res.json()) as unknown;
  return parseBazaarDiscoveryResponse(payload);
}
