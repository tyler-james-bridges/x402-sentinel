import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  buildSampleFromProvidersReport,
  evaluateSoftLaunchSoak,
  toSoakMarkdown,
} from './lib/soft-launch-soak.mjs';

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);

function getArgValue(flag, fallback = null) {
  const idx = rawArgs.indexOf(flag);
  if (idx >= 0 && rawArgs[idx + 1]) return rawArgs[idx + 1];
  return fallback;
}

const CONFIG_URL = new URL('../config/soft-launch-soak.json', import.meta.url);
const REPORT_PATH = getArgValue('--report', 'reports/providers-score-report.json');
const SAMPLES_PATH = getArgValue('--samples', 'reports/soak/soft-launch-samples.ndjson');
const STATUS_JSON_PATH = getArgValue('--status-json', 'reports/soak/soft-launch-status.json');
const STATUS_MD_PATH = getArgValue('--status-md', 'reports/soak/soft-launch-status.md');

function parseNdjson(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function readJson(url) {
  const raw = await readFile(url, 'utf8');
  return JSON.parse(raw);
}

async function safeReadNdjson(url) {
  try {
    const raw = await readFile(url, 'utf8');
    return parseNdjson(raw);
  } catch {
    return [];
  }
}

function forwardReportArgs() {
  const passthroughFlags = [
    '--with-payment',
    '--strict-payable',
    '--deny-insufficient-evidence',
    '--max-payment',
    '--payment-limit',
  ];

  const forwarded = [];
  for (const flag of passthroughFlags) {
    if (args.has(flag)) {
      forwarded.push(flag);
      const value = getArgValue(flag);
      if (value && !value.startsWith('--')) {
        forwarded.push(value);
      }
    }
  }

  return forwarded;
}

function spentToday(samples, timeZone, nowIso) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(nowIso));

  return samples.reduce((sum, sample) => {
    const sampleDay = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(sample.timestamp));

    if (sampleDay !== day) return sum;
    const payments = Array.isArray(sample.payments) ? sample.payments : [];
    return (
      sum +
      payments.reduce((inner, payment) => inner + Number(payment.amountUsd || 0), 0)
    );
  }, 0);
}

async function main() {
  const nowIso = getArgValue('--now', new Date().toISOString());
  const config = await readJson(CONFIG_URL);

  const samplesUrl = new URL(`../${SAMPLES_PATH}`, import.meta.url);
  const existingSamples = await safeReadNdjson(samplesUrl);

  if (args.has('--run-report')) {
    const maxPaymentUsd = Number(
      getArgValue('--max-payment', String(config.budget?.defaultMaxPaymentUsd || 0.01)),
    );
    const paymentLimit = Number(
      getArgValue('--payment-limit', String(config.budget?.defaultPaymentLimit || 3)),
    );

    const dailyCapUsd = Number(config.budget?.dailyCapUsd || 5);
    const todaySpend = spentToday(existingSamples, config.timezone || 'UTC', nowIso);
    const maxProjectedSpend = todaySpend + maxPaymentUsd * paymentLimit;

    if (maxProjectedSpend > dailyCapUsd && !args.has('--allow-over-cap')) {
      throw new Error(
        `refusing paid report: projected daily spend $${maxProjectedSpend.toFixed(4)} exceeds cap $${dailyCapUsd.toFixed(4)}. use --allow-over-cap to override`,
      );
    }

    execFileSync(
      'node',
      ['scripts/generate-providers-report.mjs', ...forwardReportArgs()],
      {
        stdio: 'inherit',
      },
    );
  }

  const providersReportUrl = new URL(`../${REPORT_PATH}`, import.meta.url);
  const report = await readJson(providersReportUrl);
  const sample = buildSampleFromProvidersReport(report, nowIso);

  const byKey = new Map(
    existingSamples
      .filter((row) => row && typeof row === 'object')
      .map((row) => [row.reportGeneratedAt || row.timestamp, row]),
  );
  byKey.set(sample.reportGeneratedAt || sample.timestamp, sample);

  const mergedSamples = [...byKey.values()].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const status = evaluateSoftLaunchSoak({ config, samples: mergedSamples, now: nowIso });

  const ndjson = mergedSamples.map((row) => JSON.stringify(row)).join('\n') + '\n';
  const statusMarkdown = toSoakMarkdown(status, config);

  await mkdir(new URL('../reports/soak/', import.meta.url), { recursive: true });
  await writeFile(samplesUrl, ndjson);
  await writeFile(new URL(`../${STATUS_JSON_PATH}`, import.meta.url), JSON.stringify(status, null, 2));
  await writeFile(new URL(`../${STATUS_MD_PATH}`, import.meta.url), statusMarkdown);

  console.log(`wrote ${SAMPLES_PATH}`);
  console.log(`wrote ${STATUS_JSON_PATH}`);
  console.log(`wrote ${STATUS_MD_PATH}`);
  console.log(`soak status: ${status.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
