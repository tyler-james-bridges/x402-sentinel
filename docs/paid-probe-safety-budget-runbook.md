# Paid Probe Safety + Budget Control Runbook

This runbook defines safe operator defaults for settlement-confirming paid probes.

## Scope

Applies to:
- `npm run report:providers -- --with-payment ...`
- any workflow that executes `bankr x402 call` to confirm settlement evidence

## Safety Defaults

Default report behavior is **dry** (no paid probe):

```bash
npm run report:providers
```

Paid probes run only when `--with-payment` is explicitly set.

## Flags

- `--with-payment`
  - Enables paid probes to collect settlement evidence.
  - Without this flag, settlement evidence remains unconfirmed.

- `--max-payment <usd>` (default: `0.01`)
  - Per-call hard cap passed to `bankr x402 call --max-payment`.
  - Guardrail: rejects expensive endpoints from candidate set.

- `--payment-limit <n>` (default: `3`)
  - Max number of paid probes attempted per report execution.
  - Guardrail: caps aggregate spend and chain-side risk.

- `--deny-insufficient-evidence`
  - Tightens routing decision when no providers pass evidence gates.

- `--strict-payable`
  - Reporting mode toggle for endpoint listing (does not bypass guardrails).

## Trusted Band Policy (Hard Rule)

`trusted` requires **confirmed settlement evidence**.

- If endpoint score is `trusted` and settlement evidence is missing:
  - downgrade to `strong`
  - attach reason code: `TRUSTED_REQUIRES_CONFIRMED_SETTLEMENT_EVIDENCE`

Settlement evidence status reason codes:
- `SETTLEMENT_EVIDENCE_CONFIRMED`
- `SETTLEMENT_EVIDENCE_MISSING`

## Budget Guardrails

1. Keep `--max-payment` tiny (`0.01` default) unless explicitly approved.
2. Keep `--payment-limit` low (`3` default) for recurring runs.
3. Prefer GET candidates first (lower side-effect profile).
4. Never run paid probes against unknown write endpoints without review.
5. Track:
   - spent amount in current run
   - historical rollup spend and success rate

## Recommended Commands

Safe baseline (no spend):

```bash
npm run report:providers
```

Budgeted verification run:

```bash
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3
```

Strict routing with evidence enforcement:

```bash
npm run report:providers -- --with-payment --max-payment 0.01 --payment-limit 3 --deny-insufficient-evidence
```

## Operational Checklist

Before run:
- Confirm budget caps (`--max-payment`, `--payment-limit`)
- Confirm environment has `bankr` available (for paid mode)
- Confirm target endpoints are expected and low-risk

After run:
- Review `reports/providers-score-report.md` settlement reliability section
- Review JSON keys:
  - `settlementReliability`
  - `settlementReliabilityMetrics`
  - `settlementReliabilityHistorical`
- Confirm no unexpected spend or error spikes
