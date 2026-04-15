const EPSILON = 1e-9;

function toMoney(value) {
  return Number(Number(value || 0).toFixed(6));
}

function dayKey(isoOrDate, timeZone) {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function parseIso(value, fallback) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d;
}

export function evaluateSoftLaunchSoak({ config, samples, now = new Date().toISOString() }) {
  const nowDate = parseIso(now, new Date());
  const startAt = parseIso(config.startAt, nowDate);
  const durationHours = Number(config.durationHours || 48);
  const endAt = new Date(startAt.getTime() + durationHours * 60 * 60 * 1000);
  const dailyCapUsd = Number(config.budget?.dailyCapUsd || 5);
  const perProbeCapDefault = Number(config.budget?.defaultMaxPaymentUsd || 0.01);
  const tz = config.timezone || 'UTC';

  const inWindowSamples = samples
    .filter((sample) => {
      const ts = parseIso(sample.timestamp, null);
      return ts && ts >= startAt && ts <= nowDate;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const totals = {
    sampleCount: inWindowSamples.length,
    paidProbeAttempts: 0,
    paidProbeSuccesses: 0,
    paidProbeFailures: 0,
    criticalGateBypasses: 0,
    overCapPayments: 0,
    paidAmountUsd: 0,
  };

  const daily = new Map();

  for (const sample of inWindowSamples) {
    totals.paidProbeAttempts += Number(sample.paidProbeAttempts || 0);
    totals.paidProbeSuccesses += Number(sample.paidProbeSuccesses || 0);
    totals.paidProbeFailures += Number(sample.paidProbeFailures || 0);
    totals.criticalGateBypasses += Number(sample.criticalGateBypasses || 0);

    const payments = Array.isArray(sample.payments) ? sample.payments : [];
    for (const payment of payments) {
      const amountUsd = Number(payment.amountUsd || 0);
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) continue;

      const maxPaymentUsd = Number(payment.maxPaymentUsd || sample.maxPaymentUsd || perProbeCapDefault);
      if (amountUsd > maxPaymentUsd + EPSILON) {
        totals.overCapPayments += 1;
      }

      const key = dayKey(sample.timestamp, tz);
      const row = daily.get(key) || { day: key, amountUsd: 0, paymentCount: 0, overBudget: false };
      const nextAmount = row.amountUsd + amountUsd;

      if (nextAmount > dailyCapUsd + EPSILON) {
        totals.overCapPayments += 1;
        row.overBudget = true;
      }

      row.amountUsd = toMoney(nextAmount);
      row.paymentCount += 1;
      daily.set(key, row);
      totals.paidAmountUsd = toMoney(totals.paidAmountUsd + amountUsd);
    }
  }

  const paidProbeSuccessRate =
    totals.paidProbeAttempts > 0 ? totals.paidProbeSuccesses / totals.paidProbeAttempts : 0;

  const bars = {
    paidProbeSuccessRate: {
      actual: Number(paidProbeSuccessRate.toFixed(4)),
      min: Number(config.successBars?.paidProbeSuccessRateMin || 0.95),
      pass: paidProbeSuccessRate >= Number(config.successBars?.paidProbeSuccessRateMin || 0.95),
    },
    criticalGateBypasses: {
      actual: totals.criticalGateBypasses,
      max: Number(config.successBars?.criticalGateBypassesMax || 0),
      pass: totals.criticalGateBypasses <= Number(config.successBars?.criticalGateBypassesMax || 0),
    },
    overCapPayments: {
      actual: totals.overCapPayments,
      max: Number(config.successBars?.overCapPaymentsMax || 0),
      pass: totals.overCapPayments <= Number(config.successBars?.overCapPaymentsMax || 0),
    },
  };

  const phase = nowDate < endAt ? 'in_progress' : 'complete';
  const allBarsPass = bars.paidProbeSuccessRate.pass && bars.criticalGateBypasses.pass && bars.overCapPayments.pass;
  const status = phase === 'complete' ? (allBarsPass ? 'pass' : 'fail') : allBarsPass ? 'on_track' : 'at_risk';

  return {
    launchId: config.launchId || 'soft-launch',
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    now: nowDate.toISOString(),
    phase,
    status,
    allBarsPass,
    totals,
    bars,
    daily: [...daily.values()].sort((a, b) => a.day.localeCompare(b.day)),
  };
}

export function toSoakMarkdown(status, config) {
  return [
    '# 48h Soft-Launch Soak Status',
    '',
    `Launch: ${status.launchId}`,
    `Window: ${status.startAt} -> ${status.endAt}`,
    `Now: ${status.now}`,
    `Phase: ${status.phase}`,
    `Status: ${status.status}`,
    '',
    '## Success Bars',
    '',
    `- Paid probe success rate: ${(status.bars.paidProbeSuccessRate.actual * 100).toFixed(1)}% (min ${(status.bars.paidProbeSuccessRate.min * 100).toFixed(1)}%) => ${status.bars.paidProbeSuccessRate.pass ? 'pass' : 'fail'}`,
    `- Critical gate bypasses: ${status.bars.criticalGateBypasses.actual} (max ${status.bars.criticalGateBypasses.max}) => ${status.bars.criticalGateBypasses.pass ? 'pass' : 'fail'}`,
    `- Over-cap payments: ${status.bars.overCapPayments.actual} (max ${status.bars.overCapPayments.max}) => ${status.bars.overCapPayments.pass ? 'pass' : 'fail'}`,
    '',
    '## Totals',
    '',
    `- Samples: ${status.totals.sampleCount}`,
    `- Paid probe attempts: ${status.totals.paidProbeAttempts}`,
    `- Paid probe successes: ${status.totals.paidProbeSuccesses}`,
    `- Paid probe failures: ${status.totals.paidProbeFailures}`,
    `- Paid USD: $${status.totals.paidAmountUsd.toFixed(4)}`,
    '',
    '## Daily Spend',
    '',
    '| Day | Paid USD | Payments | Over Budget |',
    '|---|---:|---:|---|',
    ...(status.daily.length
      ? status.daily.map((d) => `| ${d.day} | ${d.amountUsd.toFixed(4)} | ${d.paymentCount} | ${d.overBudget ? 'yes' : 'no'} |`)
      : ['| (no paid probes in window) | 0.0000 | 0 | no |']),
    '',
    `Budget cap: $${Number(config.budget?.dailyCapUsd || 5).toFixed(2)}/day (${config.timezone || 'UTC'})`,
    '',
  ].join('\n');
}

export function buildSampleFromProvidersReport(report, fallbackTimestamp = new Date().toISOString()) {
  const timestamp = report.generatedAt || fallbackTimestamp;
  const paymentConfig = report.paymentConfig || {};
  const maxPaymentUsd = Number(paymentConfig.maxPaymentUsd || 0);

  const endpointScores = Array.isArray(report.endpointScores) ? report.endpointScores : [];
  const payments = endpointScores
    .filter((row) => row?.paidProbe?.attempted)
    .map((row) => ({
      endpoint: row.name || row.url,
      method: row.method || 'GET',
      url: row.url,
      amountUsd: Number(row?.paidProbe?.paymentMade?.amountUsd || 0),
      maxPaymentUsd,
    }))
    .filter((payment) => payment.amountUsd > 0);

  const metrics = report.settlementReliabilityMetrics || {};
  const paidProbeAttempts = Number(metrics.paidProbeAttempts || payments.length || 0);
  const paidProbeSuccesses = Number(metrics.paidProbeSuccesses || 0);

  const routingDecision = report.routingDecision || {};
  const fallbackAllowed = routingDecision.allowed && routingDecision.reason === 'fallback-allowed';

  return {
    reportGeneratedAt: report.generatedAt || null,
    timestamp,
    paidProbeAttempts,
    paidProbeSuccesses,
    paidProbeFailures: Number(metrics.paidProbeFailures || Math.max(0, paidProbeAttempts - paidProbeSuccesses)),
    paidProbeBudgetSpent: Number(metrics.paidProbeBudgetSpent || 0),
    maxPaymentUsd,
    criticalGateBypasses: fallbackAllowed ? 1 : 0,
    payments,
  };
}
