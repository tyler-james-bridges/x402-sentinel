import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { runSentinelPreflight } from '../../../dist/sentinel-client.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('runSentinelPreflight returns success result for 200', async () => {
  globalThis.fetch = async () => ({
    status: 200,
    json: async () => ({
      providerSelected: 'https://provider.example.com/pay',
      scoreSnapshot: { reasonCodes: ['TRUST_GATES_PASSED'] },
    }),
  });

  const result = await runSentinelPreflight('https://sentinel.0x402.sh', {
    targets: ['https://x402.org'],
    goal: 'rank providers',
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.providerSelected, 'https://provider.example.com/pay');
  assert.deepEqual(result.reasonCodes, ['TRUST_GATES_PASSED']);
});

test('runSentinelPreflight returns deny result for 422', async () => {
  globalThis.fetch = async () => ({
    status: 422,
    json: async () => ({
      code: 'INSUFFICIENT_SETTLEMENT_EVIDENCE',
      reasonCodes: ['DENY_INSUFFICIENT_EVIDENCE'],
      action: 'collect_more_settlement_data_or_disable_strict_mode',
    }),
  });

  const result = await runSentinelPreflight('https://sentinel.0x402.sh', {
    targets: ['https://x402.org'],
    goal: 'rank providers',
  });

  assert.equal(result.ok, false);
  assert.equal(result.deny, true);
  assert.equal(result.status, 422);
  assert.equal(result.code, 'INSUFFICIENT_SETTLEMENT_EVIDENCE');
  assert.deepEqual(result.reasonCodes, ['DENY_INSUFFICIENT_EVIDENCE']);
});

test('runSentinelPreflight returns error result for non-policy failures', async () => {
  globalThis.fetch = async () => ({
    status: 500,
    json: async () => ({ error: 'internal error' }),
  });

  const result = await runSentinelPreflight('https://sentinel.0x402.sh', {
    targets: ['https://x402.org'],
    goal: 'rank providers',
  });

  assert.equal(result.ok, false);
  assert.equal(result.deny, false);
  assert.equal(result.status, 500);
  assert.equal(result.error, 'internal error');
});
