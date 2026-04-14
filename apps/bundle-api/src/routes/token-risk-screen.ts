import type { ProviderScore, GTMCopilotRequest } from './gtm-copilot.js';
import { runGTMCopilotBundle } from './gtm-copilot.js';

export interface TokenRiskScreenTokenInput {
  address: string;
  symbol?: string;
}

export interface TokenRiskScreenRequest extends GTMCopilotRequest {
  tokens: TokenRiskScreenTokenInput[];
  chainId?: string;
}

type TokenRiskBand = 'low' | 'moderate' | 'high' | 'critical';

interface TokenRiskFinding {
  address: string;
  symbol: string | null;
  chainId: string | null;
  riskScore: number;
  riskBand: TokenRiskBand;
  flags: string[];
  recommendation: 'allow' | 'review' | 'block';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function inferRiskBand(score: number): TokenRiskBand {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 45) return 'moderate';
  return 'low';
}

function inferRecommendation(band: TokenRiskBand): TokenRiskFinding['recommendation'] {
  if (band === 'critical') return 'block';
  if (band === 'high') return 'review';
  if (band === 'moderate') return 'review';
  return 'allow';
}

function isHexAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function scoreTokenRisk(token: TokenRiskScreenTokenInput, chainId: string | undefined, selected: ProviderScore | null): TokenRiskFinding {
  const normalizedAddress = token.address.trim();
  const normalizedSymbol = token.symbol?.trim() || null;
  const lowerAddress = normalizedAddress.toLowerCase();
  const lowerSymbol = normalizedSymbol?.toLowerCase() ?? '';

  const flags: string[] = [];
  let score = 20;

  if (!isHexAddress(normalizedAddress)) {
    score += 30;
    flags.push('non_evm_address_format');
  }

  if (
    lowerAddress.includes('dead') ||
    lowerAddress.includes('beef') ||
    lowerSymbol.includes('dead') ||
    lowerSymbol.includes('beef')
  ) {
    score += 25;
    flags.push('suspicious_address_pattern');
  }

  if (['rug', 'scam', 'honeypot', 'drain'].some((needle) => lowerAddress.includes(needle) || lowerSymbol.includes(needle))) {
    score += 45;
    flags.push('known_scam_keyword');
  }

  if (selected?.evidence.settlementEvidence === false) {
    score += 10;
    flags.push('provider_missing_settlement_evidence');
  }

  if ((selected?.settlementReliability ?? 100) < 70) {
    score += 10;
    flags.push('provider_settlement_below_threshold');
  }

  if (!normalizedSymbol) {
    score += 5;
    flags.push('symbol_missing');
  }

  const riskScore = clamp(score, 0, 100);
  const riskBand = inferRiskBand(riskScore);

  return {
    address: normalizedAddress,
    symbol: normalizedSymbol,
    chainId: chainId ?? null,
    riskScore,
    riskBand,
    flags,
    recommendation: inferRecommendation(riskBand),
  };
}

function summarizeTokenRisk(findings: TokenRiskFinding[]) {
  const byBand: Record<TokenRiskBand, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };

  for (const finding of findings) {
    byBand[finding.riskBand] += 1;
  }

  return {
    screenedCount: findings.length,
    byBand,
    blockedCount: findings.filter((finding) => finding.recommendation === 'block').length,
    reviewCount: findings.filter((finding) => finding.recommendation === 'review').length,
    allowCount: findings.filter((finding) => finding.recommendation === 'allow').length,
  };
}

export async function runTokenRiskScreenBundle(input: TokenRiskScreenRequest): Promise<Record<string, unknown>> {
  const base = await runGTMCopilotBundle({
    targets: input.targets,
    goal: input.goal,
    budget: input.budget,
  });

  const selectedProvider = (base.scoreSnapshot?.selected ?? null) as ProviderScore | null;
  const findings = input.tokens.map((token) => scoreTokenRisk(token, input.chainId, selectedProvider));
  const summary = summarizeTokenRisk(findings);

  const actions = findings.map((finding, index) => ({
    id: `risk_action_${index + 1}`,
    tokenAddress: finding.address,
    symbol: finding.symbol,
    riskBand: finding.riskBand,
    riskScore: finding.riskScore,
    recommendation: finding.recommendation,
    flags: finding.flags,
    provider: selectedProvider?.url ?? 'none',
    status: finding.recommendation === 'allow' ? 'passed' : 'queued-review',
  }));

  return {
    ...base,
    bundleArtifact: {
      ...base.bundleArtifact,
      workflow: 'token-risk-screen',
      tokenRiskSummary: summary,
      tokenRiskFindings: findings,
      actions,
      summary: `Screened ${summary.screenedCount} tokens; ${summary.blockedCount} critical, ${summary.reviewCount} review-required, ${summary.allowCount} allow.`,
    },
    input,
  };
}
