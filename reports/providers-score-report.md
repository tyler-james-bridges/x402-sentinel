# Providers Score Snapshot

Generated: 2026-04-14T22:37:44.371Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}
Paid Probe Mode: enabled
Paid Probe Budget Spent: $0.0110

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| AFK Explore | 44 | high-risk | 25 | endpoint | 0 | 200 | 500ms |
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 37 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 72 |  | ms |
| Canary | 53 | high-risk | 25 | endpoint | 0 | 200 | 140ms |
| x402scan Resources | 52 | high-risk | 25 | endpoint | 0 | 200 | 192ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence | Reason Codes |
|---|---|---:|---|---:|---:|---:|---|---|---|---|---|---|
| Trending Base Coins | GET | 81 | strong | 95 | 402 | 78ms | yes | $0.001 USDC | pass | yes | yes | SETTLEMENT_EVIDENCE_CONFIRMED |
| LITCOIN Chat | POST | 80 | strong | 95 | 402 | 103ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| LITCOIN Compute | POST | 80 | strong | 95 | 402 | 80ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| DeFi Yield Compare | GET | 80 | strong | 95 | 402 | 80ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Regen Oracle | POST | 80 | strong | 95 | 402 | 84ms | yes | $0.005 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Facilitators | GET | 77 | caution | 95 | 402 | 227ms | yes | $0.01 USDC | pass | yes | yes | SETTLEMENT_EVIDENCE_CONFIRMED |
| Bankr x402 Health | POST | 76 | caution | 95 | 402 | 258ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Merchants | GET | 76 | caution | 95 | 402 | 243ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Resources | GET | 75 | caution | 95 | 402 | 290ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Bankr x402 Lint | POST | 73 | caution | 95 | 402 | 392ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| dTelecom x402 | POST | 72 | caution | 95 | 402 | 225ms | yes | $0 USDC | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Apollo People | POST | 71 | caution | 80 | 402 | 260ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableTravel Search | POST | 68 | experimental | 80 | 402 | 378ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Giga API | POST | 68 | experimental | 95 | 402 | 576ms | yes | $5 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEmail Send | POST | 67 | experimental | 80 | 402 | 408ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Firecrawl Scrape | POST | 66 | experimental | 80 | 402 | 459ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableUpload File | POST | 65 | experimental | 80 | 402 | 515ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Exa Search | POST | 62 | experimental | 80 | 402 | 631ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| AgentCash Send | POST | 62 | experimental | 80 | 402 | 615ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Base RPC | POST | 39 | high-risk | 65 | 400 | 448ms | no | n/a | fail | no | no | SETTLEMENT_EVIDENCE_MISSING |

Total payable endpoints scored: 20
Routing candidates passing gates: 9
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

- Historical source report: 2026-04-14T19:16:26.916Z
- Historical attempts: 5
- Historical success rate: 60.0%

| Endpoint | Attempts | Successes | Success Rate | Total Paid USD |
|---|---:|---:|---:|---:|
| Trending Base Coins | 2 | 2 | 100% | 0.0020 |
| DeFi Yield Compare | 2 | 0 | 0% | 0.0000 |
| x402scan Facilitators | 1 | 1 | 100% | 0.0100 |
