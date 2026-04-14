import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeIndexerEndpoints,
  pickProvider,
  RoutingDeniedError,
} from '../dist/routes/gtm-copilot.js';

test('normalizeIndexerEndpoints maps indexer providers payload into sentinel inputs', () => {
  const payload = {
    providers: [
      {
        id: 'alpha',
        name: 'Alpha Provider',
        url: 'https://alpha.example/pay',
        method: 'post',
        status: 402,
        latencyMs: 120,
        payment: { price: '$0.003' },
        settlement: { successes: 9, attempts: 10 },
      },
    ],
  };

  const normalized = normalizeIndexerEndpoints(payload);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].method, 'POST');
  assert.equal(normalized[0].x402Details?.price, '$0.003');
  assert.equal(normalized[0].settlementSuccessRate, 0.9);
  assert.equal(normalized[0].settlementSamples, 10);
});

test('normalizeIndexerEndpoints maps canonical indexer contract payload into settlement evidence', () => {
  const payload = {
    providers: [
      {
        endpoint: {
          providerId: 'canonical-alpha',
          url: 'https://canonical.example/pay',
          method: 'POST',
          origin: 'https://canonical.example',
          path: '/pay',
        },
        probeEvidence: {
          statusCode: 402,
          challengePresent: true,
        },
        paidEvidence: {
          pricingMode: 'exact',
          authorization: {
            amount: '0.01',
            asset: 'USDC',
            network: 'base',
            recipient: '0xabc',
          },
          settlement: {
            status: 'settled',
            txHash: '0x123',
          },
        },
      },
    ],
  };

  const normalized = normalizeIndexerEndpoints(payload);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].name, 'canonical-alpha');
  assert.equal(normalized[0].url, 'https://canonical.example/pay');
  assert.equal(normalized[0].method, 'POST');
  assert.equal(normalized[0].status, 402);
  assert.equal(normalized[0].isX402, true);
  assert.equal(normalized[0].x402Details?.price, '0.01');
  assert.equal(normalized[0].settlementSamples, 1);
  assert.equal(normalized[0].settlementSuccessRate, 1);
});

test('pickProvider prioritizes trust gates -> settlement reliability -> latency -> price ceiling', () => {
  const endpoints = [
    {
      name: 'FastButLowerSettlement',
      url: 'https://fast.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 40,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.001' },
      settlementSuccessRate: 0.65,
      settlementSamples: 20,
    },
    {
      name: 'HigherSettlementWins',
      url: 'https://settled.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 250,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.005' },
      settlementSuccessRate: 0.95,
      settlementSamples: 20,
    },
    {
      name: 'NoTrustGatePass',
      url: 'https://fallback.example/pay',
      method: 'GET',
      status: 200,
      responseTimeMs: 20,
      isHealthy: true,
      isX402: false,
      x402Details: null,
      settlementSuccessRate: 1,
      settlementSamples: 20,
    },
  ];

  const result = pickProvider(endpoints, { priceCeilingUsd: 0.01, denyInsufficientEvidence: false });
  assert.equal(result.selected?.name, 'HigherSettlementWins');
  assert.equal(result.fallbackUsed, false);
  assert.deepEqual(result.reasonCodes, ['TRUST_GATES_PASSED']);
});

test('pickProvider is deterministic on ties (stable tie-breakers)', () => {
  const endpoints = [
    {
      name: 'B',
      url: 'https://b.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 90,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.002' },
      settlementSuccessRate: 0.8,
      settlementSamples: 10,
    },
    {
      name: 'A',
      url: 'https://a.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 90,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.002' },
      settlementSuccessRate: 0.8,
      settlementSamples: 10,
    },
  ];

  const first = pickProvider(endpoints, { priceCeilingUsd: 0.01, denyInsufficientEvidence: false });
  const second = pickProvider(endpoints, { priceCeilingUsd: 0.01, denyInsufficientEvidence: false });

  assert.equal(first.selected?.url, 'https://a.example/pay');
  assert.equal(second.selected?.url, 'https://a.example/pay');
});

