# Client Rollout Demo Script (10 minutes)

Audience: partner PM + technical lead
Goal: show safe routing decisions, fallback behavior, and operator evidence loop.

## 0) Setup (30 sec)

```bash
pnpm install
npm run report:providers
```

Open:
- `reports/providers-score-report.md`
- `reports/providers-score-report.json`

## 1) Context (1 min)

"x402-sentinel ranks payable providers, enforces trust/evidence gates, then returns the safest usable route under a spend ceiling."

Call out:
- score band + confidence
- settlement evidence status
- reason codes for explainability

## 2) Baseline dry run (2 min)

```bash
npm run report:providers
```

Narrate from report:
- routing candidates passing gates
- `routingDecision.allowed`
- top strong candidates (price-ceiling compliant)

Expected message: "We can route now without forcing spend."

## 3) Paid evidence check (2 min)

```bash
npm run probe:paid
```

Narrate from report:
- `settlementReliabilityMetrics.paidProbeSuccessRate`
- `settlementReliabilityMetrics.settlementEvidenceConfirmedCount`
- `settlementReliabilityMetrics.paidProbeBudgetSpent` vs max

Expected message: "We confirmed real settlement on at least one endpoint under budget caps."

## 4) Fallback/deny behavior (3 min)

### Soft mode (default demo)

Set:

```bash
export SENTINEL_DENY_MODE=soft
```

Explain: returns best ceiling-compliant candidate + reason codes when evidence is incomplete.

### Hard mode (strict partner policy)

Set:

```bash
export SENTINEL_DENY_MODE=hard
```

Explain: returns `422 INSUFFICIENT_SETTLEMENT_EVIDENCE` if selected provider lacks required evidence.

Use this response shape from README as expected strict behavior.

## 5) Close (90 sec)

Say:
1. "Decision quality is measurable (score + reason codes)."
2. "Risk is bounded (price + payment-limit + deny mode)."
3. "Operations are repeatable (daily runbook + launch checklist)."

Handoff links:
- `docs/client-rollout-known-risks-one-pager.md`
- `docs/client-rollout-runbook-slice.md`
- `docs/operator-handoff-playbook.md`
