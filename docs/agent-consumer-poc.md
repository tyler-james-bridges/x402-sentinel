# Agent Consumer POC (Sentinel Preflight)

Goal: integrate one real consumer with minimal friction.

## Install

If the consumer is in this monorepo, use:

```ts
import { runSentinelPreflight } from '@x402-sentinel/probe';
```

If external repo, copy the helper logic from `packages/probe/src/sentinel-client.ts`.

## Usage Pattern

```ts
const preflight = await runSentinelPreflight('https://sentinel.0x402.sh', {
  targets: ['https://x402.org'],
  goal: 'rank providers',
  budget: 0.01,
});

if (preflight.ok) {
  // proceed with selected provider
  const providerUrl = preflight.providerSelected;
  // ... call paid provider
} else if (preflight.deny) {
  // expected policy deny (422)
  // show reason/action and pause spending
  console.warn('policy deny', preflight.code, preflight.reasonCodes, preflight.action);
} else {
  // transport/server error
  throw new Error(`sentinel error (${preflight.status}): ${preflight.error}`);
}
```

## Operational Guidance

- Treat `422` as expected business outcome, not crash.
- Log `reasonCodes` and selected provider for auditability.
- Add feature flag: `USE_SENTINEL_ROUTING=true` for gradual rollout.

## Success Criteria (24h)

- At least one production agent path calls sentinel preflight.
- Measure:
  - preflight `200` rate
  - preflight `422` rate
  - median preflight latency
  - override/fallback rate
