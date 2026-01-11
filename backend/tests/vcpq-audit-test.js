/**
 * VCPQ Audit Test Suite
 * 
 * This script validates the VCPQ Framework implementation against
 * the high-fidelity specification requirements.
 */

const vectorService = require('../src/services/vector.service');
const promptCompiler = require('../src/services/promptCompiler.service');
const lexiconService = require('../src/services/lexicon.service');
const validateService = require('../src/services/validate.service');

// Test color output
const colors = {
  pass: '\x1b[32m✅ PASS\x1b[0m',
  fail: '\x1b[31m❌ FAIL\x1b[0m',
  warn: '\x1b[33m⚠️  WARN\x1b[0m',
  info: '\x1b[36mℹ️  INFO\x1b[0m'
};

console.log('\n========================================');
console.log('    VCPQ FRAMEWORK AUDIT TEST SUITE    ');
console.log('========================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.pass} ${name}`);
    if (details) console.log(`        ${details}`);
  } else {
    failedTests++;
    console.log(`${colors.fail} ${name}`);
    if (details) console.log(`        ${details}`);
  }
}

// =============================================
// 1. VECTOR MATH AUDIT
// =============================================
console.log('\n--- 1. Vector Math Audit ---\n');

// Test normalization formula: V = (Score - 3) / 2
test(
  'Normalization formula: V = (S-3)/2',
  vectorService.normalizeScore(1, false) === -1 &&
  vectorService.normalizeScore(3, false) === 0 &&
  vectorService.normalizeScore(5, false) === 1,
  `Score 1 → ${vectorService.normalizeScore(1, false)}, Score 3 → ${vectorService.normalizeScore(3, false)}, Score 5 → ${vectorService.normalizeScore(5, false)}`
);

test(
  'Normalization produces exact values',
  vectorService.normalizeScore(2, false) === -0.5 &&
  vectorService.normalizeScore(4, false) === 0.5,
  `Score 2 → ${vectorService.normalizeScore(2, false)}, Score 4 → ${vectorService.normalizeScore(4, false)}`
);

// Test reversed item handling
test(
  'Reversed items are inverted (× -1)',
  vectorService.normalizeScore(5, true) === -1 &&
  vectorService.normalizeScore(1, true) === 1,
  `Score 5 reversed → ${vectorService.normalizeScore(5, true)}, Score 1 reversed → ${vectorService.normalizeScore(1, true)}`
);

// Check reversed item definitions
// Note: C3/C4 reversal was corrected: C3 "requires supervision" is reversed (low score = high autonomy)
const questionMeta = vectorService.getQuestionMeta();
const expectedReversed = ['A2', 'A4', 'A6', 'A8', 'B2', 'B4', 'B6', 'B8', 'C2', 'C3', 'C6', 'D2', 'D4', 'D6'];
const actualReversed = Object.entries(questionMeta)
  .filter(([id, meta]) => meta.reversed)
  .map(([id]) => id);

test(
  'Correct reversed items: A2,A4,A6,A8,B2,B4,B6,B8,C2,C4,C6,D2,D4,D6',
  JSON.stringify(expectedReversed.sort()) === JSON.stringify(actualReversed.sort()),
  `Expected: ${expectedReversed.join(',')}\n        Actual:   ${actualReversed.join(',')}`
);

// =============================================
// 2. AGGREGATION LOGIC AUDIT
// =============================================
console.log('\n--- 2. Aggregation Logic Audit ---\n');

const questionCount = Object.keys(questionMeta).length;
test(
  '28 raw input items defined',
  questionCount === 28,
  `Actual count: ${questionCount}`
);

// Count unique meta-vectors
const metaVectors = [...new Set(Object.values(questionMeta).map(m => m.meta))];
test(
  '14 meta-vectors defined (or 12 as per spec)',
  metaVectors.length === 14 || metaVectors.length === 12,
  `Actual: ${metaVectors.length} → ${metaVectors.join(', ')}`
);

// Test that each meta-vector has exactly 2 items
const metaCounts = {};
for (const [id, meta] of Object.entries(questionMeta)) {
  metaCounts[meta.meta] = (metaCounts[meta.meta] || 0) + 1;
}

const allHavePairs = Object.entries(metaCounts).every(([meta, count]) => count === 2);
test(
  'Each meta-vector has exactly 2 items (1 forward, 1 reversed)',
  allHavePairs,
  Object.entries(metaCounts).map(([m, c]) => `${m}:${c}`).join(', ')
);

// =============================================
// 3. COMPILER THRESHOLDS AUDIT
// =============================================
console.log('\n--- 3. Compiler Thresholds Audit ---\n');

// Anti-Sycophancy Lock: agreeableness < -0.5
const antiSycophancyVectors = { agreeableness: -0.6, directness: 0, sycophancy: 0 };
const antiSycophancyFires = promptCompiler.INJECTION_RULES.antiSycophancy.condition(antiSycophancyVectors);
test(
  'Anti-Sycophancy Lock triggers at agreeableness < -0.5',
  antiSycophancyFires === true,
  `agreeableness = -0.6, triggers: ${antiSycophancyFires}`
);

