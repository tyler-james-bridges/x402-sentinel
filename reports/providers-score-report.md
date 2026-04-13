# Providers Score Snapshot

Generated: 2026-04-13T00:47:57.828Z
Mode: catalog+payable
Rubric Weights: {"protocolConformance":25,"reliabilityPerformance":25,"securityAbuseResistance":20,"economicIntegrity":15,"devexDiscovery":10,"operationalTransparency":5}
Paid Probe Mode: enabled
Paid Probe Budget Spent: $0.0010

## Provider Pages (catalog/discovery scoring)

| Provider | Score | Band | Confidence | Discovery | Endpoints | Status | Latency |
|---|---:|---|---:|---|---:|---:|---:|
| AFK Explore | 52 | high-risk | 25 | endpoint | 0 | 200 | 193ms |
| StableEnrich | 68 | experimental | 80 | openapi | 31 |  | ms |
| StableSocial | 68 | experimental | 80 | openapi | 36 |  | ms |
| StableEmail | 68 | experimental | 80 | openapi | 24 |  | ms |
| StableUpload | 68 | experimental | 80 | openapi | 8 |  | ms |
| StableTravel | 68 | experimental | 80 | openapi | 70 |  | ms |
| Canary | 55 | high-risk | 25 | endpoint | 0 | 200 | 53ms |
| x402scan Resources | 52 | high-risk | 25 | endpoint | 0 | 200 | 165ms |

## Payable Endpoint Probes (routing candidates)

| Endpoint | Method | Score | Band | Confidence | Status | Latency | x402-like | Price | Econ Gate | Challenge Evidence | Settlement Evidence |
|---|---|---:|---|---:|---:|---:|---|---|---|---|---|
| Trending Base Coins | GET | 80 | strong | 95 | 402 | 99ms | yes | $0.001 USDC | pass | yes | yes |
| LITCOIN Compute | POST | 79 | caution | 95 | 402 | 158ms | yes | $0.001 USDC | pass | yes | no |
| DeFi Yield Compare | GET | 79 | caution | 95 | 402 | 120ms | yes | $0.01 USDC | pass | yes | no |
| Regen Oracle | POST | 79 | caution | 95 | 402 | 140ms | yes | $0.005 USDC | pass | yes | no |
| x402scan Merchants | GET | 79 | caution | 95 | 402 | 128ms | yes | $0.01 USDC | pass | yes | no |
| x402scan Resources | GET | 79 | caution | 95 | 402 | 131ms | yes | $0.01 USDC | pass | yes | no |
| x402scan Facilitators | GET | 79 | caution | 95 | 402 | 130ms | yes | $0.01 USDC | pass | yes | no |
| LITCOIN Chat | POST | 78 | caution | 95 | 402 | 162ms | yes | $0.001 USDC | pass | yes | no |
| Bankr x402 Health | POST | 77 | caution | 95 | 402 | 219ms | yes | $0.001 USDC | pass | yes | no |
| Bankr x402 Lint | POST | 76 | caution | 95 | 402 | 264ms | yes | $0.01 USDC | pass | yes | no |
| Giga API | POST | 75 | caution | 95 | 402 | 297ms | yes | $5 USDC | pass | yes | no |
| StableEnrich Exa Search | POST | 71 | caution | 80 | 402 | 263ms | yes | n/a | fail | yes | no |
| StableTravel Search | POST | 71 | caution | 80 | 402 | 258ms | yes | n/a | fail | yes | no |
| dTelecom x402 | POST | 71 | caution | 95 | 402 | 267ms | yes | $0 USDC | fail | yes | no |
| StableEnrich Firecrawl Scrape | POST | 70 | caution | 80 | 402 | 314ms | yes | n/a | fail | yes | no |
| StableEnrich Apollo People | POST | 69 | experimental | 80 | 402 | 334ms | yes | n/a | fail | yes | no |
| StableEmail Send | POST | 69 | experimental | 80 | 402 | 355ms | yes | n/a | fail | yes | no |
| StableUpload File | POST | 63 | experimental | 80 | 402 | 588ms | yes | n/a | fail | yes | no |
| AgentCash Send | POST | 45 | high-risk | 80 | 500 | 236ms | no | n/a | fail | no | no |
| Base RPC | POST | 45 | high-risk | 65 | 400 | 200ms | no | n/a | fail | no | no |

Total payable endpoints scored: 20
Routing candidates passing gates: 11
Routing decision: allow (at-least-one-provider-passed)

## Settlement Reliability (paid probes)

| Endpoint | Attempts | Successes | Success Rate | Paid USD | Last Error |
|---|---:|---:|---:|---:|---|
| Trending Base Coins | 1 | 1 | 100% | 0.0010 | no |
| DeFi Yield Compare | 1 | 0 | 0% | 0.0000 | yes |
