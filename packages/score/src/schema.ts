export interface CategoryScores {
  protocolConformance: number; // /25
  reliability: number; // /25
  security: number; // /20
  economicIntegrity: number; // /15
  devexDiscovery: number; // /10
  operationalTransparency: number; // /5
}

export interface TrustGates {
  protocolPass: boolean;
  reliabilityPass: boolean;
  securityPass: boolean;
  economicCriticalPass: boolean;
}

export interface ScoreResult {
  total: number;
  confidence: number;
  band: 'trusted' | 'strong' | 'caution' | 'high-risk';
  gates: TrustGates;
}
