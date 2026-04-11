# Providers Score Snapshot

Generated: 2026-04-11T22:13:42.399Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}
Paid Probe Mode: enabled
Paid Probe Budget Spent: $0.0010

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| AFK Explore | 56 | high-risk | 25 | endpoint | 0 | 200 | 33ms |
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 37 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 70 |  | ms |
| Canary | 56 | high-risk | 25 | endpoint | 0 | 200 | 28ms |
| x402scan Resources | 53 | high-risk | 25 | endpoint | 0 | 200 | 146ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence |
|---|---|---:|---|---:|---:|---:|---|---|---|---|---|
| DeFi Yield Compare | GET | 81 | strong | 95 | 402 | 61ms | yes | $0.01 USDC | pass | yes | no |
| LITCOIN Chat | POST | 80 | strong | 95 | 402 | 100ms | yes | $0.001 USDC | pass | yes | no |
| LITCOIN Compute | POST | 80 | strong | 95 | 402 | 80ms | yes | $0.001 USDC | pass | yes | no |
| Trending Base Coins | GET | 80 | strong | 95 | 402 | 81ms | yes | $0.001 USDC | pass | yes | yes |
| Regen Oracle | POST | 80 | strong | 95 | 402 | 80ms | yes | $0.005 USDC | pass | yes | no |
| x402scan Merchants | GET | 79 | caution | 95 | 402 | 125ms | yes | $0.01 USDC | pass | yes | no |
| x402scan Resources | GET | 79 | caution | 95 | 402 | 124ms | yes | $0.01 USDC | pass | yes | no |
| x402scan Facilitators | GET | 79 | caution | 95 | 402 | 128ms | yes | $0.01 USDC | pass | yes | no |
| Bankr x402 Health | POST | 78 | caution | 95 | 402 | 180ms | yes | $0.001 USDC | pass | yes | no |
| Giga API | POST | 78 | caution | 95 | 402 | 192ms | yes | $5 USDC | pass | yes | no |
| Bankr x402 Lint | POST | 77 | caution | 95 | 402 | 230ms | yes | $0.01 USDC | pass | yes | no |
| dTelecom x402 | POST | 73 | caution | 95 | 402 | 194ms | yes | $0 USDC | fail | yes | no |
| StableEnrich Exa Search | POST | 71 | caution | 80 | 402 | 264ms | yes | n/a | fail | yes | no |
| StableEnrich Apollo People | POST | 71 | caution | 80 | 402 | 261ms | yes | n/a | fail | yes | no |
| StableEnrich Firecrawl Scrape | POST | 69 | experimental | 80 | 402 | 326ms | yes | n/a | fail | yes | no |
| StableEmail Send | POST | 68 | experimental | 80 | 402 | 375ms | yes | n/a | fail | yes | no |
| StableTravel Search | POST | 68 | experimental | 80 | 402 | 385ms | yes | n/a | fail | yes | no |
| StableUpload File | POST | 66 | experimental | 80 | 402 | 453ms | yes | n/a | fail | yes | no |
| AgentCash Send | POST | 65 | experimental | 95 | 402 | 437ms | yes | $10000 USDC | fail | yes | no |
| Base RPC | POST | 47 | high-risk | 65 | 400 | 132ms | no | n/a | fail | no | no |

Total payable endpoints scored: 20
Routing candidates passing gates: 11
Routing decision: allow (at-least-one-provider-passed)
