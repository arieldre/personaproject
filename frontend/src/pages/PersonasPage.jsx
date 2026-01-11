import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { personasAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  Users,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  ChevronRight,
} from 'lucide-react';

const PersonasPage = () => {
  const { user } = useAuthStore();
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await personasAPI.list({
          companyId: user?.company?.id,
          status: statusFilter,
        });
        setPersonas(response.data.personas);
      } catch (error) {
        console.error('Failed to fetch personas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company?.id) {
      fetchPersonas();
    }
  }, [user?.company?.id, statusFilter]);

  const filteredPersonas = personas.filter((persona) =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    persona.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTraitColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-yellow-100 text-yellow-700',
      'bg-pink-100 text-pink-700',
    ];
    return colors[index % colors.length];
  };

  const PersonaCard = ({ persona }) => (
    <Link
      to={`/personas/${persona.id}`}
      className="card-hover p-6 group animate-fade-in"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {persona.name[0]}
          </div>
          {persona.confidence_score && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">
                {Math.round(persona.confidence_score * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {persona.name}
            </h3>
            {persona.cluster_size && (
              <span className="badge-gray text-xs">
                {persona.cluster_size} people
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1 line-clamp-2">{persona.tagline}</p>

          {/* Demographics */}
          {persona.summary?.demographics && (
            <p className="text-xs text-gray-400 mt-1">
              {[
                persona.summary.demographics.job_title,
                persona.summary.demographics.region,
                persona.summary.demographics.age_range
              ].filter(Boolean).join(' • ')}
            </p>
          )}

          {/* Traits */}
          {persona.summary?.key_traits && (
            <div className="flex flex-wrap gap-2 mt-3">
              {persona.summary.key_traits.slice(0, 3).map((trait, index) => (
                <span
                  key={trait}
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${getTraitColor(index)}`}
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
        <Link
          to={`/personas/${persona.id}/chat`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Start chat
        </Link>
        <span className="text-gray-300">•</span>
        <span className="text-sm text-gray-500">
          {persona.summary?.communication_style?.preferred || 'Professional'} communicator
        </span>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-1">
            AI-generated personas representing your team's communication styles
          </p>
        </div>
        <Link to="/find-persona" className="btn-primary">
          <Search className="w-4 h-4 mr-2" />
          Find My Persona
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search personas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Personas grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredPersonas.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPersonas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No personas found' : 'No personas yet'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Personas will appear here once they are generated from questionnaire responses'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonasPage;
