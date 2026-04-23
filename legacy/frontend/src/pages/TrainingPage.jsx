import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { personasAPI, trainingAPI } from '../services/api';
import {
    GraduationCap,
    Users,
    Play,
    Star,
    Clock,
    ChevronRight,
    Loader2,
    Trophy,
    Target,
    Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TrainingPage = () => {
    const [personas, setPersonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');

    useEffect(() => {
        fetchDefaultPersonas();
    }, []);

    const fetchDefaultPersonas = async () => {
        try {
            const response = await personasAPI.getDefaults();
            setPersonas(response.data.personas || []);
        } catch (error) {
            toast.error('Failed to load training personas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Training scenarios for each persona type
    const getScenarios = (persona) => {
        const archetype = persona.vector_profile?.archetype || persona.name;

        const scenarioMap = {
            'The Hunter': [
                { id: 'hunter-easy', difficulty: 'easy', title: 'Late CRM Update', description: 'Jordan hasn\'t updated their big deals in weeks', skills: ['Managing accountability', 'Empathy'] },
                { id: 'hunter-medium', difficulty: 'medium', title: 'Commission Dispute', description: 'Jordan claims quota was unfair this quarter', skills: ['Negotiation', 'Policy explanation'] },
                { id: 'hunter-hard', difficulty: 'hard', title: 'Top Performer Leaving', description: 'Jordan got a competing offer, wants counteroffer', skills: ['Retention', 'Executive presence'] },
            ],
            'The Craftsman': [
                { id: 'craft-easy', difficulty: 'easy', title: 'Meeting Overload', description: 'Alex refuses to attend standups', skills: ['Finding common ground'] },
                { id: 'craft-medium', difficulty: 'medium', title: 'Documentation Resistance', description: 'Alex won\'t document critical system', skills: ['Influencing without authority'] },
                { id: 'craft-hard', difficulty: 'hard', title: 'Production Outage Blame', description: 'Alex\'s code caused downtime, being defensive', skills: ['Crisis communication'] },
            ],
            'The Diplomat': [
                { id: 'diplo-easy', difficulty: 'easy', title: 'Feature Prioritization', description: 'Maya overwhelmed by conflicting requests', skills: ['Active listening', 'Prioritization'] },
                { id: 'diplo-medium', difficulty: 'medium', title: 'Stakeholder Conflict', description: 'Engineering and Sales disagree on roadmap', skills: ['Mediation', 'Decision-making'] },
                { id: 'diplo-hard', difficulty: 'hard', title: 'Product Launch Crisis', description: 'Major bug found day before launch', skills: ['Crisis management', 'Leadership'] },
            ],
            'The Guardian': [
                { id: 'guard-easy', difficulty: 'easy', title: 'Benefits Confusion', description: 'Employee frustrated about policy', skills: ['Clear communication', 'Patience'] },
                { id: 'guard-medium', difficulty: 'medium', title: 'Harassment Complaint', description: 'Sensitive report requiring investigation', skills: ['Empathy', 'Compliance'] },
                { id: 'guard-hard', difficulty: 'hard', title: 'Mass Layoff Announcement', description: 'Preparing managers for reductions', skills: ['Emotional intelligence', 'Leadership'] },
            ],
            'The Oracle': [
                { id: 'oracle-easy', difficulty: 'easy', title: 'Data Access Request', description: 'David needs database permissions urgently', skills: ['Service orientation'] },
                { id: 'oracle-medium', difficulty: 'medium', title: 'Strategy Disagreement', description: 'David\'s analysis contradicts exec decision', skills: ['Influence', 'Diplomacy'] },
                { id: 'oracle-hard', difficulty: 'hard', title: 'Model Bias Discovery', description: 'AI model has discriminatory patterns', skills: ['Ethics', 'Stakeholder management'] },
            ],
        };

        return scenarioMap[archetype] || [];
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyIcon = (difficulty) => {
        switch (difficulty) {
            case 'easy': return <Star className="w-3 h-3" />;
            case 'medium': return <><Star className="w-3 h-3" /><Star className="w-3 h-3" /></>;
            case 'hard': return <><Star className="w-3 h-3" /><Star className="w-3 h-3" /><Star className="w-3 h-3" /></>;
            default: return <Star className="w-3 h-3" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-7 h-7 text-primary-600" />
                        Training Scenarios
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Practice communication skills with AI personas. Each persona grades you based on their unique character.
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Persona-Specific Grading</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Each persona evaluates you differently! Jordan values directness, Sarah values empathy, Alex wants technical clarity.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['all', 'easy', 'medium', 'hard'].map((diff) => (
                    <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDifficulty === diff
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                    >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                ))}
            </div>

            {/* Personas with Scenarios */}
            <div className="space-y-6">
                {personas.map((persona) => {
                    const scenarios = getScenarios(persona);
                    const filteredScenarios = selectedDifficulty === 'all'
                        ? scenarios
                        : scenarios.filter(s => s.difficulty === selectedDifficulty);

                    if (filteredScenarios.length === 0) return null;

                    return (
                        <div key={persona.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Persona Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {persona.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white">{persona.name}</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{persona.tagline}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                            {persona.grading_rubric?.criteria?.[0]?.name || 'Custom'} focused
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Scenarios */}
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredScenarios.map((scenario) => (
                                    <Link
                                        key={scenario.id}
                                        to={`/training/${persona.id}/${scenario.id}`}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDifficultyColor(scenario.difficulty)}`}>
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{scenario.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</p>
                                            <div className="flex gap-2 mt-1">
                                                {scenario.skills.map((skill, i) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                                                {getDifficultyIcon(scenario.difficulty)}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {personas.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Training Personas Available</h3>
                    <p className="text-gray-600 dark:text-gray-400">Default personas are required for training scenarios.</p>
                </div>
            )}
        </div>
    );
};

export default TrainingPage;
