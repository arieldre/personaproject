import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questionnairesAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  Plus,
  FileQuestion,
  Search,
  Loader2,
  Copy,
  ExternalLink,
  MoreVertical,
  Trash2,
  Play,
  Pause,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionnairesPage = () => {
  const { user } = useAuthStore();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchQuestionnaires();
  }, [user?.company?.id, statusFilter]);

  const fetchQuestionnaires = async () => {
    try {
      const response = await questionnairesAPI.list({
        companyId: user?.company?.id,
        status: statusFilter || undefined,
      });
      setQuestionnaires(response.data || []);
    } catch (error) {
      console.error('Failed to fetch questionnaires:', error);
      toast.error('Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const copyAccessLink = (code) => {
    const link = `${window.location.origin}/q/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await questionnairesAPI.update(id, { status: newStatus });
      setQuestionnaires((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      );
      toast.success(`Questionnaire ${newStatus === 'active' ? 'activated' : 'closed'}`);
    } catch (error) {
      toast.error('Failed to update questionnaire');
    }
  };

  const deleteQuestionnaire = async (id) => {
    if (!confirm('Are you sure you want to delete this questionnaire? This action cannot be undone.')) {
      return;
    }
    try {
      await questionnairesAPI.delete(id);
      setQuestionnaires((prev) => prev.filter((q) => q.id !== id));
      toast.success('Questionnaire deleted');
    } catch (error) {
      toast.error('Failed to delete questionnaire');
    }
  };

  const filteredQuestionnaires = questionnaires.filter((q) =>
    (q.title || q.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      active: 'badge-success',
      closed: 'badge-warning',
    };
    return badges[status] || 'badge-gray';
  };

  const QuestionnaireCard = ({ questionnaire }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
      <div className="card p-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {questionnaire.title || questionnaire.name}
              </h3>
              <span className={getStatusBadge(questionnaire.status)}>
                {questionnaire.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm line-clamp-2">
              {questionnaire.description || 'No description'}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{questionnaire.completed_responses || 0} responses</span>
              </div>
              {questionnaire.access_code && (
                <button
                  onClick={() => copyAccessLink(questionnaire.access_code)}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy link</span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Link
                to={`/questionnaires/${questionnaire.id}`}
                className="btn-outline btn-sm"
              >
                View Details
              </Link>
              {questionnaire.status === 'active' && (
                <a
                  href={`/q/${questionnaire.access_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Preview
                </a>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      toggleStatus(questionnaire.id, questionnaire.status);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {questionnaire.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Close questionnaire
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      deleteQuestionnaire(questionnaire.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-gray-600 mt-1">
            Create and manage questionnaires to gather team insights
          </p>
        </div>
        <Link to="/questionnaires/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Questionnaire
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questionnaires..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Questionnaires list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredQuestionnaires.length > 0 ? (
        <div className="space-y-4">
          {filteredQuestionnaires.map((questionnaire) => (
            <QuestionnaireCard key={questionnaire.id} questionnaire={questionnaire} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No questionnaires found' : 'No questionnaires yet'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create a questionnaire to start gathering insights from your team'}
          </p>
          {!searchQuery && (
            <Link to="/questionnaires/new" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Questionnaire
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionnairesPage;


