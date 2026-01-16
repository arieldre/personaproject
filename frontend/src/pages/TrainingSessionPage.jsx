import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { personasAPI, trainingAPI } from '../services/api';
import {
    ArrowLeft,
    Send,
    Loader2,
    GraduationCap,
    CheckCircle2,
    Target,
    Star,
    Bot,
    User,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TrainingSessionPage = () => {
    const { personaId, scenarioId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [persona, setPersona] = useState(null);
    const [scenario, setScenario] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [gradingResult, setGradingResult] = useState(null);
    const [grading, setGrading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [personaId, scenarioId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchData = async () => {
        try {
            const personaRes = await personasAPI.get(personaId);
            // API returns persona data directly, not wrapped in 'persona' key
            const personaData = personaRes.data;
            setPersona(personaData);

            // Get scenario from the hardcoded list based on ID
            const scenarioData = getScenarioById(scenarioId, personaData);
            setScenario(scenarioData);

            // Start with persona's opening message based on scenario
            if (scenarioData && personaData) {
                const openingMessage = generateOpeningMessage(personaData, scenarioData);
                setMessages([{ role: 'assistant', content: openingMessage }]);
            }
        } catch (error) {
            toast.error('Failed to load training scenario');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getScenarioById = (id, persona) => {
        const archetype = persona.vector_profile?.archetype || 'The Hunter';

        const allScenarios = {
            'hunter-easy': { title: 'Late CRM Update', description: 'Jordan hasn\'t updated their big deals in weeks', difficulty: 'easy', context: 'You are Jordan\'s manager. Jordan has been neglecting CRM updates for weeks, leaving leadership without visibility into the sales pipeline.' },
            'hunter-medium': { title: 'Commission Dispute', description: 'Jordan claims quota was unfair this quarter', difficulty: 'medium', context: 'Jordan is disputing their commission, claiming the quota was set unfairly high compared to other AEs.' },
            'hunter-hard': { title: 'Top Performer Leaving', description: 'Jordan got a competing offer', difficulty: 'hard', context: 'Jordan just received a lucrative offer from a competitor and is considering leaving. They\'ve been your top performer.' },
            'craft-easy': { title: 'Meeting Overload', description: 'Alex refuses to attend standups', difficulty: 'easy', context: 'Alex has stopped attending daily standups, saying they\'re a waste of time that interrupts deep work.' },
            'craft-medium': { title: 'Documentation Resistance', description: 'Alex won\'t document critical system', difficulty: 'medium', context: 'Alex built a critical system that only they understand, but refuses to write documentation.' },
            'craft-hard': { title: 'Production Outage Blame', description: 'Alex\'s code caused downtime', difficulty: 'hard', context: 'Alex\'s recent deployment caused a 4-hour production outage. They\'re being defensive and blaming QA.' },
            'diplo-easy': { title: 'Feature Prioritization', description: 'Maya overwhelmed by requests', difficulty: 'easy', context: 'Maya is overwhelmed by conflicting feature requests from sales, support, and engineering.' },
            'diplo-medium': { title: 'Stakeholder Conflict', description: 'Engineering vs Sales disagreement', difficulty: 'medium', context: 'Engineering wants to focus on tech debt while Sales demands new features. Maya is caught in the middle.' },
            'diplo-hard': { title: 'Product Launch Crisis', description: 'Major bug found before launch', difficulty: 'hard', context: 'A critical bug was found 24 hours before a major product launch. Stakeholders are panicking.' },
            'guard-easy': { title: 'Benefits Confusion', description: 'Employee frustrated about policy', difficulty: 'easy', context: 'An employee is frustrated and confused about recent changes to the benefits policy.' },
            'guard-medium': { title: 'Harassment Complaint', description: 'Sensitive report requiring investigation', difficulty: 'medium', context: 'An employee has come to you with a harassment complaint about their manager.' },
            'guard-hard': { title: 'Mass Layoff Announcement', description: 'Preparing for reductions', difficulty: 'hard', context: 'The company is planning a 20% workforce reduction. You need to prepare managers for the announcement.' },
            'oracle-easy': { title: 'Data Access Request', description: 'Urgent permissions needed', difficulty: 'easy', context: 'David needs urgent database access for an important analysis, but normal approval takes a week.' },
            'oracle-medium': { title: 'Strategy Disagreement', description: 'Analysis contradicts executives', difficulty: 'medium', context: 'David\'s data analysis contradicts a strategic decision already announced by the CEO.' },
            'oracle-hard': { title: 'Model Bias Discovery', description: 'AI shows discriminatory patterns', difficulty: 'hard', context: 'David discovered that your company\'s AI model has significant bias against certain demographics.' },
        };

        return allScenarios[id] || null;
    };

    const generateOpeningMessage = (persona, scenario) => {
        const name = persona.name?.split('"')[0]?.trim() || 'I';
        const archetype = persona.vector_profile?.archetype;

        const openings = {
            'The Hunter': `Look, I know you wanted to talk about ${scenario.title.toLowerCase()}. Can we make this quick? I've got three calls back-to-back this afternoon.`,
            'The Craftsman': `*responds via Slack* Hey. About ${scenario.title.toLowerCase()} - I assume this is why you pinged me? What do you need?`,
            'The Diplomat': `Thanks for reaching out. I know we need to discuss ${scenario.title.toLowerCase()}. I have about 15 minutes before my next sync - let's make the most of it.`,
            'The Guardian': `Hi there. I appreciate you taking the time to meet. I understand you wanted to talk about ${scenario.title.toLowerCase()}. How can I help?`,
            'The Oracle': `*looks up from laptop* Oh, right - ${scenario.title.toLowerCase()}. I was just running some analysis. What's your take on it?`,
        };

        return openings[archetype] || `Let's discuss ${scenario.title.toLowerCase()}.`;
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSending(true);

        try {
            // Use the chat endpoint with training context
            const response = await personasAPI.sendMessage(
                personaId,
                input.trim(),
                { isTraining: true, scenario: scenario?.context }
            );

            if (response.data?.message) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
            }
        } catch (error) {
            // If API fails, generate a mock response for demo
            const mockResponse = generateMockResponse(persona, messages.length);
            setMessages(prev => [...prev, { role: 'assistant', content: mockResponse }]);
        } finally {
            setSending(false);
        }
    };

    const generateMockResponse = (persona, turn) => {
        const archetype = persona?.vector_profile?.archetype || 'The Hunter';

        const responses = {
            'The Hunter': [
                "Okay, I hear you. But you gotta understand - when deals are moving fast, admin work just isn't my priority. What's the real impact here?",
                "Fine, I'll get it done. But can we agree on a realistic cadence? I can't be updating every little thing every day.",
                "Look, if this is really that important to leadership, I'll make it happen. Just don't expect me to change overnight.",
            ],
            'The Craftsman': [
                "I understand the concern, but these meetings are genuinely disrupting my flow. Can we compromise on async updates instead?",
                "The documentation argument I get, but my time is better spent building than writing docs. What if we pair me with a tech writer?",
                "Look, I take responsibility for the outage. But the real issue is our testing pipeline, not my code specifically.",
            ],
            'The Guardian': [
                "I appreciate you explaining that. It helps to understand the reasoning behind the policy changes.",
                "This is a sensitive situation. I want to make sure we handle it properly for everyone involved.",
                "Thank you for your patience. This is never easy, but I'm glad we could talk through it.",
            ],
        };

        const personaResponses = responses[archetype] || responses['The Hunter'];
        return personaResponses[Math.min(turn, personaResponses.length - 1)];
    };

    const completeSession = async () => {
        setGrading(true);
        try {
            // Call grading endpoint
            const response = await trainingAPI.gradeSession({
                personaId,
                scenarioId,
                messages: messages.filter(m => m.role === 'user')
            });

            setGradingResult(response.data);
            setSessionComplete(true);
        } catch (error) {
            // Mock grading for demo
            const mockGrade = generateMockGrade(persona);
            setGradingResult(mockGrade);
            setSessionComplete(true);
        } finally {
            setGrading(false);
        }
    };

    const generateMockGrade = (persona) => {
        const archetype = persona?.vector_profile?.archetype || 'The Hunter';
        const rubric = persona?.grading_rubric;

        return {
            overall_score: 72 + Math.floor(Math.random() * 20),
            criteria_scores: (rubric?.criteria || [
                { name: 'Communication', weight: 25 },
                { name: 'Empathy', weight: 25 },
                { name: 'Problem Solving', weight: 25 },
                { name: 'Professionalism', weight: 25 },
            ]).map(c => ({
                name: c.name,
                score: 60 + Math.floor(Math.random() * 35),
                feedback: `Good effort on ${c.name.toLowerCase()}.`
            })),
            overall_feedback: rubric?.grading_style || 'Good conversation overall. Keep practicing to improve.',
            tips: ['Be more concise', 'Show more empathy early on'],
            graded_by: {
                persona_name: persona?.name,
                grading_style: rubric?.grading_style || 'Standard evaluation'
            }
        };
    };

    const getLetterGrade = (score) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    };

    const getGradeColor = (score) => {
        if (score >= 90) return 'text-green-600 bg-green-100';
        if (score >= 80) return 'text-blue-600 bg-blue-100';
        if (score >= 70) return 'text-yellow-600 bg-yellow-100';
        if (score >= 60) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (sessionComplete && gradingResult) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Link to="/training" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Training Results</h1>
                </div>

                {/* Score Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getGradeColor(gradingResult.overall_score)} mb-4`}>
                            <span className="text-4xl font-bold">{getLetterGrade(gradingResult.overall_score)}</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{gradingResult.overall_score}/100</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Graded by <span className="font-medium">{gradingResult.graded_by?.persona_name}</span>
                        </p>
                    </div>

                    {/* Grading Style */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Grading Style</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{gradingResult.graded_by?.grading_style}</p>
                    </div>

                    {/* Criteria Scores */}
                    <div className="space-y-4 mb-6">
                        <h3 className="font-medium text-gray-900 dark:text-white">Score Breakdown</h3>
                        {gradingResult.criteria_scores?.map((criterion, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">{criterion.name}</span>
                                    <span className="font-medium">{criterion.score}/100</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-600 rounded-full transition-all"
                                        style={{ width: `${criterion.score}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{criterion.feedback}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tips */}
                    {gradingResult.tips?.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Tips for Improvement</h3>
                            <ul className="space-y-2">
                                {gradingResult.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Link
                        to="/training"
                        className="flex-1 py-3 text-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Back to Training
                    </Link>
                    <button
                        onClick={() => {
                            setSessionComplete(false);
                            setGradingResult(null);
                            setMessages([{ role: 'assistant', content: generateOpeningMessage(persona, scenario) }]);
                        }}
                        className="flex-1 py-3 text-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <Link to="/training" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary-600" />
                        {scenario?.title}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Training with {persona?.name}
                    </p>
                </div>
                {messages.length >= 3 && (
                    <button
                        onClick={completeSession}
                        disabled={grading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {grading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        End & Get Feedback
                    </button>
                )}
            </div>

            {/* Context Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-3">
                <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Scenario:</strong> {scenario?.context}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((message, i) => (
                    <div key={i} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                        )}
                        <div className={`max-w-[70%] rounded-xl px-4 py-3 ${message.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            }`}>
                            {message.content}
                        </div>
                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ))}
                {sending && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default TrainingSessionPage;
