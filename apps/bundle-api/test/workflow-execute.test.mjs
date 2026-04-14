import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PORT = 4123;
const BASE = `http://127.0.0.1:${PORT}`;
const APP_DIR = fileURLToPath(new URL('..', import.meta.url));

async function waitForHealth(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('server did not become healthy in time');
}

function startMockIndexer() {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          providers: [
            {
              id: 'mock-stable',
              name: 'Mock Stable',
              url: 'https://mock-provider.example/pay',
              method: 'GET',
              status: 402,
              latencyMs: 45,
              x402Details: { price: '$0.001', network: 'base', token: 'USDC' },
              settlement: { successes: 9, attempts: 10 },
              isHealthy: true,
              isX402: true,
            },
          ],
        }),
      );
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('failed to resolve mock indexer port'));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

test('POST /api/workflow/execute enforces payment challenge then succeeds with payment proof header', async (t) => {
  const mockIndexer = await startMockIndexer();
  t.after(() => mockIndexer.server.close());

  const server = spawn('node', ['dist/index.js'], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
      SENTINEL_INDEXER_URL: `http://127.0.0.1:${mockIndexer.port}/api/health`,
      SENTINEL_BUNDLE_DRY_RUN: 'true',
    },
    stdio: 'ignore',
  });

  t.after(() => {
    if (!server.killed) server.kill('SIGTERM');
  });

  await waitForHealth(`${BASE}/health`);

  const payload = {
    targets: ['bankr'],
    goal: 'integration-test',
  };

  const unpaid = await fetch(`${BASE}/api/workflow/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(unpaid.status, 402);
  assert.equal(unpaid.headers.get('www-authenticate'), 'Payment');
  const challenge = unpaid.headers.get('payment-required') || unpaid.headers.get('x-payment-required');
  assert.ok(challenge, 'expected payment challenge header');

  const paid = await fetch(`${BASE}/api/workflow/execute`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-payment-proof': 'test-proof',
    },
    body: JSON.stringify(payload),
  });

  assert.equal(paid.status, 200);
  const body = await paid.json();
  assert.ok(body.jobId, 'expected jobId in success response');
  assert.ok(body.providerSelected, 'expected providerSelected in success response');
  assert.equal(body.bundleArtifact.workflow, 'gtm-copilot');
});

test('POST /api/workflow/execute runs token-risk-screen bundle when bundleId is set', async (t) => {
  const mockIndexer = await startMockIndexer();
  t.after(() => mockIndexer.server.close());

  const server = spawn('node', ['dist/index.js'], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      PORT: String(PORT + 1),
      SENTINEL_INDEXER_URL: `http://127.0.0.1:${mockIndexer.port}/api/health`,
      SENTINEL_BUNDLE_DRY_RUN: 'true',
    },
    stdio: 'ignore',
  });

  const localBase = `http://127.0.0.1:${PORT + 1}`;

  t.after(() => {
    if (!server.killed) server.kill('SIGTERM');
  });

  await waitForHealth(`${localBase}/health`);

  const payload = {
    bundleId: 'token-risk-screen',
    targets: ['screening'],
    goal: 'screen risky tokens before routing',
    chainId: 'eip155:8453',
    tokens: [
      { address: '0x000000000000000000000000000000000000dEaD', symbol: 'DEAD' },
      { address: '0x1111111111111111111111111111111111111111', symbol: 'USDC' },
    ],
  };

  const paid = await fetch(`${localBase}/api/workflow/execute`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-payment-proof': 'test-proof',
    },
    body: JSON.stringify(payload),
  });

  assert.equal(paid.status, 200);
  const body = await paid.json();
  assert.equal(body.bundleArtifact.workflow, 'token-risk-screen');
  assert.ok(body.bundleArtifact.tokenRiskSummary, 'expected tokenRiskSummary field');
  assert.ok(Array.isArray(body.bundleArtifact.tokenRiskFindings), 'expected tokenRiskFindings array');
  assert.equal(body.bundleArtifact.tokenRiskFindings.length, 2);

  const deadTokenFinding = body.bundleArtifact.tokenRiskFindings.find((f) => f.symbol === 'DEAD');
  assert.ok(deadTokenFinding, 'expected DEAD token finding');
  assert.ok(deadTokenFinding.riskScore >= 45, 'expected elevated risk score for suspicious token');
  assert.ok(['review', 'block'].includes(deadTokenFinding.recommendation));
});
