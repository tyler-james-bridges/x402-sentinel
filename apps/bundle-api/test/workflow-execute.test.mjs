import test from 'node:test';
import assert from 'node:assert/strict';
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

test('POST /api/workflow/execute enforces payment challenge then succeeds with payment proof header', async (t) => {
  const server = spawn('node', ['dist/index.js'], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
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
});
