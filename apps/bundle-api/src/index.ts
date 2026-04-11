import { runGTMCopilotBundle } from './routes/gtm-copilot.js';

const sample = await runGTMCopilotBundle({
  targets: ['sample-target'],
  goal: 'rank leads',
});

console.log('x402-sentinel bundle-api scaffold ready');
console.log(JSON.stringify(sample, null, 2));