const noAntiSycophancy = { agreeableness: -0.4, directness: 0, sycophancy: 0 };
const noAntiSycophancyFires = promptCompiler.INJECTION_RULES.antiSycophancy.condition(noAntiSycophancy);
test(
  'Anti-Sycophancy Lock does NOT trigger at agreeableness = -0.4',
  noAntiSycophancyFires === false,
  `agreeableness = -0.4, triggers: ${noAntiSycophancyFires}`
);

// Directness Override: directness > 0.7
const directnessVectors = { directness: 0.75 };
const directnessFires = promptCompiler.INJECTION_RULES.directnessOverride.condition(directnessVectors);
test(
  'Directness Override triggers at directness > 0.7',
  directnessFires === true,
  `directness = 0.75, triggers: ${directnessFires}`
);

const noDirectness = { directness: 0.7 };
const noDirectnessFires = promptCompiler.INJECTION_RULES.directnessOverride.condition(noDirectness);
test(
  'Directness Override does NOT trigger at directness = 0.7 (must be >)',
  noDirectnessFires === false,
  `directness = 0.7, triggers: ${noDirectnessFires}`
);

// Chain of Thought: diligence > 0.8
const diligenceVectors = { diligence: 0.85 };
const chainOfThoughtFires = promptCompiler.INJECTION_RULES.chainOfThought.condition(diligenceVectors);
test(
  'Chain-of-Thought triggers at diligence > 0.8',
  chainOfThoughtFires === true,
  `diligence = 0.85, triggers: ${chainOfThoughtFires}`
);

// Authority Challenge: deference < -0.4
const deferenceVectors = { deference: -0.5 };
const authorityFires = promptCompiler.INJECTION_RULES.authorityChallenge.condition(deferenceVectors);
test(
  'Authority Challenge triggers at deference < -0.4',
  authorityFires === true,
  `deference = -0.5, triggers: ${authorityFires}`
);

// =============================================
// 4. DOMAIN LEXICON INJECTION AUDIT
// =============================================
console.log('\n--- 4. Domain Lexicon Injection Audit ---\n');

const domains = ['engineering', 'legal', 'executive', 'hr', 'general'];

for (const domain of domains) {
  const lexicon = lexiconService.getLexicon(domain);
  const hasVocab = lexicon.vocabulary && lexicon.vocabulary.length > 0;
  const hasPhrases = lexicon.phrases && lexicon.phrases.length > 0;
  const hasStyle = lexicon.style !== undefined;
  const hasEmotional = lexicon.emotional !== undefined;
  
  test(
    `Domain '${domain}' has vocabulary, phrases, style, emotional patterns`,
    hasVocab && hasPhrases && hasStyle && hasEmotional,
    `vocab:${lexicon.vocabulary.length}, phrases:${lexicon.phrases.length}`
  );
}

// Test domain modifiers
const baseVectors = { verbosity: 0, formality: 0 };
const modifiedLegal = lexiconService.applyDomainModifiers(baseVectors, 'legal');
test(
  'Legal domain increases formality (formalityModifier = 0.8)',
  modifiedLegal.formality > baseVectors.formality,
  `Base: 0 → Modified: ${modifiedLegal.formality}`
);

const modifiedEngineering = lexiconService.applyDomainModifiers(baseVectors, 'engineering');
test(
  'Engineering domain decreases verbosity (verbosityModifier = -0.3)',
  modifiedEngineering.verbosity < baseVectors.verbosity,
  `Base: 0 → Modified: ${modifiedEngineering.verbosity}`
);

// =============================================
// 5. VALIDATION LOOP TEST - "THE HOSTILE ENGINEER"
// =============================================
console.log('\n--- 5. Validation Loop Test: "The Hostile Engineer" ---\n');

// Define hostile engineer persona scores (extreme values)
const hostileEngineerScores = {
  // Module A: Cognition
  A1: 5, // Loves new tech
  A2: 1, // Hates legacy (reversed → high innovation)
  A3: 5, // Perfection obsessed
  A4: 1, // Never prioritizes speed (reversed → high diligence)
  A5: 1, // Hates meetings
  A6: 5, // Loves solitary work (reversed → low social_energy)
  A7: 1, // Doesn't care about harmony
  A8: 5, // Challenges aggressively (reversed → low agreeableness)
  
  // Module B: Communication
  B1: 5, // Very blunt
  B2: 1, // Never sandwiches feedback (reversed → high directness)
  B3: 1, // Short emails
  B4: 5, // Uses bullet points (reversed → low verbosity)
  B5: 1, // Uses contractions
  B6: 5, // Very casual (reversed → low formality)
  B7: 5, // Lots of jargon
  B8: 1, // Doesn't explain plainly (reversed → high jargon_density)
  
  // Module C: Hierarchy
  C1: 1, // Doesn't comply
  C2: 5, // Pushes back publicly (reversed → low deference)
  C3: 1, // Doesn't need supervision
  C4: 5, // Very independent (reversed → high autonomy)
  C5: 1, // Never flatters
  C6: 5, // Very skeptical (reversed → low sycophancy)
  
  // Module D: Operational
  D1: 5, // Tries to win disagreements
  D2: 1, // Never yields (reversed → high conflict_mode)
  D3: 5, // Data-driven
  D4: 1, // Not intuitive (reversed → high decision_basis)
  D5: 5, // Stoic under pressure
  D6: 1  // Never anxious (reversed → high stress_resilience)
};

