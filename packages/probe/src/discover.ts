import type { DiscoveredEndpoint, DiscoveryResult } from './types.js';

function cleanBaseUrl(input: string): string {
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

function toPricingMode(value: unknown): DiscoveredEndpoint['pricingMode'] {
  if (!value || typeof value !== 'object') return 'unknown';
  const mode = String((value as { mode?: unknown }).mode ?? '').toLowerCase();
  if (mode === 'fixed') return 'exact';
  if (mode === 'dynamic') return 'dynamic';
  if (mode === 'upto') return 'upto';
  return 'unknown';
}

function parseOpenApiEndpoints(openapi: any): DiscoveredEndpoint[] {
  const paths = openapi?.paths;
  if (!paths || typeof paths !== 'object') return [];

  const endpoints: DiscoveredEndpoint[] = [];
  for (const [path, ops] of Object.entries(paths)) {
    if (!ops || typeof ops !== 'object') continue;

    for (const [method, op] of Object.entries(ops as Record<string, any>)) {
      const lower = method.toLowerCase();
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(lower)) continue;

      const paymentInfo = op?.['x-payment-info'];
      const protocols = paymentInfo?.protocols;
      const protocol = Array.isArray(protocols)
        ? (protocols.includes('x402') ? 'x402' : protocols.includes('mpp') ? 'mpp' : 'unknown')
        : 'unknown';

      endpoints.push({
        method: lower.toUpperCase(),
        path,
        protocol,
        pricingMode: toPricingMode(paymentInfo?.price),
      });
    }
  }

  return endpoints;
}

export async function discover(baseUrlInput: string): Promise<DiscoveryResult> {
  const baseUrl = cleanBaseUrl(baseUrlInput);
  const warnings: string[] = [];

  // 1) OpenAPI-first
  try {
    const openapiRes = await fetch(`${baseUrl}/openapi.json`);
    if (openapiRes.ok) {
      const openapi = await openapiRes.json();
      const endpoints = parseOpenApiEndpoints(openapi);
      if (endpoints.length > 0) {
        return { source: 'openapi', baseUrl, endpoints, warnings };
      }
      warnings.push('openapi found but no operations parsed');
    } else {
      warnings.push(`openapi fetch failed: ${openapiRes.status}`);
    }
  } catch (err) {
    warnings.push(`openapi error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2) well-known fallback
  try {
    const wkRes = await fetch(`${baseUrl}/.well-known/x402`);
    if (wkRes.ok) {
      const wk = await wkRes.json();
      const resources = Array.isArray(wk?.resources) ? wk.resources : [];
      const endpoints: DiscoveredEndpoint[] = resources
        .filter((r: unknown) => typeof r === 'string')
        .map((r: string) => {
          try {
            const url = new URL(r);
            return { method: 'GET', path: url.pathname, protocol: 'x402', pricingMode: 'unknown' };
          } catch {
            return { method: 'GET', path: r, protocol: 'x402', pricingMode: 'unknown' };
          }
        });

      if (endpoints.length > 0) {
        return { source: 'well-known', baseUrl, endpoints, warnings };
      }
      warnings.push('well-known found but no resources listed');
    } else {
      warnings.push(`well-known fetch failed: ${wkRes.status}`);
    }
  } catch (err) {
    warnings.push(`well-known error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 3) endpoint-only probe fallback
  const probed: DiscoveredEndpoint[] = [];
  for (const method of ['GET', 'POST'] as const) {
    try {
      const res = await fetch(baseUrl, { method });
      if (res.status === 402) {
        const url = new URL(baseUrl);
        probed.push({ method, path: url.pathname || '/', protocol: 'x402', pricingMode: 'unknown' });
      }
    } catch (err) {
      warnings.push(`endpoint ${method} probe error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    source: 'endpoint',
    baseUrl,
    endpoints: probed,
    warnings,
  };
}
