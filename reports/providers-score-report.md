# Providers Score Snapshot

Generated: 2026-04-11T14:12:26.466Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 36 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 70 |  | ms |
| Canary | 56 | high-risk | 25 | endpoint | 0 | 200 | 29ms |
| AFK Explore | 55 | high-risk | 25 | endpoint | 0 | 200 | 52ms |
| x402scan Resources | 52 | high-risk | 25 | endpoint | 0 | 200 | 180ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate |
|---|---|---:|---|---:|---:|---:|---|---|---|
| LITCOIN Chat | POST | 81 | strong | 80 | 402 | 65ms | yes | $0.001 USDC | pass |
| LITCOIN Compute | POST | 81 | strong | 80 | 402 | 74ms | yes | $0.001 USDC | pass |
| Trending Base Coins | GET | 81 | strong | 80 | 402 | 65ms | yes | $0.001 USDC | pass |
| Regen Oracle | POST | 81 | strong | 80 | 402 | 63ms | yes | $0.005 USDC | pass |
| DeFi Yield Compare | GET | 80 | strong | 80 | 402 | 81ms | yes | $0.01 USDC | pass |
| x402scan Resources | GET | 80 | strong | 80 | 402 | 115ms | yes | $0.01 USDC | pass |
| x402scan Facilitators | GET | 80 | strong | 80 | 402 | 113ms | yes | $0.01 USDC | pass |
| Bankr x402 Health | POST | 79 | caution | 80 | 402 | 159ms | yes | $0.001 USDC | pass |
| x402scan Merchants | GET | 79 | caution | 80 | 402 | 120ms | yes | $0.01 USDC | pass |
| Bankr x402 Lint | POST | 77 | caution | 80 | 402 | 202ms | yes | $0.01 USDC | pass |
| Giga API | POST | 76 | caution | 80 | 402 | 250ms | yes | $5 USDC | pass |
| dTelecom x402 | POST | 72 | caution | 80 | 402 | 220ms | yes | $0 USDC | fail |
| StableEnrich Apollo People | POST | 71 | caution | 65 | 402 | 261ms | yes | n/a | fail |
| StableEnrich Firecrawl Scrape | POST | 69 | experimental | 65 | 402 | 331ms | yes | n/a | fail |
| StableEnrich Exa Search | POST | 68 | experimental | 65 | 402 | 391ms | yes | n/a | fail |
| StableEmail Send | POST | 68 | experimental | 65 | 402 | 388ms | yes | n/a | fail |
| StableUpload File | POST | 67 | experimental | 65 | 402 | 405ms | yes | n/a | fail |
| StableTravel Search | POST | 67 | experimental | 65 | 402 | 411ms | yes | n/a | fail |
| Base RPC | POST | 47 | high-risk | 65 | 400 | 139ms | no | n/a | fail |
| AgentCash Send | POST | 42 | high-risk | 80 | 500 | 260ms | no | $10000 USDC | fail |

Total payable endpoints scored: 20
Routing candidates passing gates: 11
