export interface SentinelPreflightInput {
  targets: string[];
  goal: string;
  budget?: number;
  timeoutMs?: number;
}

export interface SentinelSuccessResult {
  ok: true;
  status: 200;
  providerSelected: string;
  reasonCodes: string[];
  raw: Record<string, unknown>;
}

export interface SentinelDenyResult {
  ok: false;
  deny: true;
  status: 422;
  code: string;
  reasonCodes: string[];
  action?: string;
  raw: Record<string, unknown>;
}

export interface SentinelErrorResult {
  ok: false;
  deny: false;
  status: number;
  error: string;
  raw: Record<string, unknown>;
}

export type SentinelPreflightResult = SentinelSuccessResult | SentinelDenyResult | SentinelErrorResult;

function normalizeReasonCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((code): code is string => typeof code === 'string');
}

export async function runSentinelPreflight(
  baseUrl: string,
  input: SentinelPreflightInput,
): Promise<SentinelPreflightResult> {
  const controller = new AbortController();
  const timeoutMs = input.timeoutMs ?? 12_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/bundles/gtm-copilot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targets: input.targets,
        goal: input.goal,
        ...(typeof input.budget === 'number' ? { budget: input.budget } : {}),
      }),
      signal: controller.signal,
    });

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.status === 200) {
      return {
        ok: true,
        status: 200,
        providerSelected: typeof raw.providerSelected === 'string' ? raw.providerSelected : '',
        reasonCodes: normalizeReasonCodes((raw.scoreSnapshot as Record<string, unknown> | undefined)?.reasonCodes),
        raw,
      };
    }

    if (response.status === 422) {
      return {
        ok: false,
        deny: true,
        status: 422,
        code: typeof raw.code === 'string' ? raw.code : 'POLICY_DENY',
        reasonCodes: normalizeReasonCodes(raw.reasonCodes),
        action: typeof raw.action === 'string' ? raw.action : undefined,
        raw,
      };
    }

    return {
      ok: false,
      deny: false,
      status: response.status,
      error: typeof raw.error === 'string' ? raw.error : `sentinel request failed (${response.status})`,
      raw,
    };
  } catch (error) {
    return {
      ok: false,
      deny: false,
      status: 0,
      error: error instanceof Error ? error.message : 'sentinel request failed',
      raw: {},
    };
  } finally {
    clearTimeout(timer);
  }
}
