import type { GTMCopilotRequest } from '../routes/gtm-copilot.js';
import type { TokenRiskScreenRequest } from '../routes/token-risk-screen.js';

export type BundleId = 'gtm-copilot' | 'token-risk-screen';

export interface ParsedInputSuccess<T> {
  ok: true;
  data: T;
}

export interface ParsedInputFailure {
  ok: false;
  error: string;
}

export type ParsedInput<T> = ParsedInputSuccess<T> | ParsedInputFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseSharedFields(payload: unknown): ParsedInput<GTMCopilotRequest> {
  if (!isRecord(payload)) {
    return { ok: false, error: 'invalid payload: expected JSON object' };
  }

  if (!Array.isArray(payload.targets) || payload.targets.some((target) => typeof target !== 'string')) {
    return { ok: false, error: 'invalid payload: targets[] must be an array of strings' };
  }

  if (typeof payload.goal !== 'string' || payload.goal.trim().length === 0) {
    return { ok: false, error: 'invalid payload: goal (string) is required' };
  }

  if (payload.budget !== undefined && typeof payload.budget !== 'number') {
    return { ok: false, error: 'invalid payload: budget must be a number when provided' };
  }

  return {
    ok: true,
    data: {
      targets: payload.targets,
      goal: payload.goal,
      budget: typeof payload.budget === 'number' ? payload.budget : undefined,
    },
  };
}

export function parseGTMCopilotInput(payload: unknown): ParsedInput<GTMCopilotRequest> {
  return parseSharedFields(payload);
}

function parseTokenInput(token: unknown): { ok: true; data: TokenRiskScreenRequest['tokens'][number] } | ParsedInputFailure {
  if (typeof token === 'string') {
    const normalized = token.trim();
    if (!normalized) {
      return { ok: false, error: 'invalid payload: token string entries must be non-empty' };
    }
    return { ok: true, data: { address: normalized } };
  }

  if (!isRecord(token)) {
    return { ok: false, error: 'invalid payload: each token must be a string or object' };
  }

  if (typeof token.address !== 'string' || token.address.trim().length === 0) {
    return { ok: false, error: 'invalid payload: token.address (string) is required' };
  }

  if (token.symbol !== undefined && typeof token.symbol !== 'string') {
    return { ok: false, error: 'invalid payload: token.symbol must be a string when provided' };
  }

  return {
    ok: true,
    data: {
      address: token.address.trim(),
      symbol: typeof token.symbol === 'string' ? token.symbol.trim() : undefined,
    },
  };
}

export function parseTokenRiskScreenInput(payload: unknown): ParsedInput<TokenRiskScreenRequest> {
  const shared = parseSharedFields(payload);
  if (!shared.ok) return shared;

  if (!isRecord(payload)) {
    return { ok: false, error: 'invalid payload: expected JSON object' };
  }

  if (!Array.isArray(payload.tokens) || payload.tokens.length === 0) {
    return { ok: false, error: 'invalid payload: tokens[] is required for token-risk-screen' };
  }

  if (payload.chainId !== undefined && typeof payload.chainId !== 'string') {
    return { ok: false, error: 'invalid payload: chainId must be a string when provided' };
  }

  const tokens: TokenRiskScreenRequest['tokens'] = [];
  for (const token of payload.tokens) {
    const parsed = parseTokenInput(token);
    if (!parsed.ok) return parsed;
    tokens.push(parsed.data);
  }

  return {
    ok: true,
    data: {
      ...shared.data,
      tokens,
      chainId: typeof payload.chainId === 'string' ? payload.chainId : undefined,
    },
  };
}

export function parseWorkflowBundleId(payload: unknown): BundleId {
  if (!isRecord(payload)) return 'gtm-copilot';

  const raw = payload.bundleId;
  if (raw === 'token-risk-screen' || raw === 'gtm-copilot') return raw;
  return 'gtm-copilot';
}
