# Providers Score Snapshot

Generated: 2026-04-11T14:31:03.297Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 37 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 72 |  | ms |
| Canary | 56 | high-risk | 25 | endpoint | 0 | 200 | 29ms |
| AFK Explore | 55 | high-risk | 25 | endpoint | 0 | 200 | 40ms |
| x402scan Resources | 52 | high-risk | 25 | endpoint | 0 | 200 | 160ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence |
|---|---|---:|---|---:|---:|---:|---|---|---|---|
| LITCOIN Chat | POST | 81 | strong | 95 | 402 | 76ms | yes | $0.001 USDC | pass | yes |
| DeFi Yield Compare | GET | 81 | strong | 95 | 402 | 64ms | yes | $0.01 USDC | pass | yes |
| Trending Base Coins | GET | 81 | strong | 95 | 402 | 75ms | yes | $0.001 USDC | pass | yes |
| Regen Oracle | POST | 81 | strong | 95 | 402 | 61ms | yes | $0.005 USDC | pass | yes |
| LITCOIN Compute | POST | 80 | strong | 95 | 402 | 80ms | yes | $0.001 USDC | pass | yes |
| Bankr x402 Health | POST | 79 | caution | 95 | 402 | 159ms | yes | $0.001 USDC | pass | yes |
| x402scan Resources | GET | 79 | caution | 95 | 402 | 154ms | yes | $0.01 USDC | pass | yes |
| x402scan Facilitators | GET | 79 | caution | 95 | 402 | 136ms | yes | $0.01 USDC | pass | yes |
| Bankr x402 Lint | POST | 78 | caution | 95 | 402 | 180ms | yes | $0.01 USDC | pass | yes |
| Giga API | POST | 75 | caution | 95 | 402 | 300ms | yes | $5 USDC | pass | yes |
| StableEnrich Exa Search | POST | 71 | caution | 80 | 402 | 259ms | yes | n/a | fail | yes |
| StableEnrich Apollo People | POST | 71 | caution | 80 | 402 | 256ms | yes | n/a | fail | yes |
| StableEnrich Firecrawl Scrape | POST | 70 | caution | 80 | 402 | 311ms | yes | n/a | fail | yes |
| dTelecom x402 | POST | 69 | experimental | 95 | 402 | 322ms | yes | $0 USDC | fail | yes |
| StableEmail Send | POST | 68 | experimental | 80 | 402 | 390ms | yes | n/a | fail | yes |
| StableTravel Search | POST | 68 | experimental | 80 | 402 | 383ms | yes | n/a | fail | yes |
| x402scan Merchants | GET | 68 | experimental | 95 | 402 | 584ms | yes | $0.01 USDC | pass | yes |
| StableUpload File | POST | 67 | experimental | 80 | 402 | 400ms | yes | n/a | fail | yes |
| AgentCash Send | POST | 63 | experimental | 95 | 402 | 499ms | yes | $10000 USDC | fail | yes |
| Base RPC | POST | 46 | high-risk | 65 | 400 | 179ms | no | n/a | fail | no |

Total payable endpoints scored: 20
Routing candidates passing gates: 10
Routing decision: allow (at-least-one-provider-passed)