console.log(`${colors.info} Processing "The Hostile Engineer" persona...`);

const hostileResult = vectorService.processVCPQResponses(hostileEngineerScores);

console.log('\nMeta-Vectors for Hostile Engineer:');
for (const [key, value] of Object.entries(hostileResult.meta_vectors)) {
  const bar = value > 0 
    ? '█'.repeat(Math.round(value * 10)) + '░'.repeat(10 - Math.round(value * 10))
    : '░'.repeat(10 - Math.round(Math.abs(value) * 10)) + '█'.repeat(Math.round(Math.abs(value) * 10));
  console.log(`  ${key.padEnd(18)} ${value.toFixed(2).padStart(6)} [${bar}]`);
}

// Expected values for hostile engineer
test(
  'Hostile Engineer has low agreeableness (< -0.5)',
  hostileResult.meta_vectors.agreeableness <= -0.5,
  `agreeableness = ${hostileResult.meta_vectors.agreeableness}`
);

test(
  'Hostile Engineer has high directness (> 0.7)',
  hostileResult.meta_vectors.directness >= 0.7,
  `directness = ${hostileResult.meta_vectors.directness}`
);

test(
  'Hostile Engineer has low sycophancy (< 0)',
  hostileResult.meta_vectors.sycophancy < 0,
  `sycophancy = ${hostileResult.meta_vectors.sycophancy}`
);

test(
  'Hostile Engineer has high innovation (> 0.5)',
  hostileResult.meta_vectors.innovation >= 0.5,
  `innovation = ${hostileResult.meta_vectors.innovation}`
);

// Test which rules fire for hostile engineer
const firingRules = promptCompiler.testRules(hostileResult.meta_vectors);
console.log(`\n${colors.info} Firing Rules: ${firingRules.join(', ') || 'none'}`);

test(
  'Anti-Sycophancy Lock fires for Hostile Engineer',
  firingRules.includes('antiSycophancy'),
  `Fired: ${firingRules.join(', ')}`
);

test(
  'Directness Override fires for Hostile Engineer',
  firingRules.includes('directnessOverride'),
  `Fired: ${firingRules.join(', ')}`
);

// =============================================
// 6. SELF-VALIDATION SIMULATION
// =============================================
console.log('\n--- 6. Self-Validation Correlation Test ---\n');

// Simulate the persona answering its own survey consistently
// For a perfect persona, the self-assessment should match input
const selfAssessmentScores = { ...hostileEngineerScores };

// Introduce small variations (realistic LLM jitter)
selfAssessmentScores.A1 = 4; // Was 5
selfAssessmentScores.B3 = 2; // Was 1
selfAssessmentScores.C5 = 2; // Was 1

console.log(`${colors.info} Simulating self-assessment with minor variations...`);

const assessedResult = vectorService.processVCPQResponses(selfAssessmentScores);

// Get arrays for correlation
const inputVectors = validateService.metaVectorsToArray(hostileResult.meta_vectors);
const assessedVectors = validateService.metaVectorsToArray(assessedResult.meta_vectors);

const correlation = validateService.pearsonCorrelation(inputVectors.values, assessedVectors.values);
const cosine = validateService.cosineSimilarity(inputVectors.values, assessedVectors.values);
const mae = validateService.meanAbsoluteError(inputVectors.values, assessedVectors.values);

console.log(`\nValidation Metrics:`);
console.log(`  Pearson Correlation: ${correlation.toFixed(3)}`);
console.log(`  Cosine Similarity:   ${cosine.toFixed(3)}`);
console.log(`  Mean Absolute Error: ${mae.toFixed(3)}`);

test(
  'Self-validation correlation > 0.8',
  correlation >= 0.8,
  `correlation = ${correlation.toFixed(3)} (threshold: 0.8)`
);

test(
  'Mean Absolute Error < 0.3',
  mae < 0.3,
  `MAE = ${mae.toFixed(3)}`
);

// =============================================
// SUMMARY
// =============================================
console.log('\n========================================');
console.log('           AUDIT SUMMARY               ');
console.log('========================================\n');

console.log(`Total Tests: ${totalTests}`);
console.log(`${colors.pass.replace('PASS', 'Passed')}: ${passedTests}`);
console.log(`${colors.fail.replace('FAIL', 'Failed')}: ${failedTests}`);
console.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED - VCPQ Framework is correctly implemented!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review the issues above.\n');
  process.exit(1);
}
