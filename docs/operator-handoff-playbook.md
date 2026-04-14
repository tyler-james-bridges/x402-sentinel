# Operator Handoff Playbook (Week 2 · Track 3)

This is the day-to-day operator guide for x402-sentinel launch and steady-state support.

> Scope: runbook, paid-probe incident response, launch checklist, and success metrics.  
> Out of scope: MCP setup.

## 1) Fast Runbook

### Daily / pre-release checks

1. Generate no-spend baseline:

```bash
npm run report:providers
```

2. Generate paid settlement verification (default safety caps):

```bash
npm run probe:paid
```

3. If hard evidence gating is required for a release decision:

```bash
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3 --deny-insufficient-evidence
```

4. Review artifacts:
- `reports/providers-score-report.md`
- `reports/providers-score-report.json`

### What to confirm in every run

- `routingDecision.allowed` is `true`
- `settlementReliabilityMetrics.paidProbeSuccessRate` is stable (target in metrics section)
- `settlementReliabilityMetrics.paidProbeBudgetSpent <= paidProbeBudgetMax`
- No new repeated failures in `settlementReliabilityHistorical.byEndpoint`

## 2) Paid Probe Failure Incident Response

Trigger this flow when paid probes fail or settlement evidence degrades.

### Severity

- **SEV-3 (contained):** one endpoint fails paid probe, routing still allowed
- **SEV-2 (degraded):** paid probe success rate drops below 50% in current run
- **SEV-1 (launch blocker):** no routing candidates pass under strict evidence mode (`--deny-insufficient-evidence`)

### Response steps (in order)

1. **Re-run with safe cap and capture fresh evidence**

```bash
npm run probe:paid
```

2. **Identify failing endpoints**
- Check `settlementReliability[]` entries where:
  - `successes = 0`
  - `lastError` is present
- Cross-check repeat offenders in `settlementReliabilityHistorical.byEndpoint`

3. **Contain impact**
- Keep failing endpoints out of critical path routing decisions
- Run strict evidence check before release decisions:

```bash
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3 --deny-insufficient-evidence
```

4. **Classify the failure**
- **Provider-side post-payment 5xx** (example observed): quarantine endpoint and monitor historical trend
- **Budget guardrail hit** (`paidProbeBudgetSpent` near/over max): reduce probe scope; do not increase cap ad hoc
- **Broad failure pattern** (multiple providers): treat as network/vendor degradation, delay launch

5. **Escalate with evidence**
- Include:
  - failing endpoint URL(s)
  - `lastError` excerpts
  - current and historical success rates
  - budget spent vs max

### Recovery criteria

Incident can be closed when all are true:
- Current run paid probe success rate is back to target band
- At least one strong routing candidate has confirmed settlement evidence
- No new repeat failures for quarantined endpoints in the next verification run

## 3) Launch Checklist

Run this before production launch or significant routing policy change.

- [ ] `pnpm --filter @x402-sentinel/bundle-api test` passes
- [ ] `npm run report:providers` generated successfully
- [ ] `npm run probe:paid` generated successfully
- [ ] `routingDecision.allowed` is `true`
- [ ] Strict evidence check completed (`--deny-insufficient-evidence`) and outcome recorded
- [ ] Paid probe budget stayed within configured max
- [ ] Any known failing endpoints are documented and excluded from critical path
- [ ] `reports/launch-report-YYYY-MM-DD.md` updated with go/no-go decision

## 4) Success Metrics (Operator Scorecard)

Track these every run and weekly rollup.

### Core SLO-style targets

- **Paid probe success rate:** `>= 0.70` (warn: `< 0.70`, critical: `< 0.50`)
- **Budget compliance:** `paidProbeBudgetSpent <= paidProbeBudgetMax` (critical if exceeded)
- **Routing viability:** `routingDecision.allowed = true` (critical if false)
- **Confirmed settlement evidence count:** `>= 1` per paid run (warn if 0)
- **Repeat failure control:** no endpoint with `successRate = 0` across 2+ historical attempts in release path

### Report fields to chart

From `reports/providers-score-report.json`:
- `settlementReliabilityMetrics.paidProbeSuccessRate`
- `settlementReliabilityMetrics.paidProbeBudgetSpent`
- `settlementReliabilityMetrics.paidProbeBudgetMax`
- `settlementReliabilityMetrics.settlementEvidenceConfirmedCount`
- `routingDecision.allowed`
- `settlementReliabilityHistorical.byEndpoint[]`

### Operator handoff note template

Use this in shift handoff/release notes:

- Run timestamp:
- Paid probe success rate:
- Budget spent / max:
- Confirmed settlement evidence count:
- Routing decision:
- Quarantined endpoints:
- Open risks / next action:
