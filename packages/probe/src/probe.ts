import type { DiscoveryResult } from './types.js';

export interface ProbeFinding {
  id: string;
  severity: 'error' | 'warn' | 'info';
  passed: boolean;
  message: string;
}

export async function runProbe(_discovery: DiscoveryResult): Promise<ProbeFinding[]> {
  return [
    {
      id: 'probe.stub',
      severity: 'info',
      passed: true,
      message: 'Probe runner scaffold is active',
    },
  ];
}
