# Providers Score Snapshot

Generated: 2026-04-11T13:24:25.450Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| StableEnrich | 68 | experimental | 71 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 71 | openapi | 36 |  | ms |
| StableEmail | 68 | experimental | 71 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 71 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 71 | openapi | 70 |  | ms |
| Canary | 56 | high-risk | 25 | endpoint | 0 | 200 | 31ms |
| AFK Explore | 51 | high-risk | 25 | endpoint | 0 | 200 | 202ms |
| x402scan Resources | 46 | high-risk | 25 | endpoint | 0 | 200 | 410ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price |
|---|---|---:|---|---:|---:|---:|---|---|
| LITCOIN Chat | POST | 81 | strong | 83 | 402 | 67ms | yes | $0.001 USDC |
| LITCOIN Compute | POST | 81 | strong | 83 | 402 | 79ms | yes | $0.001 USDC |
| DeFi Yield Compare | GET | 80 | strong | 83 | 402 | 80ms | yes | $0.01 USDC |
| Trending Base Coins | GET | 80 | strong | 83 | 402 | 80ms | yes | $0.001 USDC |
| Regen Oracle | POST | 80 | strong | 83 | 402 | 80ms | yes | $0.005 USDC |
| Bankr x402 Health | POST | 79 | caution | 83 | 402 | 154ms | yes | $0.001 USDC |
| x402scan Merchants | GET | 79 | caution | 83 | 402 | 137ms | yes | $0.01 USDC |
| x402scan Resources | GET | 79 | caution | 83 | 402 | 128ms | yes | $0.01 USDC |
| x402scan Facilitators | GET | 79 | caution | 83 | 402 | 128ms | yes | $0.01 USDC |
| Bankr x402 Lint | POST | 77 | caution | 83 | 402 | 214ms | yes | $0.01 USDC |
| Giga API | POST | 76 | caution | 83 | 402 | 257ms | yes | $5 USDC |
| StableEnrich Apollo People | POST | 73 | caution | 71 | 402 | 259ms | yes | n/a |
| StableUpload File | POST | 73 | caution | 71 | 402 | 273ms | yes | n/a |
| StableTravel Search | POST | 73 | caution | 71 | 402 | 271ms | yes | n/a |
| StableEnrich Exa Search | POST | 72 | caution | 71 | 402 | 318ms | yes | n/a |
| dTelecom x402 | POST | 72 | caution | 83 | 402 | 220ms | yes | $0 USDC |
| StableEnrich Firecrawl Scrape | POST | 71 | caution | 71 | 402 | 331ms | yes | n/a |
| StableEmail Send | POST | 71 | caution | 71 | 402 | 328ms | yes | n/a |
| AgentCash Send | POST | 61 | experimental | 83 | 402 | 572ms | yes | $10000 USDC |
| Base RPC | POST | 49 | high-risk | 59 | 400 | 139ms | no | n/a |

Total payable endpoints scored: 20
Routing candidates passing gates: 11
