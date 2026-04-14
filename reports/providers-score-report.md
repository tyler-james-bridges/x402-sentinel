# Providers Score Snapshot

Generated: 2026-04-14T19:16:26.914Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}
Paid Probe Mode: disabled


## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| AFK Explore | 43 | high-risk | 25 | endpoint | 0 | 200 | 559ms |
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 37 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 72 |  | ms |
| Canary | 55 | high-risk | 25 | endpoint | 0 | 200 | 60ms |
| x402scan Resources | 42 | high-risk | 25 | endpoint | 0 | 200 | 583ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence | Reason Codes |
|---|---|---:|---|---:|---:|---:|---|---|---|---|---|---|
| LITCOIN Chat | POST | 81 | strong | 95 | 402 | 79ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| DeFi Yield Compare | GET | 81 | strong | 95 | 402 | 79ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| LITCOIN Compute | POST | 80 | strong | 95 | 402 | 81ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Trending Base Coins | GET | 80 | strong | 95 | 402 | 98ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Facilitators | GET | 79 | caution | 95 | 402 | 120ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Bankr x402 Health | POST | 78 | caution | 95 | 402 | 179ms | yes | $0.001 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Regen Oracle | POST | 78 | caution | 95 | 402 | 182ms | yes | $0.005 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Merchants | GET | 77 | caution | 95 | 402 | 236ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Giga API | POST | 77 | caution | 95 | 402 | 216ms | yes | $5 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| x402scan Resources | GET | 76 | caution | 95 | 402 | 272ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Bankr x402 Lint | POST | 75 | caution | 95 | 402 | 306ms | yes | $0.01 USDC | pass | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| dTelecom x402 | POST | 72 | caution | 95 | 402 | 230ms | yes | $0 USDC | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Apollo People | POST | 71 | caution | 80 | 402 | 243ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Firecrawl Scrape | POST | 70 | caution | 80 | 402 | 312ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEnrich Exa Search | POST | 68 | experimental | 80 | 402 | 381ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableEmail Send | POST | 68 | experimental | 80 | 402 | 391ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableUpload File | POST | 68 | experimental | 80 | 402 | 381ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| StableTravel Search | POST | 66 | experimental | 80 | 402 | 448ms | yes | n/a | fail | yes | no | SETTLEMENT_EVIDENCE_MISSING |
| Base RPC | POST | 46 | high-risk | 65 | 400 | 171ms | no | n/a | fail | no | no | SETTLEMENT_EVIDENCE_MISSING |
| AgentCash Send | POST | 42 | high-risk | 80 | 500 | 341ms | no | n/a | fail | no | no | SETTLEMENT_EVIDENCE_MISSING |

Total payable endpoints scored: 20
Routing candidates passing gates: 11
Routing decision: allow (at-least-one-provider-passed)

## Settlement Reliability

- Policy: trusted requires confirmed settlement evidence (TRUSTED_REQUIRES_CONFIRMED_SETTLEMENT_EVIDENCE)
- Paid probe attempts: 0
- Paid probe success rate: 0.0%
- Confirmed settlement evidence: 0
- Budget spent / max: $0.0000 / $0.0300

### Current Run

| Endpoint | Attempts | Successes | Success Rate | Paid USD | Evidence Confirmed | Last Error |
|---|---:|---:|---:|---:|---|---|
| (no paid probes yet) | 0 | 0 | 0% | 0.0000 | no | n/a |

### Historical Rollup

- Historical source report: 2026-04-13T00:47:57.830Z
- Historical attempts: 2
- Historical success rate: 50.0%

| Endpoint | Attempts | Successes | Success Rate | Total Paid USD |
|---|---:|---:|---:|---:|
| Trending Base Coins | 1 | 1 | 100% | 0.0010 |
| DeFi Yield Compare | 1 | 0 | 0% | 0.0000 |
