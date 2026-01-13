import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { companiesAPI, personasAPI } from '../services/api';
import CreateCompanyModal from '../components/common/CreateCompanyModal';
import {
  Users,
  MessageSquare,
  FileQuestion,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Search,
  Plus,
  Building2,
  BarChart3,
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [engagementStats, setEngagementStats] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.company?.id) {
          const [statsRes, personasRes, engagementRes] = await Promise.all([
            companiesAPI.getStats(user.company.id),
            personasAPI.list({ companyId: user.company.id }),
            personasAPI.getEngagementStats(),
          ]);
          setStats(statsRes.data);
          setPersonas(personasRes.data.personas.slice(0, 3));
          setEngagementStats(engagementRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.company?.id]);

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? (
              <span className="skeleton w-16 h-8 inline-block" />
            ) : (
              value ?? '0'
            )}
          </p>
          {subtext && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtext}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const PersonaCard = ({ persona }) => (
    <Link
      to={`/personas/${persona.id}`}
      className="card-hover p-4 flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
        {persona.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
          {persona.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{persona.tagline}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
    </Link>
  );

  // Show create company prompt if user has no company
  if (!user?.company && !loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Persona Platform!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            To get started, create your company. You'll be able to invite team members,
            create questionnaires, and generate AI personas.
          </p>
          <button
            onClick={() => setShowCreateCompanyModal(true)}
            className="btn-primary btn-lg"
          >
            <Building2 className="w-5 h-5 mr-2" />
            Create Your Company
          </button>
        </div>

        <CreateCompanyModal
          isOpen={showCreateCompanyModal}
          onClose={() => setShowCreateCompanyModal(false)}
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your team personas
          </p>
        </div>
        {isAdmin() && (
          <Link to="/questionnaires" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Questionnaire
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Personas"
          value={stats?.active_personas}
          icon={Users}
          color="bg-primary-600"
        />
        <StatCard
          title="Total Conversations"
          value={engagementStats?.totalConversations}
          icon={MessageSquare}
          color="bg-green-600"
          subtext={engagementStats?.recentActivity?.conversationsThisWeek ? `${engagementStats.recentActivity.conversationsThisWeek} this week` : null}
        />
        <StatCard
          title="Total Messages"
          value={engagementStats?.totalMessages}
          icon={BarChart3}
          color="bg-blue-600"
          subtext={engagementStats?.avgMessagesPerConversation ? `${engagementStats.avgMessagesPerConversation} avg/convo` : null}
        />
        {isAdmin() && (
          <StatCard
            title="Questionnaires"
            value={stats?.total_questionnaires}
            icon={FileQuestion}
            color="bg-purple-600"
            subtext={stats?.active_questionnaires ? `${stats.active_questionnaires} active` : null}
          />
        )}
      </div>

      {/* Engagement & Top Personas */}
      {engagementStats?.topPersonas?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Most Active Personas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {engagementStats.topPersonas.map((persona) => (
              <Link
                key={persona.id}
                to={`/personas/${persona.id}`}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold mb-2">
                  {persona.name[0]}
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{persona.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {persona.conversation_count} conversations
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personas section */}
        <div className="card">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Personas</h2>
              <Link
                to="/personas"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="skeleton-avatar" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-text w-24" />
                    <div className="skeleton-text w-40" />
                  </div>
                </div>
              ))
            ) : personas.length > 0 ? (
              personas.map((persona) => (
                <PersonaCard key={persona.id} persona={persona} />
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No personas yet</p>
                {isAdmin() && (
                  <Link
                    to="/questionnaires"
                    className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Create a questionnaire to generate personas
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions section */}
        <div className="space-y-4">
          {/* Find similar persona card */}
          <Link
            to="/find-persona"
            className="card-hover p-6 flex items-center gap-4 group"
          >
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                Find My Persona
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Describe yourself and find the persona that matches you best
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Chat with persona card */}
          {personas.length > 0 && (
            <Link
              to={`/personas/${personas[0]?.id}/chat`}
              className="card-hover p-6 flex items-center gap-4 group"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  Start a Conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Practice communication with {personas[0]?.name}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
            </Link>
          )}

          {/* Company info */}
          {user?.company && (
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
                  <Sparkles className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{user.company.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.company.licensesUsed || 0} / {user.company.licenseCount || 5} seats used
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((user.company.licensesUsed || 0) / (user.company.licenseCount || 5)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
