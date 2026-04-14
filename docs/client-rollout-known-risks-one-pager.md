# Client One-Pager: Known Risks + Fallback Behavior

## What can go wrong

1. **Post-payment provider failure**
   - A provider can accept payment challenge flow but still fail on fulfillment (observed in paid probes).
2. **Incomplete settlement evidence**
   - Endpoints may score well but still lack confirmed settlement proof in a given run.
3. **External reliability drift**
   - Third-party endpoints can degrade between runs (latency/error spikes).

## How sentinel contains risk

- **Spend guardrails**
  - `--max-payment` (default `0.01`) caps per probe.
  - `--payment-limit` (default `3`) caps total paid attempts per run.
- **Trust gate policy**
  - `trusted` requires confirmed settlement evidence.
  - Missing evidence downgrades trust band (`TRUSTED_REQUIRES_CONFIRMED_SETTLEMENT_EVIDENCE`).
- **Explainable outcomes**
  - Every decision includes reason codes for auditability.

## Fallback behavior (what partners should expect)

### Soft mode (`SENTINEL_DENY_MODE=soft`)
- Returns best available ceiling-compliant candidate.
- Includes reason codes when evidence is partial.
- Use when continuity is preferred over strict denial.

### Hard mode (`SENTINEL_DENY_MODE=hard`)
- Denies route if settlement evidence requirement is unmet.
- Returns `422` with `INSUFFICIENT_SETTLEMENT_EVIDENCE` payload.
- Use for strict compliance/risk posture.

## Operator triggers to escalate

Escalate when any are true:
- paid probe success rate `< 50%`
- `routingDecision.allowed = false`
- budget max exceeded
- repeated endpoint failures across runs

## Partner-safe defaults

```bash
npm run report:providers
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3 --deny-insufficient-evidence
```

These defaults prioritize budget control, evidence quality, and predictable fail-safe behavior.
