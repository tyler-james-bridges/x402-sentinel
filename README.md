# x402-sentinel

Trust and routing layer for x402 services.

## Workspace packages
- `@x402-sentinel/probe`: discovery + protocol probes
- `@x402-sentinel/score`: rubric scoring + trust gates
- `@x402-sentinel/bundle-api`: workflow bundle API

## Contracts
- `contracts/indexer-to-sentinel.schema.json`: canonical evidence envelope from indexer -> sentinel.
  - Requires endpoint identity, discovery evidence, probe evidence, paid evidence, timestamps, and confidence.
  - Includes versioned `schemaVersion` (semver string) for forward-compatible migrations.

## Discovery clients
- `@x402-sentinel/probe` now includes a Bazaar v2 discovery client:
  - `fetchBazaarDiscoveryResources(baseUrl, { network, asset, scheme, maxPrice })`
  - Targets `GET /v2/x402/discovery/resources`
  - Normalizes common response payload shapes (`resources`, `data`, or `data.resources`)

## Quick start
```bash
pnpm install
pnpm typecheck
pnpm --filter @x402-sentinel/probe test
```

## Reporting
```bash
npm run report:providers
npm run probe:paid
```

Paid probe safety/budget runbook:
- `docs/paid-probe-safety-budget-runbook.md`

Client rollout package:
- `docs/client-rollout-demo-script.md`
- `docs/client-rollout-known-risks-one-pager.md`
- `docs/client-rollout-runbook-slice.md`

## Bundle API: GTM copilot routing
- `POST /api/bundles/gtm-copilot`
- Required body: `{ "targets": string[], "goal": string, "budget"?: number }`

Policy env vars:
- `SENTINEL_PRICE_CEILING_USD` (default `0.01`)
- `SENTINEL_DENY_MODE=hard|soft`
  - `hard`: deny candidates with insufficient settlement evidence (returns `422`)
  - `soft`: return best ceiling-compliant candidate and include reason codes in response
- Backward compatibility: `SENTINEL_DENY_INSUFFICIENT_EVIDENCE=true` maps to `SENTINEL_DENY_MODE=hard` when `SENTINEL_DENY_MODE` is unset

Strict deny response shape (`422`):
```json
{
  "code": "INSUFFICIENT_SETTLEMENT_EVIDENCE",
  "error": "routing denied: selected provider lacks settlement evidence",
  "reasonCodes": ["TRUST_GATES_PASSED", "INSUFFICIENT_SETTLEMENT_EVIDENCE", "DENY_INSUFFICIENT_EVIDENCE"],
  "fallbackUsed": false,
  "top5": [],
  "action": "collect_more_settlement_data_or_disable_strict_mode"
}
```

## Paid workflow endpoint
- `POST /api/workflow/execute`
- Returns `402 Payment Required` unless one of these is present:
  - `x-payment-proof` header
  - `Authorization: Payment ...`

## Bazaar MCP setup (CDP)
- Setup/runbook: `docs/bazaar-mcp-setup.md`
- Goal: consume Bazaar MCP tools (`search_resources`, `proxy_tool_call`) with automatic payment handling via `@x402/mcp`.
- MCP endpoint: `https://api.cdp.coinbase.com/platform/v2/x402/discovery/mcp`
- Smoke test: `npm run mcp:smoke`

## Probe refresh automation (GitHub Actions)
- Workflow: `.github/workflows/probe-refresh.yml`
- Schedule: every 2 hours + manual dispatch
- Runs:
  - `npm run probe:paid`
  - `npm run probe:publish` (builds `reports/indexer-settlement-payload.json`)
- Optional direct publish to indexer/canary:
  - `SENTINEL_INDEXER_PUBLISH_URL` (GitHub secret)
  - `SENTINEL_INDEXER_PUBLISH_TOKEN` (GitHub secret, optional)

Local publish helper:
```bash
npm run probe:publish -- --to https://your-indexer.example/api/settlement-evidence
```
