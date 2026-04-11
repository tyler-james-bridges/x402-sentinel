import type { CategoryScores, TrustGates } from './schema.js';

export function evaluateTrustGates(scores: CategoryScores): TrustGates {
  return {
    protocolPass: scores.protocolConformance >= 20,
    reliabilityPass: scores.reliability >= 18,
    securityPass: scores.security >= 14,
    economicCriticalPass: scores.economicIntegrity >= 10,
  };
}
