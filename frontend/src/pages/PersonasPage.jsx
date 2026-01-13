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
      className="card-hover p-4 group animate-fade-in flex flex-col"
    >
      {/* Header with avatar and name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
          {persona.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
              {persona.name}
            </h3>
          </div>
          {persona.cluster_size && (
            <span className="badge-primary text-xs">
              {persona.cluster_size} people
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>

      {/* Tagline */}
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
        {persona.tagline}
      </p>

      {/* Demographics */}
      {persona.summary?.demographics && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-2">
          {[
            persona.summary.demographics.job_title,
            persona.summary.demographics.age_range
          ].filter(Boolean).join(' • ')}
        </p>
      )}

      {/* Quick action */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
        <Link
          to={`/personas/${persona.id}/chat`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </Link>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPersonas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No personas found' : 'No personas yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
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
