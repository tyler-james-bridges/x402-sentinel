# x402-sentinel Launch Report

Generated: 2026-04-14

## Scope
Production hardening + launch-readiness check for:
- paid workflow route
- trust-gated provider routing
- paid probe settlement checks
- fallback behavior

## Validation Results

### 1) Bundle API tests
Command:
- `pnpm --filter @x402-sentinel/bundle-api test`

Result:
- 7 passed, 0 failed
- Includes integration coverage for `POST /api/workflow/execute`:
  - unpaid call => 402 challenge
  - paid proof header => 200 success

### 2) Paid probe checks
Command:
- `npm run probe:paid`

Result:
- Report artifacts generated:
  - `reports/providers-score-report.json`
  - `reports/providers-score-report.md`
- Bankr `yield-compare` endpoint returned 500 after payment on this run (captured as failure evidence)
- Other paid probes completed and were recorded

## Hardening Status

### Shipped
- Tiered routing/fallback logic (trusted -> strong -> caution)
- Price-ceiling preference before over-ceiling fallback
- Settlement evidence used in routing preference
- Provider preview has bounded retries + idempotency key header
- Reason codes emitted for routing/fallback outcomes

### Known Risks
- Some external provider endpoints can still fail post-payment (observed on Bankr `yield-compare`)
- Settlement evidence quality depends on upstream provider behavior and probe coverage per run

## Go / No-Go
- **Go with caution**
  - Core API flow is stable and tested
  - Keep paid probe report in release checklist
  - Keep known-failing external endpoints out of default critical path until stabilized

## Recommended Immediate Follow-up
1. Add deny-mode smoke test in CI for strict evidence enforcement
2. Auto-quarantine providers with repeated paid failures
3. Publish a short operator runbook section for interpreting probe failures
