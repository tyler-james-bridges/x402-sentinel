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
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3
```

Paid probe safety/budget runbook:
- `docs/paid-probe-safety-budget-runbook.md`
