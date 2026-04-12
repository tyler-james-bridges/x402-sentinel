# Providers Score Snapshot

Generated: 2026-04-12T13:22:09.068Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}
Paid Probe Mode: enabled
Paid Probe Budget Spent: $0.0010

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| AFK Explore | 52 | high-risk | 25 | endpoint | 0 | 200 | 183ms |
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 36 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 71 |  | ms |
| Canary | 55 | high-risk | 25 | endpoint | 0 | 200 | 46ms |
| x402scan Resources | 52 | high-risk | 25 | endpoint | 0 | 200 | 190ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence |
|---|---|---:|---|---:|---:|---:|---|---|---|---|---|
| LITCOIN Chat | POST | 81 | strong | 95 | 402 | 76ms | yes | $0.001 USDC | pass | yes | no |
| LITCOIN Compute | POST | 81 | strong | 95 | 402 | 64ms | yes | $0.001 USDC | pass | yes | no |
| DeFi Yield Compare | GET | 81 | strong | 95 | 402 | 73ms | yes | $0.01 USDC | pass | yes | no |
| Trending Base Coins | GET | 81 | strong | 95 | 402 | 66ms | yes | $0.001 USDC | pass | yes | yes |
| Regen Oracle | POST | 81 | strong | 95 | 402 | 65ms | yes | $0.005 USDC | pass | yes | no |
| x402scan Facilitators | GET | 80 | strong | 95 | 402 | 119ms | yes | $0.01 USDC | pass | yes | no |
| x402scan Merchants | GET | 79 | caution | 95 | 402 | 127ms | yes | $0.01 USDC | pass | yes | no |
| x402scan Resources | GET | 79 | caution | 95 | 402 | 133ms | yes | $0.01 USDC | pass | yes | no |
| Bankr x402 Health | POST | 78 | caution | 95 | 402 | 162ms | yes | $0.001 USDC | pass | yes | no |
| Giga API | POST | 76 | caution | 95 | 402 | 245ms | yes | $5 USDC | pass | yes | no |
| dTelecom x402 | POST | 72 | caution | 95 | 402 | 224ms | yes | $0 USDC | fail | yes | no |
| StableEnrich Exa Search | POST | 71 | caution | 80 | 402 | 266ms | yes | n/a | fail | yes | no |
| StableEnrich Apollo People | POST | 71 | caution | 80 | 402 | 272ms | yes | n/a | fail | yes | no |
| Bankr x402 Lint | POST | 71 | caution | 95 | 402 | 469ms | yes | $0.01 USDC | pass | yes | no |
| StableEnrich Firecrawl Scrape | POST | 69 | experimental | 80 | 402 | 325ms | yes | n/a | fail | yes | no |
| StableEmail Send | POST | 68 | experimental | 80 | 402 | 385ms | yes | n/a | fail | yes | no |
| StableTravel Search | POST | 68 | experimental | 80 | 402 | 397ms | yes | n/a | fail | yes | no |
| StableUpload File | POST | 67 | experimental | 80 | 402 | 431ms | yes | n/a | fail | yes | no |
| AgentCash Send | POST | 63 | experimental | 95 | 402 | 493ms | yes | $10000 USDC | fail | yes | no |
| Base RPC | POST | 46 | high-risk | 65 | 400 | 181ms | no | n/a | fail | no | no |

Total payable endpoints scored: 20
Routing candidates passing gates: 10
Routing decision: allow (at-least-one-provider-passed)
