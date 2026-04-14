# Providers Score Snapshot

Generated: 2026-04-14T23:25:43.249Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}
Paid Probe Mode: enabled
Paid Probe Budget Spent: $0.0110

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| AFK Explore | 53 | high-risk | 25 | endpoint | 0 | 200 | 146ms |
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 36 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 70 |  | ms |
| Canary | 55 | high-risk | 25 | endpoint | 0 | 200 | 41ms |
| x402scan Resources | 48 | high-risk | 25 | endpoint | 0 | 200 | 341ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence | Reason Codes |
|---|---|---:|---|---:|---:|---:|---|---|---|---|---|---|
| LITCOIN Chat | POST | 81 | strong | 95 | 402 | 78ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| LITCOIN Compute | POST | 81 | strong | 95 | 402 | 76ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| DeFi Yield Compare | GET | 81 | strong | 95 | 402 | 65ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Trending Base Coins | GET | 81 | strong | 95 | 402 | 77ms | yes | $0.001 USDC | pass | yes | yes | SETTLEMENT_EVIDENCE_CONFIRMED |
| Regen Oracle | POST | 81 | strong | 95 | 402 | 77ms | yes | $0.005 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Merchants | GET | 80 | strong | 95 | 402 | 116ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Resources | GET | 80 | strong | 95 | 402 | 114ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Facilitators | GET | 80 | strong | 95 | 402 | 112ms | yes | $0.01 USDC | pass | yes | yes | SETTLEMENT_EVIDENCE_CONFIRMED |
| Bankr x402 Lint | POST | 78 | caution | 95 | 402 | 188ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Bankr x402 Health | POST | 78 | caution | 95 | 402 | 162ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Giga API | POST | 75 | caution | 95 | 402 | 311ms | yes | $5 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Apollo People | POST | 72 | caution | 80 | 402 | 235ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| dTelecom x402 | POST | 72 | caution | 95 | 402 | 201ms | yes | $0 USDC | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Exa Search | POST | 71 | caution | 80 | 402 | 243ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEmail Send | POST | 71 | caution | 80 | 402 | 251ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Firecrawl Scrape | POST | 70 | caution | 80 | 402 | 299ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableTravel Search | POST | 67 | experimental | 80 | 402 | 429ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableUpload File | POST | 61 | experimental | 80 | 402 | 641ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| AgentCash Send | POST | 61 | experimental | 95 | 402 | 568ms | yes | $10000 USDC | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Base RPC | POST | 46 | high-risk | 65 | 400 | 162ms | no | n/a | fail | no | no | SETTLEMENT_EVIDENCE_MISSING |

Total payable endpoints scored: 20
Routing candidates passing gates: 11
Routing decision: allow (at-least-one-provider-passed)

## Settlement Reliability

- Policy: trusted requires confirmed settlement evidence (TRUSTED_REQUIRES_CONFIRMED_SETTLEMENT_EVIDENCE)
- Paid probe attempts: 3
- Paid probe success rate: 66.7%
- Confirmed settlement evidence: 2
- Budget spent / max: $0.0110 / $0.0300

### Current Run

| Endpoint | Attempts | Successes | Success Rate | Paid USD | Evidence Confirmed | Last Error |
|---|---:|---:|---:|---:|---|---|
| Trending Base Coins | 1 | 1 | 100% | 0.0010 | yes | no |
| x402scan Facilitators | 1 | 1 | 100% | 0.0100 | yes | no |
| DeFi Yield Compare | 1 | 0 | 0% | 0.0000 | no | yes |

### Historical Rollup

- Historical source report: 2026-04-14T23:17:53.499Z
- Historical attempts: 7
- Historical success rate: 71.4%

| Endpoint | Attempts | Successes | Success Rate | Total Paid USD |
|---|---:|---:|---:|---:|
| Trending Base Coins | 2 | 2 | 100% | 0.0020 |
| x402scan Facilitators | 2 | 2 | 100% | 0.0200 |
| DeFi Yield Compare | 2 | 0 | 0% | 0.0000 |
| x402scan Resources | 1 | 1 | 100% | 0.0100 |
