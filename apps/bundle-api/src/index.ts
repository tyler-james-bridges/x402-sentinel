import { createServer } from 'node:http';
import { runGTMCopilotBundle } from './routes/gtm-copilot.js';

const PORT = Number(process.env.PORT || 4021);

function json(res: any, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) return json(res, 400, { error: 'bad request' });

    if (req.method === 'GET' && req.url === '/health') {
      return json(res, 200, { ok: true, service: 'x402-sentinel-bundle-api' });
    }

    if (req.method === 'POST' && req.url === '/api/bundles/gtm-copilot') {
      const input = await readJsonBody(req);
      if (!Array.isArray(input?.targets) || typeof input?.goal !== 'string') {
        return json(res, 400, { error: 'invalid payload: targets[] and goal are required' });
      }

      const result = await runGTMCopilotBundle({
        targets: input.targets,
        goal: input.goal,
        budget: typeof input.budget === 'number' ? input.budget : undefined,
      });
      return json(res, 200, result);
    }

    return json(res, 404, { error: 'not found' });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : 'internal error',
    });
  }
});

server.listen(PORT, () => {
  console.log(`x402-sentinel bundle-api listening on :${PORT}`);
});
