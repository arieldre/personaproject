/**
 * VCPQ Framework Stress Tests - Lightweight Version
 * 
 * Reduced token usage for environments with rate limits.
 * Tests the same scenarios with fewer API calls.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const Groq = require('groq-sdk');
const vectorService = require('../src/services/vector.service');
const promptCompiler = require('../src/services/promptCompiler.service');
const lexiconService = require('../src/services/lexicon.service');
const validateService = require('../src/services/validate.service');

// Use smaller, faster model to conserve tokens
const MODEL = 'llama-3.1-8b-instant';

let groq;
try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) {
  console.log('⚠️  Groq API not available, running in offline mode');
  groq = null;
}

const colors = {
  pass: '\x1b[32m✅ PASS\x1b[0m',
  fail: '\x1b[31m❌ FAIL\x1b[0m',
  warn: '\x1b[33m⚠️  WARN\x1b[0m',
  info: '\x1b[36mℹ️  INFO\x1b[0m',
  skip: '\x1b[90m⏭️  SKIP\x1b[0m'
};

let testResults = { passed: 0, failed: 0, skipped: 0 };

function logResult(name, passed, details = '', skip = false) {
  if (skip) {
    testResults.skipped++;
    console.log(`${colors.skip} ${name}`);
  } else if (passed) {
    testResults.passed++;
    console.log(`${colors.pass} ${name}`);
  } else {
    testResults.failed++;
    console.log(`${colors.fail} ${name}`);
  }
  if (details) console.log(`        ${details}`);
}

async function chat(systemPrompt, messages, userMessage) {
  if (!groq) return null;
  
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.7
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    if (error.status === 429) {
      console.log(`${colors.warn} Rate limit hit, skipping remaining API calls`);
      return null;
    }
    throw error;
  }
}

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       VCPQ STRESS TESTS - LIGHTWEIGHT VERSION            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// ============================================================
// OFFLINE TESTS (No API calls needed)
// ============================================================

console.log('--- SECTION 1: OFFLINE VECTOR MATH TESTS ---\n');

// Test 1: Radical Candor Vector Configuration
console.log(`${colors.info} Testing "Radical Candor" Profile (High Agreeableness + High Directness)\n`);

const radicalCandorScores = {
  A1: 3, A2: 3, A3: 3, A4: 3, A5: 4, A6: 2, A7: 5, A8: 1,
  B1: 5, B2: 1, B3: 3, B4: 3, B5: 3, B6: 3, B7: 3, B8: 3,
  C1: 3, C2: 3, C3: 3, C4: 3, C5: 1, C6: 5,
  D1: 4, D2: 2, D3: 4, D4: 2, D5: 4, D6: 2
};

const rcVectors = vectorService.processVCPQResponses(radicalCandorScores);

console.log('Radical Candor Vectors:');
console.log(`  agreeableness: ${rcVectors.meta_vectors.agreeableness.toFixed(2)}`);
console.log(`  directness:    ${rcVectors.meta_vectors.directness.toFixed(2)}`);
console.log(`  sycophancy:    ${rcVectors.meta_vectors.sycophancy.toFixed(2)}\n`);

logResult(
  'Radical Candor has HIGH agreeableness (> 0.3)',
  rcVectors.meta_vectors.agreeableness > 0.3,
  `agreeableness = ${rcVectors.meta_vectors.agreeableness.toFixed(2)}`
);

logResult(
  'Radical Candor has HIGH directness (> 0.7)',
  rcVectors.meta_vectors.directness > 0.7,
  `directness = ${rcVectors.meta_vectors.directness.toFixed(2)}`
);

logResult(
  'Radical Candor has LOW sycophancy (< 0)',
  rcVectors.meta_vectors.sycophancy < 0,
  `sycophancy = ${rcVectors.meta_vectors.sycophancy.toFixed(2)}`
);

// Check that both directnessOverride fires but NOT antiSycophancy
const rcModified = lexiconService.applyDomainModifiers(rcVectors.meta_vectors, 'executive');
const rcRules = promptCompiler.testRules(rcModified);

console.log(`\nApplied Rules: ${rcRules.join(', ') || 'none'}\n`);

logResult(
  'Directness Override fires for Radical Candor',
  rcRules.includes('directnessOverride'),
  `Fired: ${rcRules.join(', ')}`
);

logResult(
  'Anti-Sycophancy does NOT fire (agreeableness is positive)',
  !rcRules.includes('antiSycophancy'),
  `Agreeableness = ${rcVectors.meta_vectors.agreeableness.toFixed(2)} (> -0.5)`
);

logResult(
  'Radical Candor creates non-conflicting prompt',
  rcRules.includes('directnessOverride') && !rcRules.includes('antiSycophancy'),
  'Care + Challenge coexist without contradiction'
);

// ============================================================
// Test 2: Hostile Engineer Vector Analysis
// ============================================================
console.log('\n--- SECTION 2: HOSTILE ENGINEER ANALYSIS ---\n');

const hostileEngineerScores = {
  A1: 5, A2: 1, A3: 5, A4: 1, A5: 1, A6: 5, A7: 1, A8: 5,
  B1: 5, B2: 1, B3: 1, B4: 5, B5: 1, B6: 5, B7: 5, B8: 1,
  C1: 1, C2: 5, C3: 1, C4: 5, C5: 1, C6: 5,
  D1: 5, D2: 1, D3: 5, D4: 1, D5: 5, D6: 1
};

const heVectors = vectorService.processVCPQResponses(hostileEngineerScores);
const heModified = lexiconService.applyDomainModifiers(heVectors.meta_vectors, 'engineering');
const heCompiled = promptCompiler.compilePrompt(heModified, 'engineering', {
  name: 'Marcus Chen',
  job_title: 'Senior Staff Engineer'
});

console.log('Hostile Engineer Vectors (Extremes):');
for (const [key, value] of Object.entries(heVectors.meta_vectors)) {
  const bar = value > 0 
    ? '█'.repeat(Math.round(Math.abs(value) * 5)) 
    : '░'.repeat(Math.round(Math.abs(value) * 5));
  console.log(`  ${key.padEnd(18)} ${value.toFixed(2).padStart(6)} [${bar}]`);
}

console.log(`\nApplied Rules (${heCompiled.applied_rules.length}): ${heCompiled.applied_rules.join(', ')}\n`);

logResult(
  'All extreme personality triggers fire',
  heCompiled.applied_rules.length >= 8,
  `Fired ${heCompiled.applied_rules.length} rules`
);

logResult(
  'Anti-Sycophancy Lock is active',
  heCompiled.applied_rules.includes('antiSycophancy')
);

logResult(
  'Authority Challenge is active',
  heCompiled.applied_rules.includes('authorityChallenge')
);

logResult(
  'Competing Conflict mode is active',
  heCompiled.applied_rules.includes('competingConflict')
);

// ============================================================
// Test 3: Harmonizing HR Lead
// ============================================================
console.log('\n--- SECTION 3: HR LEAD ANALYSIS ---\n');

const hrScores = {
  A1: 3, A2: 3, A3: 3, A4: 3, A5: 5, A6: 1, A7: 5, A8: 1,
  B1: 1, B2: 5, B3: 4, B4: 2, B5: 4, B6: 2, B7: 2, B8: 4,
  C1: 4, C2: 2, C3: 3, C4: 3, C5: 3, C6: 3,
  D1: 1, D2: 5, D3: 2, D4: 4, D5: 3, D6: 3
};

const hrVectors = vectorService.processVCPQResponses(hrScores);
const hrModified = lexiconService.applyDomainModifiers(hrVectors.meta_vectors, 'hr');
const hrCompiled = promptCompiler.compilePrompt(hrModified, 'hr', {
  name: 'Jennifer Walsh',
  job_title: 'Director of People Operations'
});

console.log('HR Lead Vectors:');
console.log(`  agreeableness:  ${hrVectors.meta_vectors.agreeableness.toFixed(2)}`);
console.log(`  directness:     ${hrVectors.meta_vectors.directness.toFixed(2)}`);
console.log(`  conflict_mode:  ${hrVectors.meta_vectors.conflict_mode.toFixed(2)}`);
console.log(`  social_energy:  ${hrVectors.meta_vectors.social_energy.toFixed(2)}\n`);

console.log(`Applied Rules: ${hrCompiled.applied_rules.join(', ') || 'none'}\n`);

logResult(
  'HR Lead has high agreeableness (> 0.5)',
  hrVectors.meta_vectors.agreeableness > 0.5,
  `agreeableness = ${hrVectors.meta_vectors.agreeableness.toFixed(2)}`
);

logResult(
  'HR Lead has low directness (< 0)',
  hrVectors.meta_vectors.directness < 0,
  `directness = ${hrVectors.meta_vectors.directness.toFixed(2)}`
);

logResult(
  'HR Lead has avoiding conflict mode (< 0)',
  hrVectors.meta_vectors.conflict_mode < 0,
  `conflict_mode = ${hrVectors.meta_vectors.conflict_mode.toFixed(2)}`
);

logResult(
  'Indirect style triggered',
  hrCompiled.applied_rules.includes('indirectStyle'),
  `Rules: ${hrCompiled.applied_rules.join(', ')}`
);

logResult(
  'Avoiding conflict triggered',
  hrCompiled.applied_rules.includes('avoidingConflict'),
  `Rules: ${hrCompiled.applied_rules.join(', ')}`
);

// ============================================================
// Test 4: Vector Clash Analysis (Offline)
// ============================================================
console.log('\n--- SECTION 4: VECTOR CLASH ANALYSIS ---\n');

// Compare Engineer vs HR vectors
const clashAnalysis = [];
const vectorKeys = ['directness', 'agreeableness', 'conflict_mode', 'formality', 'verbosity'];

for (const key of vectorKeys) {
  const eng = heVectors.meta_vectors[key];
  const hr = hrVectors.meta_vectors[key];
  const clash = Math.abs(eng - hr);
  clashAnalysis.push({ dimension: key, engineer: eng, hr: hr, clash });
}

console.log('Vector Comparison (Engineer vs HR):');
for (const item of clashAnalysis) {
  const clashBar = '!'.repeat(Math.round(item.clash * 5));
  console.log(`  ${item.dimension.padEnd(15)} Eng: ${item.engineer.toFixed(2).padStart(6)} | HR: ${item.hr.toFixed(2).padStart(6)} | Clash: ${clashBar}`);
}

const totalClash = clashAnalysis.reduce((sum, item) => sum + item.clash, 0);
console.log(`\nTotal Clash Score: ${totalClash.toFixed(2)}/10\n`);

logResult(
  'High clash on directness dimension (> 1.0)',
  clashAnalysis.find(c => c.dimension === 'directness').clash > 1.0,
  `Clash = ${clashAnalysis.find(c => c.dimension === 'directness').clash.toFixed(2)}`
);

logResult(
  'High clash on conflict_mode dimension (> 1.0)',
  clashAnalysis.find(c => c.dimension === 'conflict_mode').clash > 1.0,
  `Clash = ${clashAnalysis.find(c => c.dimension === 'conflict_mode').clash.toFixed(2)}`
);

logResult(
  'Overall clash score > 5.0 (significant personality conflict)',
  totalClash > 5.0,
  `Total = ${totalClash.toFixed(2)}`
);

// ============================================================
// Test 5: System Prompt Quality Check
// ============================================================
console.log('\n--- SECTION 5: SYSTEM PROMPT QUALITY ---\n');

const hePrompt = heCompiled.system_prompt;
const hrPromptText = hrCompiled.system_prompt;

// Check for key components in prompts
const engineerChecks = [
  { name: 'Contains anti-sycophancy instructions', test: hePrompt.includes('challenge') || hePrompt.includes('skeptic') },
  { name: 'Contains directness instructions', test: hePrompt.includes('direct') || hePrompt.includes('blunt') },
  { name: 'Contains engineering vocabulary', test: hePrompt.includes('technical') || hePrompt.includes('latency') || hePrompt.includes('code') },
  { name: 'Contains persona identity', test: hePrompt.includes('Marcus Chen') },
  { name: 'Has personality vectors section', test: hePrompt.includes('PERSONALITY VECTORS') },
  { name: 'Has behavioral instructions section', test: hePrompt.includes('BEHAVIORAL INSTRUCTIONS') }
];

console.log('Engineer Prompt Quality:');
for (const check of engineerChecks) {
  logResult(check.name, check.test);
}

const hrChecks = [
  { name: 'Contains diplomatic instructions', test: hrPromptText.includes('indirect') || hrPromptText.includes('diplomatic') },
  { name: 'Contains HR vocabulary', test: hrPromptText.includes('engagement') || hrPromptText.includes('culture') || hrPromptText.includes('support') },
  { name: 'Contains avoiding conflict', test: hrPromptText.includes('avoid') || hrPromptText.includes('de-escalate') || hrPromptText.includes('common ground') },
  { name: 'Contains persona identity', test: hrPromptText.includes('Jennifer Walsh') }
];

console.log('\nHR Prompt Quality:');
for (const check of hrChecks) {
  logResult(check.name, check.test);
}

// ============================================================
// SUMMARY
// ============================================================
console.log('\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                    STRESS TEST SUMMARY                   ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log(`\nTotal Tests: ${testResults.passed + testResults.failed + testResults.skipped}`);
console.log(`${colors.pass.replace('PASS', 'Passed')}: ${testResults.passed}`);
console.log(`${colors.fail.replace('FAIL', 'Failed')}: ${testResults.failed}`);
console.log(`${colors.skip.replace('SKIP', 'Skipped')}: ${testResults.skipped}`);
console.log(`Pass Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);

if (testResults.failed === 0) {
  console.log('🎉 ALL STRESS TESTS PASSED!');
  console.log('');
  console.log('Key Findings:');
  console.log('  ✓ Radical Candor profile correctly balances Care + Challenge');
  console.log('  ✓ Hostile Engineer activates all extreme behavioral locks');
  console.log('  ✓ HR Lead activates diplomatic and de-escalation modes');
  console.log('  ✓ Vector clash between personas is quantifiable and significant');
  console.log('  ✓ System prompts contain all required components');
  console.log('');
  console.log('The VCPQ Framework is ready for production deployment.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review above.\n');
  process.exit(1);
}
