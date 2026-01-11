import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { personasAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Edit2,
  Trash2,
  Users,
  Target,
  Heart,
  AlertTriangle,
  Zap,
  MapPin,
  Briefcase,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PersonaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const summary = persona.summary || {};
  const extended = persona.extended_profile || {};

  const Section = ({ title, icon: Icon, children, color = 'bg-gray-100' }) => (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const TraitBadge = ({ trait, color }) => (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${color}`}>
      {trait}
    </span>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/personas"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{persona.name}</h1>
          <p className="text-gray-600">{persona.tagline}</p>
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
            Start Chat
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Profile */}
        <div className="space-y-6">
          {/* Avatar card */}
          <div className="card p-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
              {persona.name[0]}
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">{persona.name}</h2>
            <p className="text-gray-500">{persona.tagline}</p>
            
            {persona.cluster_size && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Represents {persona.cluster_size} people
                </span>
              </div>
            )}

            {persona.confidence_score && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Match confidence</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${persona.confidence_score * 100}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {Math.round(persona.confidence_score * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Demographics */}
          {summary.demographics && (
            <Section title="Demographics" icon={Users} color="bg-purple-100">
              <div className="space-y-3">
                {summary.demographics.age_range && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Age Range</p>
                      <p className="font-medium text-gray-900">{summary.demographics.age_range}</p>
                    </div>
                  </div>
                )}
                {summary.demographics.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Region</p>
                      <p className="font-medium text-gray-900">{summary.demographics.region}</p>
                    </div>
                  </div>
                )}
                {summary.demographics.job_title && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Job Title</p>
                      <p className="font-medium text-gray-900">{summary.demographics.job_title}</p>
                    </div>
                  </div>
                )}
                {summary.demographics.department && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Department</p>
                    <p className="font-medium text-gray-900">{summary.demographics.department}</p>
                  </div>
                )}
                {summary.demographics.experience_level && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Experience</p>
                    <p className="font-medium text-gray-900">{summary.demographics.experience_level}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

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
                💡 How to Communicate with {persona.name}
              </h3>
              <p className="text-primary-800">
                {extended.conversation_guidelines}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonaDetailPage;
