# Client Rollout Runbook Slice (Operator)

Source: condensed from `docs/operator-handoff-playbook.md` for partner rollout use.

## Daily rollout check (5–10 min)

1. Dry baseline:

```bash
npm run report:providers
```

2. Budgeted paid verification:

```bash
npm run probe:paid
```

3. Strict evidence gate before release decision:

```bash
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3 --deny-insufficient-evidence
```

## Minimum go/no-go criteria

Ship only if all are true:
- `routingDecision.allowed = true`
- paid probe budget stays within max
- at least one endpoint has confirmed settlement evidence
- no critical-path endpoint has repeated zero-success paid failures

## Incident triage (paid probe failures)

### SEV-3 (contained)
- One endpoint fails, routing still allowed.
- Action: quarantine that endpoint from critical path, continue monitoring.

### SEV-2 (degraded)
- Paid probe success rate `< 50%`.
- Action: pause partner expansion, rerun probe, collect error evidence.

### SEV-1 (launch blocker)
- Strict evidence mode returns no valid route.
- Action: hold launch, escalate with evidence bundle.

## Evidence bundle for escalation

Include:
- failing endpoint URL(s)
- `lastError` excerpts
- current + historical paid success rate
- budget spent vs max
- strict-mode outcome (`allow` or denial payload)

## Handoff template

- Timestamp:
- Routing decision (`allowed`):
- Paid probe success rate:
- Confirmed settlement evidence count:
- Budget spent / max:
- Quarantined endpoints:
- Open risk + owner:
