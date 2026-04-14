import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schemaPath = new URL('../../../contracts/indexer-to-sentinel.schema.json', import.meta.url);

async function loadSchema() {
  const raw = await readFile(schemaPath, 'utf8');
  return JSON.parse(raw);
}

function createValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

test('indexer-to-sentinel schema validates a complete evidence payload', async () => {
  const schema = await loadSchema();
  const validate = createValidator(schema);

  const validPayload = {
    schemaVersion: '1.0.0',
    endpoint: {
      providerId: 'provider_123',
      origin: 'https://api.example.com',
      url: 'https://api.example.com/v1/quote',
      method: 'POST',
      path: '/v1/quote',
      network: 'base',
      asset: 'USDC',
      scheme: 'x402',
    },
    discoveryEvidence: {
      source: 'bazaar-v2',
      discoveredAt: '2026-04-14T12:00:00Z',
      proofs: [{ kind: 'bazaar-index', location: 'https://bazaar.example.com/v2/x402/discovery/resources' }],
    },
    probeEvidence: {
      probedAt: '2026-04-14T12:01:00Z',
      statusCode: 402,
      challengePresent: true,
      findings: [{ id: 'probe.402', severity: 'info', passed: true, message: '402 challenge parsed' }],
    },
    paidEvidence: {
      attemptedAt: '2026-04-14T12:02:00Z',
      pricingMode: 'upto',
      authorization: {
        amount: '0.25',
        asset: 'USDC',
        network: 'base',
        recipient: '0x1111111111111111111111111111111111111111',
      },
      settlement: {
        status: 'settled',
        settledAmount: '0.21',
        txHash: '0xabc123',
      },
    },
    timestamps: {
      indexedAt: '2026-04-14T12:00:01Z',
      observedAt: '2026-04-14T12:02:00Z',
      updatedAt: '2026-04-14T12:03:00Z',
    },
    confidence: {
      score: 0.92,
      level: 'high',
      reasons: ['paid-check-passed', 'recent-probe'],
    },
  };

  const ok = validate(validPayload);
  assert.equal(ok, true, `expected payload to be valid, got: ${JSON.stringify(validate.errors)}`);
});

test('indexer-to-sentinel schema rejects payloads missing required evidence blocks', async () => {
  const schema = await loadSchema();
  const validate = createValidator(schema);

  const invalidPayload = {
    schemaVersion: '1.0.0',
    endpoint: {
      origin: 'https://api.example.com',
      url: 'https://api.example.com/v1/quote',
      method: 'POST',
      path: '/v1/quote',
    },
    discoveryEvidence: {
      source: 'openapi',
      discoveredAt: '2026-04-14T12:00:00Z',
      proofs: [{ kind: 'openapi', location: 'https://api.example.com/openapi.json' }],
    },
    probeEvidence: {
      probedAt: '2026-04-14T12:01:00Z',
      statusCode: 402,
      challengePresent: true,
      findings: [],
    },
    timestamps: {
      indexedAt: '2026-04-14T12:00:01Z',
      observedAt: '2026-04-14T12:02:00Z',
      updatedAt: '2026-04-14T12:03:00Z',
    },
    confidence: {
      score: 0.8,
      level: 'medium',
    },
  };

  const ok = validate(invalidPayload);
  assert.equal(ok, false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'required' && String(error.params?.missingProperty).includes('paidEvidence')));
});
