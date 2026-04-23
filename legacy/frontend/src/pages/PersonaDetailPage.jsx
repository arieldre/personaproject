import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { personasAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Trash2,
  Users,
  Target,
  Heart,
  AlertTriangle,
  Zap,
  MapPin,
  Briefcase,
  Calendar,
  Brain,
  Lightbulb,
  BookOpen,
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PersonaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const response = await personasAPI.get(id);
        setPersona(response.data);
      } catch (error) {
        console.error('Failed to fetch persona:', error);
        toast.error('Persona not found');
        navigate('/personas');
      } finally {
        setLoading(false);
      }
    };

    fetchPersona();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this persona?')) return;

    setDeleting(true);
    try {
      await personasAPI.delete(id);
      toast.success('Persona deleted');
      navigate('/personas');
    } catch (error) {
      toast.error('Failed to delete persona');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!persona) return null;

  // Check if this is a VCPQ persona (has personality_vectors)
  const isVCPQPersona = persona.personality_vectors || persona.vector_profile;

  // VCPQ data
  const vectors = persona.personality_vectors || {};
  const vectorProfile = persona.vector_profile || {};
  const demographics = persona.demographics || persona.summary?.demographics || {};

  // Legacy data
  const summary = persona.summary || {};
  const extended = persona.extended_profile || {};

  // Helper to get vector label and color
  const getVectorDisplay = (key, value) => {
    const vectorInfo = {
      innovation: { label: 'Innovation', low: 'Traditional', high: 'Innovative', color: 'purple' },
      diligence: { label: 'Diligence', low: 'Flexible', high: 'Meticulous', color: 'blue' },
      social_energy: { label: 'Social Energy', low: 'Reserved', high: 'Outgoing', color: 'yellow' },
      agreeableness: { label: 'Agreeableness', low: 'Challenger', high: 'Harmonizer', color: 'green' },
      directness: { label: 'Directness', low: 'Diplomatic', high: 'Direct', color: 'red' },
      verbosity: { label: 'Verbosity', low: 'Concise', high: 'Elaborate', color: 'indigo' },
      formality: { label: 'Formality', low: 'Casual', high: 'Formal', color: 'gray' },
      jargon_density: { label: 'Technical Language', low: 'Plain Language', high: 'Technical', color: 'cyan' },
      deference: { label: 'Deference', low: 'Independent', high: 'Deferential', color: 'pink' },
      autonomy: { label: 'Autonomy', low: 'Collaborative', high: 'Autonomous', color: 'orange' },
      sycophancy: { label: 'Approval Seeking', low: 'Self-assured', high: 'Approval Seeking', color: 'rose' },
      conflict_mode: { label: 'Conflict Style', low: 'Avoidant', high: 'Confrontational', color: 'amber' },
      decision_basis: { label: 'Decision Making', low: 'Intuitive', high: 'Analytical', color: 'emerald' },
      stress_resilience: { label: 'Stress Resilience', low: 'Sensitive', high: 'Resilient', color: 'teal' },
    };

    const info = vectorInfo[key] || { label: key, low: 'Low', high: 'High', color: 'gray' };
    const normalizedValue = (value + 1) / 2; // Convert -1 to 1 range to 0 to 1

    return { ...info, value, normalizedValue };
  };

  // Extract personality insights - prioritize pre-generated insights from backend
  const getPersonalityInsights = () => {
    // Check for pre-generated insights from backend (LLM-generated)
    if (summary.strengths || summary.areas_for_growth || summary.learning_style || summary.work_style) {
      return {
        strengths: summary.strengths || [],
        challenges: summary.areas_for_growth || [],
        areasForGrowth: summary.areas_for_growth || [],
        communicationStyle: summary.work_style?.feedback_preference
          ? [summary.work_style.feedback_preference, summary.work_style.collaboration]
          : [],
        learningStyle: summary.learning_style?.preferences || [],
        learningType: summary.learning_style?.type || null,
        learningRecommendations: summary.learning_style?.recommendations || [],
        workStyle: summary.work_style || null,
        compatibility: summary.compatibility || null,
        motivations: summary.motivations || [],
        generatedByLLM: true
      };
    }

    // Fallback: derive insights from vectors if backend didn't generate them
    if (!vectors || Object.keys(vectors).length === 0) return null;

    const strengths = [];
    const challenges = [];
    const communicationStyle = [];
    const learningStyle = [];
    const motivations = [];

    // Analyze vectors for insights
    if (vectors.innovation > 0.3) {
      strengths.push('Creative problem-solving');
      motivations.push('Exploring new ideas and approaches');
    } else if (vectors.innovation < -0.3) {
      strengths.push('Reliable, proven methods');
      motivations.push('Stability and predictability');
    }

    if (vectors.diligence > 0.3) {
      strengths.push('Attention to detail');
      strengths.push('Thorough and methodical');
    } else if (vectors.diligence < -0.3) {
      strengths.push('Quick adaptation');
      strengths.push('Flexible approach');
    }

    if (vectors.social_energy > 0.3) {
      strengths.push('Team collaboration');
      communicationStyle.push('Energized by group discussions');
      learningStyle.push('Collaborative learning');
    } else if (vectors.social_energy < -0.3) {
      strengths.push('Deep focus work');
      communicationStyle.push('Prefers one-on-one conversations');
      learningStyle.push('Independent study');
    }

    if (vectors.directness > 0.3) {
      communicationStyle.push('Clear and straightforward');
      challenges.push('May come across as blunt');
    } else if (vectors.directness < -0.3) {
      communicationStyle.push('Diplomatic and tactful');
      challenges.push('May avoid difficult conversations');
    }

    if (vectors.verbosity > 0.3) {
      communicationStyle.push('Detailed explanations');
      learningStyle.push('Comprehensive documentation');
    } else if (vectors.verbosity < -0.3) {
      communicationStyle.push('Brief and to-the-point');
      learningStyle.push('Quick summaries and bullet points');
    }

    if (vectors.decision_basis > 0.3) {
      strengths.push('Data-driven decisions');
      learningStyle.push('Evidence-based learning');
      motivations.push('Understanding through analysis');
    } else if (vectors.decision_basis < -0.3) {
      strengths.push('Intuitive judgment');
      learningStyle.push('Experience-based learning');
      motivations.push('Following instincts');
    }

    if (vectors.stress_resilience > 0.3) {
      strengths.push('Calm under pressure');
    } else if (vectors.stress_resilience < -0.3) {
      challenges.push('Sensitive to high-pressure situations');
    }

    if (vectors.autonomy > 0.3) {
      motivations.push('Independence and self-direction');
      learningStyle.push('Self-paced learning');
    } else if (vectors.autonomy < -0.3) {
      motivations.push('Team success and collaboration');
      learningStyle.push('Guided learning with mentorship');
    }

    return {
      strengths: strengths.length > 0 ? strengths : ['Adaptable', 'Well-rounded'],
      challenges: challenges.length > 0 ? challenges : ['Balance between different approaches'],
      areasForGrowth: challenges.length > 0 ? challenges : ['Continuous improvement'],
      communicationStyle: communicationStyle.length > 0 ? communicationStyle : ['Balanced communication'],
      learningStyle: learningStyle.length > 0 ? learningStyle : ['Flexible learning approach'],
      motivations: motivations.length > 0 ? motivations : ['Personal growth', 'Making an impact'],
      generatedByLLM: false
    };
  };

  const insights = getPersonalityInsights();

  const Section = ({ title, icon: Icon, children, color = 'bg-gray-100 dark:bg-gray-700' }) => (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const TraitBadge = ({ trait, color }) => (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${color}`}>
      {trait}
    </span>
  );

  const VectorBar = ({ vectorKey, value }) => {
    const display = getVectorDisplay(vectorKey, value);
    const percentage = display.normalizedValue * 100;

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{display.low}</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{display.label}</span>
          <span className="text-gray-500 dark:text-gray-400">{display.high}</span>
        </div>
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary-600 rounded-full shadow"
            style={{ left: `calc(${percentage}% - 6px)` }}
          />
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personality', label: 'Personality', icon: Brain },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'growth', label: 'Strengths & Growth', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/personas"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{persona.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{persona.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin() && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-outline text-red-600 hover:bg-red-50 border-red-200"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
          <Link to={`/personas/${id}/chat`} className="btn-primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with {persona.name.split(' ')[0]}
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-5xl shadow-lg">
              {persona.name[0]}
            </div>
          </div>

          {/* Person Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{persona.name}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{persona.tagline}</p>
            </div>

            {/* Demographics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {demographics.age_range && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Age</p>
                    <p className="font-medium text-gray-900 dark:text-white">{demographics.age_range}</p>
                  </div>
                </div>
              )}
              {demographics.job_title && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                    <p className="font-medium text-gray-900 dark:text-white">{demographics.job_title}</p>
                  </div>
                </div>
              )}
              {demographics.department && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                    <p className="font-medium text-gray-900 dark:text-white">{demographics.department}</p>
                  </div>
                </div>
              )}
              {demographics.experience_level && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium text-gray-900">{demographics.experience_level}</p>
                  </div>
                </div>
              )}
              {demographics.region && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white">{demographics.region}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Confidence & Cluster Info */}
            <div className="flex flex-wrap gap-4">
              {persona.cluster_size && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Represents {persona.cluster_size} people
                  </span>
                </div>
              )}
              {persona.confidence_score && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
                  <Shield className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-primary-700">
                    {Math.round(persona.confidence_score * 100)}% confidence
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      {isVCPQPersona && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {isVCPQPersona ? (
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Personality Summary */}
              <Section title="Personality Snapshot" icon={Brain} color="bg-purple-100">
                <div className="space-y-3">
                  {Object.entries(vectors).slice(0, 6).map(([key, value]) => (
                    <VectorBar key={key} vectorKey={key} value={value} />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('personality')}
                  className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  View full personality profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Section>

              {/* Key Motivations */}
              {insights && (
                <Section title="What Drives Them" icon={Target} color="bg-green-100">
                  <ul className="space-y-2">
                    {insights.motivations.map((motivation, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{motivation}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'personality' && (
            <div className="grid grid-cols-1 gap-6">
              <Section title="Personality Vectors" icon={Brain} color="bg-purple-100">
                <div className="space-y-4">
                  {Object.entries(vectors).map(([key, value]) => (
                    <VectorBar key={key} vectorKey={key} value={value} />
                  ))}
                </div>
              </Section>

              {vectorProfile.domain_context && (
                <Section title="Domain Context" icon={Briefcase} color="bg-blue-100">
                  <div className="space-y-3">
                    <p><strong>Domain:</strong> {vectorProfile.domain_context.domain}</p>
                    <p className="text-gray-600">{vectorProfile.domain_context.contextual_notes}</p>
                  </div>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'communication' && insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Communication Style" icon={MessageSquare} color="bg-blue-100">
                <ul className="space-y-2">
                  {insights.communicationStyle.map((style, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{style}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Learning Style" icon={BookOpen} color="bg-indigo-100">
                <ul className="space-y-2">
                  {insights.learningStyle.map((style, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{style}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <div className="lg:col-span-2">
                <div className="card p-6 bg-primary-50 border-primary-100">
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">
                    How to Communicate with {persona.name}
                  </h3>
                  <p className="text-primary-800">
                    {vectors.directness > 0
                      ? `Be direct and get to the point quickly. ${persona.name} appreciates clarity and honesty.`
                      : `Use a diplomatic approach. ${persona.name} values tact and considers feelings important.`
                    }
                    {vectors.verbosity > 0
                      ? ` Provide detailed context and thorough explanations.`
                      : ` Keep it brief and focus on key points.`
                    }
                    {vectors.formality > 0
                      ? ` Maintain a professional tone.`
                      : ` A casual, friendly approach works well.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Strengths" icon={TrendingUp} color="bg-green-100">
                <ul className="space-y-2">
                  {insights.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Areas for Growth" icon={TrendingDown} color="bg-orange-100">
                <ul className="space-y-2">
                  {insights.challenges.map((challenge, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}
        </div>
      ) : (
        /* Legacy format display */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Profile */}
          <div className="space-y-6">
            {/* Communication style */}
            {summary.communication_style && (
              <Section title="Communication Style" icon={MessageSquare} color="bg-blue-100">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Preferred</p>
                    <p className="font-medium text-gray-900">
                      {summary.communication_style.preferred}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Tone</p>
                    <p className="font-medium text-gray-900">
                      {summary.communication_style.tone}
                    </p>
                  </div>
                  {summary.communication_style.details && (
                    <p className="text-gray-600 text-sm">
                      {summary.communication_style.details}
                    </p>
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key traits */}
            {summary.key_traits && summary.key_traits.length > 0 && (
              <Section title="Key Traits" icon={Zap} color="bg-yellow-100">
                <div className="flex flex-wrap gap-2">
                  {summary.key_traits.map((trait, i) => (
                    <TraitBadge
                      key={trait}
                      trait={trait}
                      color={
                        i % 3 === 0
                          ? 'bg-primary-100 text-primary-700'
                          : i % 3 === 1
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                      }
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Values */}
            {summary.values && summary.values.length > 0 && (
              <Section title="Core Values" icon={Heart} color="bg-pink-100">
                <div className="flex flex-wrap gap-2">
                  {summary.values.map((value) => (
                    <TraitBadge
                      key={value}
                      trait={value}
                      color="bg-pink-50 text-pink-700 border border-pink-200"
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Motivations */}
            {summary.motivations && summary.motivations.length > 0 && (
              <Section title="Motivations" icon={Target} color="bg-green-100">
                <ul className="space-y-2">
                  {summary.motivations.map((motivation) => (
                    <li key={motivation} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{motivation}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Pain points */}
            {summary.pain_points && summary.pain_points.length > 0 && (
              <Section title="Pain Points" icon={AlertTriangle} color="bg-orange-100">
                <ul className="space-y-2">
                  {summary.pain_points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Background story */}
            {extended.background_story && (
              <Section title="Background" icon={Users} color="bg-gray-100">
                <p className="text-gray-700 leading-relaxed">
                  {extended.background_story}
                </p>
              </Section>
            )}

            {/* Conversation guidelines */}
            {extended.conversation_guidelines && (
              <div className="card p-6 bg-primary-50 border-primary-100">
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  How to Communicate with {persona.name}
                </h3>
                <p className="text-primary-800">
                  {extended.conversation_guidelines}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaDetailPage;
