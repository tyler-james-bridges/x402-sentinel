import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { RoutingDeniedError, runGTMCopilotBundle } from './routes/gtm-copilot.js';
import { runTokenRiskScreenBundle } from './routes/token-risk-screen.js';
import {
  parseGTMCopilotInput,
  parseTokenRiskScreenInput,
  parseWorkflowBundleId,
} from './schemas/bundle-input.js';

const PORT = Number(process.env.PORT || 4021);

function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}

function hasPaymentProof(req: IncomingMessage): boolean {
  const paymentProof = req.headers['x-payment-proof'];
  const auth = req.headers.authorization;
  if (typeof paymentProof === 'string' && paymentProof.trim().length > 0) return true;
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('payment ')) return true;
  return false;
}

function paymentRequired(res: ServerResponse) {
  const challenge = {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact',
        network: process.env.SENTINEL_PAYMENT_NETWORK || 'eip155:8453',
        amount: process.env.SENTINEL_PAYMENT_AMOUNT || '10000',
        asset: process.env.SENTINEL_PAYMENT_ASSET || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        payTo: process.env.SENTINEL_PAYMENT_PAYTO || '0x0000000000000000000000000000000000000000',
      },
    ],
  };

  return json(
    res,
    402,
    { error: 'payment required', challenge },
    {
      'www-authenticate': 'Payment',
      'payment-required': JSON.stringify(challenge),
      'x-payment-required': JSON.stringify(challenge),
    },
  );
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    if (!req.url || !req.method) return json(res, 400, { error: 'bad request' });

    if (req.method === 'GET' && req.url === '/health') {
      return json(res, 200, { ok: true, service: 'x402-sentinel-bundle-api' });
    }

    if (req.method === 'POST' && req.url === '/api/bundles/gtm-copilot') {
      const rawInput = await readJsonBody(req);
      const parsed = parseGTMCopilotInput(rawInput);
      if (!parsed.ok) {
        return json(res, 400, { error: parsed.error });
      }

      const result = await runGTMCopilotBundle(parsed.data);
      return json(res, 200, result);
    }

    if (req.method === 'POST' && req.url === '/api/bundles/token-risk-screen') {
      const rawInput = await readJsonBody(req);
      const parsed = parseTokenRiskScreenInput(rawInput);
      if (!parsed.ok) {
        return json(res, 400, { error: parsed.error });
      }

      const result = await runTokenRiskScreenBundle(parsed.data);
      return json(res, 200, result);
    }

    if (req.method === 'POST' && req.url === '/api/workflow/execute') {
      if (!hasPaymentProof(req)) {
        return paymentRequired(res);
      }

      const rawInput = await readJsonBody(req);
      const bundleId = parseWorkflowBundleId(rawInput);

      if (bundleId === 'token-risk-screen') {
        const parsed = parseTokenRiskScreenInput(rawInput);
        if (!parsed.ok) {
          return json(res, 400, { error: parsed.error });
        }

        const result = await runTokenRiskScreenBundle(parsed.data);
        return json(res, 200, result);
      }

      const parsed = parseGTMCopilotInput(rawInput);
      if (!parsed.ok) {
        return json(res, 400, { error: parsed.error });
      }

      const result = await runGTMCopilotBundle(parsed.data);
      return json(res, 200, result);
    }

    return json(res, 404, { error: 'not found' });
  } catch (error) {
    if (error instanceof RoutingDeniedError) {
      return json(res, 422, {
        code: 'INSUFFICIENT_SETTLEMENT_EVIDENCE',
        error: error.message,
        reasonCodes: error.reasonCodes,
        fallbackUsed: error.diagnostics.fallbackUsed,
        top5: error.diagnostics.top5,
        action: 'collect_more_settlement_data_or_disable_strict_mode',
      });
    }

    return json(res, 500, {
      error: error instanceof Error ? error.message : 'internal error',
    });
  }
});

server.listen(PORT, () => {
  console.log(`x402-sentinel bundle-api listening on :${PORT}`);
});