test('deny-insufficient-evidence throws explicit reason codes', () => {
  const endpoints = [
    {
      name: 'NoX402',
      url: 'https://nope.example/pay',
      method: 'GET',
      status: 200,
      responseTimeMs: 50,
      isHealthy: true,
      isX402: false,
      x402Details: null,
      settlementSuccessRate: null,
      settlementSamples: null,
    },
  ];

  assert.throws(
    () => pickProvider(endpoints, { denyInsufficientEvidence: true, priceCeilingUsd: 0.01 }),
    (err) => {
      assert.ok(err instanceof RoutingDeniedError);
      assert.ok(err.reasonCodes.includes('FALLBACK_NO_TRUST_GATE_PASS'));
      assert.ok(err.reasonCodes.includes('DENY_INSUFFICIENT_EVIDENCE'));
      return true;
    },
  );
});

test('pickProvider prefers within-ceiling candidate over over-ceiling trusted option', () => {
  const endpoints = [
    {
      name: 'CautionFallback',
      url: 'https://caution.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 120,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.50' },
      settlementSuccessRate: 0.3,
      settlementSamples: 1,
    },
    {
      name: 'OverCeilingTrusted',
      url: 'https://trusted-over.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 40,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$5.00' },
      settlementSuccessRate: 1,
      settlementSamples: 20,
    },
  ];

  const result = pickProvider(endpoints, { priceCeilingUsd: 1, denyInsufficientEvidence: false });
  assert.equal(result.selected?.withinPriceCeiling, true);
  assert.ok(result.reasonCodes.includes('TRUST_GATES_PASSED'));
  assert.ok(!result.reasonCodes.includes('PRICE_ABOVE_CEILING'));
});

test('pickProvider auto-quarantines flaky paid endpoints when stable alternatives exist', () => {
  const endpoints = [
    {
      name: 'FlakyPaid',
      url: 'https://flaky.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 25,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.002' },
      settlementSuccessRate: 0.4,
      settlementSamples: 12,
    },
    {
      name: 'StablePaid',
      url: 'https://stable.example/pay',
      method: 'GET',
      status: 402,
      responseTimeMs: 90,
      isHealthy: true,
      isX402: true,
      x402Details: { price: '$0.002' },
      settlementSuccessRate: 0.92,
      settlementSamples: 12,
    },
  ];

  const result = pickProvider(endpoints, { priceCeilingUsd: 0.01, denyInsufficientEvidence: false });

  assert.equal(result.selected?.name, 'StablePaid');
  assert.equal(result.scoredTop5.find((x) => x.name === 'FlakyPaid')?.isQuarantined, true);
  assert.ok(result.reasonCodes.includes('AUTO_QUARANTINE_FLAKY_ENDPOINT'));
  assert.ok(!result.reasonCodes.includes('FALLBACK_QUARANTINE_BYPASS'));
});

test('fallback selection balances speed/cost when trust gates fail', () => {
  const endpoints = [
    {
      name: 'CheaperButSlow',
      url: 'https://slow.example/pay',
      method: 'GET',
      status: 200,
      responseTimeMs: 800,
      isHealthy: true,
      isX402: false,
      x402Details: { price: '$0.001' },
      settlementSuccessRate: 0.6,
      settlementSamples: 2,
    },
    {
      name: 'FasterSlightlyPricier',
      url: 'https://fast.example/pay',
      method: 'GET',
      status: 200,
      responseTimeMs: 70,
      isHealthy: true,
      isX402: false,
      x402Details: { price: '$0.006' },
      settlementSuccessRate: 0.6,
      settlementSamples: 2,
    },
  ];

  const result = pickProvider(endpoints, { priceCeilingUsd: 0.01, denyInsufficientEvidence: false });
  assert.equal(result.selected?.name, 'FasterSlightlyPricier');
  assert.equal(result.fallbackUsed, true);
  assert.ok(result.reasonCodes.includes('FALLBACK_NO_TRUST_GATE_PASS'));
});
