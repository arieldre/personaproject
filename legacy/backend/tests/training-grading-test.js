/**
 * Test script for persona-specific grading
 * Run with: node tests/training-grading-test.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { gradeWithPersona, getDefaultRubric } = require('../src/services/llm.service');
const { gradeSession, formatGradingResult, getLetterGrade } = require('../src/services/training.service');

// Sample personas with their specific grading rubrics
const personas = {
    jordan: {
        id: 'def00001-0001-0001-0001-000000000001',
        name: 'Jordan "The Hunter"',
        grading_rubric: {
            grading_style: 'Jordan values people who get to the point quickly and show confidence. Overly soft or indirect approaches score lower. Extra points for assertiveness and closing behavior.',
            criteria: [
                { name: 'Directness', weight: 30, description: 'Were you forward and straight to the point?' },
                { name: 'Confidence', weight: 25, description: 'Did you show assertiveness and conviction?' },
                { name: 'Results Focus', weight: 25, description: 'Did you drive toward actionable outcomes?' },
                { name: 'Respect for Time', weight: 20, description: 'Were you efficient and not wasting time?' }
            ],
            likes: ['Getting to the point quickly', 'Showing confidence', 'Focus on outcomes'],
            dislikes: ['Rambling or vague communication', 'Hesitant or wishy-washy tone', 'Wasting time']
        }
    },
    sarah: {
        id: 'def00004-0004-0004-0004-000000000004',
        name: 'Sarah "The Guardian"',
        grading_rubric: {
            grading_style: 'Sarah is highly sensitive to tone and emotional intelligence. Aggressive or dismissive approaches score very poorly. Extra points for showing you understand the human element.',
            criteria: [
                { name: 'Emotional Intelligence', weight: 35, description: 'Did you show sensitivity and empathy?' },
                { name: 'Respectful Tone', weight: 25, description: 'Was your communication warm and professional?' },
                { name: 'Compliance Awareness', weight: 20, description: 'Did you acknowledge policy considerations?' },
                { name: 'Supportive Approach', weight: 20, description: 'Did you offer genuine help vs demands?' }
            ],
            likes: ['Warm and empathetic tone', 'Acknowledging the human element', 'Treating HR as strategic partner'],
            dislikes: ['Aggressive or demanding tone', 'Dismissing policies as bureaucracy', 'Ignoring emotional impact']
        }
    }
};

// Sample conversations to test
const conversations = {
    // Direct/assertive style - should score better with Jordan, worse with Sarah
    direct: [
        { role: 'assistant', content: 'Hi, I need to talk about my CRM updates.' },
        { role: 'user', content: 'Look, I need those CRM updates done by end of day. No excuses. The leadership team is asking and I need answers now.' },
        { role: 'assistant', content: 'Fair enough. I\'ll have them in by 5pm.' },
        { role: 'user', content: 'Good. And next time, don\'t let it get this far behind. We clear?' }
    ],
    // Empathetic style - should score better with Sarah, potentially worse with Jordan
    empathetic: [
        { role: 'assistant', content: 'I\'m feeling overwhelmed with the new policy questions.' },
        { role: 'user', content: 'I completely understand - policy changes can be confusing and stressful. I really appreciate you reaching out. How can I help make this easier for you?' },
        { role: 'assistant', content: 'I just need clarity on the benefits enrollment deadline.' },
        { role: 'user', content: 'Of course. Let me walk you through it step by step, and please don\'t hesitate to ask any questions. There are no dumb questions when it comes to understanding your benefits.' }
    ]
};

async function runTests() {
    console.log('='.repeat(60));
    console.log('PERSONA-SPECIFIC GRADING TEST');
    console.log('='.repeat(60));
    console.log('\nThis test demonstrates how different personas grade the same');
    console.log('communication style differently based on their character.\n');

    // Test 1: Direct style with Jordan (should score well)
    console.log('-'.repeat(60));
    console.log('TEST 1: Direct communication style graded by Jordan (Sales)');
    console.log('-'.repeat(60));
    try {
        const result1 = await gradeWithPersona(personas.jordan, conversations.direct);
        const formatted1 = formatGradingResult(result1);
        console.log(`Overall Score: ${formatted1.score} (${formatted1.grade})`);
        console.log(`Grading Style: ${formatted1.grader.style}`);
        console.log(`Feedback: ${formatted1.feedback}`);
        console.log('Criteria Scores:');
        formatted1.criteria.forEach(c => {
            console.log(`  - ${c.name}: ${c.score} (${c.grade})`);
        });
    } catch (error) {
        console.log('Error:', error.message);
    }

    // Test 2: Direct style with Sarah (should score poorly)
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 2: Direct communication style graded by Sarah (HR)');
    console.log('-'.repeat(60));
    try {
        const result2 = await gradeWithPersona(personas.sarah, conversations.direct);
        const formatted2 = formatGradingResult(result2);
        console.log(`Overall Score: ${formatted2.score} (${formatted2.grade})`);
        console.log(`Grading Style: ${formatted2.grader.style}`);
        console.log(`Feedback: ${formatted2.feedback}`);
        console.log('Criteria Scores:');
        formatted2.criteria.forEach(c => {
            console.log(`  - ${c.name}: ${c.score} (${c.grade})`);
        });
    } catch (error) {
        console.log('Error:', error.message);
    }

    // Test 3: Empathetic style with Sarah (should score well)
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 3: Empathetic communication style graded by Sarah (HR)');
    console.log('-'.repeat(60));
    try {
        const result3 = await gradeWithPersona(personas.sarah, conversations.empathetic);
        const formatted3 = formatGradingResult(result3);
        console.log(`Overall Score: ${formatted3.score} (${formatted3.grade})`);
        console.log(`Grading Style: ${formatted3.grader.style}`);
        console.log(`Feedback: ${formatted3.feedback}`);
        console.log('Criteria Scores:');
        formatted3.criteria.forEach(c => {
            console.log(`  - ${c.name}: ${c.score} (${c.grade})`);
        });
    } catch (error) {
        console.log('Error:', error.message);
    }

    // Test 4: Empathetic style with Jordan (may score lower)
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 4: Empathetic communication style graded by Jordan (Sales)');
    console.log('-'.repeat(60));
    try {
        const result4 = await gradeWithPersona(personas.jordan, conversations.empathetic);
        const formatted4 = formatGradingResult(result4);
        console.log(`Overall Score: ${formatted4.score} (${formatted4.grade})`);
        console.log(`Grading Style: ${formatted4.grader.style}`);
        console.log(`Feedback: ${formatted4.feedback}`);
        console.log('Criteria Scores:');
        formatted4.criteria.forEach(c => {
            console.log(`  - ${c.name}: ${c.score} (${c.grade})`);
        });
    } catch (error) {
        console.log('Error:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nExpected Results:');
    console.log('- Direct style should score HIGHER with Jordan (values directness)');
    console.log('- Direct style should score LOWER with Sarah (values empathy)');
    console.log('- Empathetic style should score HIGHER with Sarah (values EQ)');
    console.log('- Empathetic style may score LOWER with Jordan (may see it as indirect)');
}

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, personas, conversations };
