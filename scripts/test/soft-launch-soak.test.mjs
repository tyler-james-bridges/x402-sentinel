import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSampleFromProvidersReport, evaluateSoftLaunchSoak } from '../lib/soft-launch-soak.mjs';

const baseConfig = {
  launchId: 'soft-launch-test',
  startAt: '2026-04-14T00:00:00.000Z',
  durationHours: 48,
  timezone: 'America/Phoenix',
  budget: {
    dailyCapUsd: 5,
    defaultMaxPaymentUsd: 0.01,
  },
  successBars: {
    paidProbeSuccessRateMin: 0.95,
    criticalGateBypassesMax: 0,
    overCapPaymentsMax: 0,
  },
};

test('evaluateSoftLaunchSoak passes when all bars are green', () => {
  const samples = [
    {
      timestamp: '2026-04-14T01:00:00.000Z',
      paidProbeAttempts: 20,
      paidProbeSuccesses: 19,
      paidProbeFailures: 1,
      criticalGateBypasses: 0,
      payments: Array.from({ length: 20 }, () => ({ amountUsd: 0.01, maxPaymentUsd: 0.01 })),
    },
  ];

  const status = evaluateSoftLaunchSoak({
    config: baseConfig,
    samples,
    now: '2026-04-14T12:00:00.000Z',
  });

  assert.equal(status.status, 'on_track');
  assert.equal(status.bars.paidProbeSuccessRate.pass, true);
  assert.equal(status.bars.criticalGateBypasses.pass, true);
  assert.equal(status.bars.overCapPayments.pass, true);
});

test('evaluateSoftLaunchSoak flags over-cap daily spend and gate bypass', () => {
  const samples = [
    {
      timestamp: '2026-04-14T03:00:00.000Z',
      paidProbeAttempts: 2,
      paidProbeSuccesses: 2,
      paidProbeFailures: 0,
      criticalGateBypasses: 1,
      payments: [
        { amountUsd: 4.5, maxPaymentUsd: 5 },
        { amountUsd: 1, maxPaymentUsd: 5 },
      ],
    },
  ];

  const status = evaluateSoftLaunchSoak({
    config: baseConfig,
    samples,
    now: '2026-04-14T10:00:00.000Z',
  });

  assert.equal(status.bars.criticalGateBypasses.pass, false);
  assert.equal(status.bars.overCapPayments.pass, false);
  assert.equal(status.totals.overCapPayments, 1);
  assert.equal(status.status, 'at_risk');
});

test('buildSampleFromProvidersReport extracts paid probes and fallback bypass', () => {
  const report = {
    generatedAt: '2026-04-14T05:00:00.000Z',
    paymentConfig: { maxPaymentUsd: 0.01 },
    endpointScores: [
      {
        name: 'test-endpoint',
        url: 'https://example.com',
        method: 'GET',
        paidProbe: {
          attempted: true,
          paymentMade: { amountUsd: 0.009 },
        },
      },
    ],
    settlementReliabilityMetrics: {
      paidProbeAttempts: 1,
      paidProbeSuccesses: 1,
      paidProbeFailures: 0,
      paidProbeBudgetSpent: 0.009,
    },
    routingDecision: {
      allowed: true,
      reason: 'fallback-allowed',
    },
  };

  const sample = buildSampleFromProvidersReport(report);
  assert.equal(sample.payments.length, 1);
  assert.equal(sample.criticalGateBypasses, 1);
  assert.equal(sample.maxPaymentUsd, 0.01);
});
