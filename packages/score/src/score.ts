import type { CategoryScores, ScoreResult } from './schema.js';
import { evaluateTrustGates } from './gates.js';

function toBand(total: number): ScoreResult['band'] {
  if (total >= 90) return 'trusted';
  if (total >= 80) return 'strong';
  if (total >= 70) return 'caution';
  return 'high-risk';
}

export function scoreProvider(scores: CategoryScores, confidence = 70): ScoreResult {
  const total =
    scores.protocolConformance +
    scores.reliability +
    scores.security +
    scores.economicIntegrity +
    scores.devexDiscovery +
    scores.operationalTransparency;

  return {
    total,
    confidence,
    band: toBand(total),
    gates: evaluateTrustGates(scores),
  };
}
