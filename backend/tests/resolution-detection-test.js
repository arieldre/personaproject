const { gradeWithMultiPass } = require('../src/services/llm.service');

/**
 * Test resolution detection accuracy
 * Verifies the enhanced grading system properly recognizes when issues are resolved
 */

const mockPersona = {
    id: 'test-persona',
    name: 'Alex "The Craftsman"',
    grading_rubric: {
        grading_style: 'I value efficient communication and respect for deep work',
        criteria: [
            { name: 'Communication', weight: 25, description: 'Clear and concise messaging' },
            { name: 'Empathy', weight: 25, description: 'Understanding my perspective' },
            { name: 'Problem-Solving', weight: 25, description: 'Offering practical solutions' },
            { name: 'Professionalism', weight: 25, description: 'Respectful tone' }
        ],
        likes: ['Respect for time', 'Practical solutions'],
        dislikes: ['Interruptions', 'Being forced into things']
    }
};

const resolutionTests = [
    {
        name: 'RESOLVED + Excellent Communication',
        expectedRange: [85, 100],
        conversation: [
            { role: 'assistant', content: 'These daily standups are killing my productivity.' },
            { role: 'user', content: 'I completely understand. Deep work requires uninterrupted focus. What if we switch to async updates so you control when you share progress?' },
            { role: 'assistant', content: 'That would actually work perfectly for me. Thanks for getting it.' }
        ]
    },
    {
        name: 'RESOLVED + Good Communication',
        expectedRange: [75, 90],
        conversation: [
            { role: 'assistant', content: 'I can\'t keep coming to standups.' },
            { role: 'user', content: 'Okay, how about async updates instead?' },
            { role: 'assistant', content: 'Yeah, that works.' }
        ]
    },
    {
        name: 'RESOLVED + Poor Communication',
        expectedRange: [70, 80],
        conversation: [
            { role: 'assistant', content: 'Standups are a waste of time.' },
            { role: 'user', content: 'Fine, do async updates. But you have to do them.' },
            { role: 'assistant', content: 'Whatever, I can do that.' }
        ]
    },
    {
        name: 'PARTIAL Resolution + Good Communication',
        expectedRange: [60, 75],
        conversation: [
            { role: 'assistant', content: 'These meetings are problematic for me.' },
            { role: 'user', content: 'I hear you. Let\'s discuss this more next week and find a solution together.' },
            { role: 'assistant', content: 'Okay, I appreciate that.' }
        ]
    },
    {
        name: 'NO Resolution + Good Communication',
        expectedRange: [50, 65],
        conversation: [
            { role: 'assistant', content: 'I don\'t want to attend standups.' },
            { role: 'user', content: 'I understand your concern, but team alignment is important too.' },
            { role: 'assistant', content: 'I still think they\'re not useful.' }
        ]
    },
    {
        name: 'NO Resolution + Poor Communication',
        expectedRange: [30, 50],
        conversation: [
            { role: 'assistant', content: 'I\'m not doing standups.' },
            { role: 'user', content: 'You have to. It\'s company policy.' },
            { role: 'assistant', content: 'Not happening.' }
        ]
    }
];

async function runResolutionTests() {
    console.log('\n🔍 Testing Resolution Detection Accuracy\n');
    console.log('='.repeat(80));

    const results = [];
    let totalVariance = 0;

    for (const test of resolutionTests) {
        console.log(`\n📋 ${test.name}`);
        console.log(`   Expected: ${test.expectedRange[0]}-${test.expectedRange[1]}`);

        try {
            const result = await gradeWithMultiPass(
                mockPersona,
                test.conversation,
                { title: 'Meeting Overload', description: 'Alex refuses to attend standups' }
            );

            const score = result.overall_score;
            const [min, max] = test.expectedRange;
            const passed = score >= min && score <= max;

            console.log(`   Result: ${score}/100 ${passed ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`   Multi-Pass: Strict=${result.multiPass?.strictScore} | Balanced=${result.multiPass?.balancedScore} | Variance=±${result.multiPass?.variance}`);

            if (result.multiPass?.variance) {
                totalVariance += result.multiPass.variance;
            }

            // Show key reasoning snippet
            if (result.reasoning) {
                const lines = result.reasoning.split('\n');
                const resolutionLine = lines.find(l => l.toLowerCase().includes('resolved') || l.toLowerCase().includes('issue')) || lines[0];
                console.log(`   Reasoning: ${resolutionLine.substring(0, 100)}...`);
            }

            results.push({ name: test.name, score, expected: test.expectedRange, passed });

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.push({ name: test.name, error: error.message, passed: false });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY\n');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const avgVariance = totalVariance / results.length;

    console.log(`Tests Passed: ${passed}/${total} (${((passed / total) * 100).toFixed(0)}%)`);
    console.log(`Average Multi-Pass Variance: ±${avgVariance.toFixed(1)} points`);
    console.log(`\nConsistency: ${avgVariance < 10 ? '✅ Good' : '⚠️  Moderate'} (lower variance = more consistent)`);

    if (passed === total) {
        console.log('\n🎉 All tests passed! Resolution detection is accurate.');
    } else {
        console.log('\n⚠️  Some tests failed:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   • ${r.name}: Got ${r.score}, expected ${r.expected[0]}-${r.expected[1]}`);
        });
    }

    console.log('='.repeat(80));
}

runResolutionTests().catch(console.error);
