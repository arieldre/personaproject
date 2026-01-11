import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { companiesAPI, personasAPI } from '../services/api';
import {
  Users,
  MessageSquare,
  FileQuestion,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Search,
  Plus,
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.company?.id) {
          const [statsRes, personasRes] = await Promise.all([
            companiesAPI.getStats(user.company.id),
            personasAPI.list({ companyId: user.company.id }),
          ]);
          setStats(statsRes.data);
          setPersonas(personasRes.data.personas.slice(0, 3));
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
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {loading ? (
              <span className="skeleton w-16 h-8 inline-block" />
            ) : (
              value ?? '0'
            )}
          </p>
          {subtext && (
            <p className="mt-1 text-sm text-gray-500">{subtext}</p>
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
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {persona.name}
        </h3>
        <p className="text-sm text-gray-500 truncate">{persona.tagline}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
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
          value={stats?.total_conversations}
          icon={MessageSquare}
          color="bg-green-600"
          subtext={stats?.conversations_this_week ? `${stats.conversations_this_week} this week` : null}
        />
        {isAdmin() && (
          <>
            <StatCard
              title="Questionnaires"
              value={stats?.total_questionnaires}
              icon={FileQuestion}
              color="bg-blue-600"
              subtext={stats?.active_questionnaires ? `${stats.active_questionnaires} active` : null}
            />
            <StatCard
              title="Team Members"
              value={stats?.total_users}
              icon={TrendingUp}
              color="bg-purple-600"
              subtext={stats?.active_users ? `${stats.active_users} active` : null}
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personas section */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Personas</h2>
              <Link
                to="/personas"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
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
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No personas yet</p>
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
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                Find My Persona
              </h3>
              <p className="text-gray-500">
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
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  Start a Conversation
                </h3>
                <p className="text-gray-500">
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
                <div className="p-3 rounded-xl bg-gray-100">
                  <Sparkles className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.company.name}</h3>
                  <p className="text-sm text-gray-500">
                    {user.company.licensesUsed} / {user.company.licenseCount} seats used
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (user.company.licensesUsed / user.company.licenseCount) * 100,
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
