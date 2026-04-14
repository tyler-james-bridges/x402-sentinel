import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBazaarDiscoveryUrl,
  fetchBazaarDiscoveryResources,
  parseBazaarDiscoveryResponse,
} from '../../../dist/bazaar-discovery.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('buildBazaarDiscoveryUrl includes filter query params', () => {
  const url = buildBazaarDiscoveryUrl('https://bazaar.example.com/', {
    network: 'base-sepolia',
    asset: 'USDC',
    scheme: 'x402',
    maxPrice: 0.25,
  });

  assert.equal(url.toString(), 'https://bazaar.example.com/v2/x402/discovery/resources?network=base-sepolia&asset=USDC&scheme=x402&maxPrice=0.25');
});

test('parseBazaarDiscoveryResponse supports { data: { resources } } shape', () => {
  const payload = {
    data: {
      resources: [
        {
          id: 'res_1',
          endpoint: 'https://api.example.com/quote',
          method: 'post',
          network: 'base',
          asset: 'USDC',
          scheme: 'exact',
          maxPrice: '0.05',
        },
      ],
    },
  };

  const parsed = parseBazaarDiscoveryResponse(payload);

  assert.equal(parsed.resources.length, 1);
  assert.deepEqual(parsed.resources[0], {
    id: 'res_1',
    endpoint: 'https://api.example.com/quote',
    method: 'POST',
    network: 'base',
    asset: 'USDC',
    scheme: 'exact',
    maxPrice: '0.05',
    raw: payload.data.resources[0],
  });
});

test('fetchBazaarDiscoveryResources requests v2 discovery endpoint and parses resources', async () => {
  let capturedUrl = '';
  let capturedMethod = '';

  globalThis.fetch = async (input, init) => {
    capturedUrl = input instanceof URL ? input.toString() : String(input);
    capturedMethod = String(init?.method ?? 'GET');

    return {
      ok: true,
      json: async () => ({
        resources: [
          {
            resourceId: 'res_2',
            url: 'https://api.example.com/ping',
            chain: 'base',
            token: 'USDC',
            paymentScheme: 'upto',
            pricing: { max: 1 },
          },
        ],
      }),
    };
  };

  const parsed = await fetchBazaarDiscoveryResources('https://bazaar.example.com', {
    network: 'base',
    asset: 'USDC',
  });

  assert.equal(capturedMethod, 'GET');
  assert.equal(capturedUrl, 'https://bazaar.example.com/v2/x402/discovery/resources?network=base&asset=USDC');
  assert.equal(parsed.resources.length, 1);
  assert.equal(parsed.resources[0].id, 'res_2');
  assert.equal(parsed.resources[0].method, 'GET');
  assert.equal(parsed.resources[0].endpoint, 'https://api.example.com/ping');
  assert.equal(parsed.resources[0].maxPrice, '1');
});
