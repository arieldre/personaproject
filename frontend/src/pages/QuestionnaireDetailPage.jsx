import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { questionnairesAPI } from '../services/api';
import {
  ArrowLeft,
  Loader2,
  Users,
  Copy,
  ExternalLink,
  Sparkles,
  Play,
  Pause,
  Trash2,
  FileText,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionnaireDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingPersonas, setDeletingPersonas] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionnaireRes, responsesRes] = await Promise.all([
          questionnairesAPI.get(id),
          questionnairesAPI.getResponses(id),
        ]);
        setQuestionnaire(questionnaireRes.data);
        setResponses(responsesRes.data.responses);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load questionnaire');
        navigate('/questionnaires');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const copyAccessLink = () => {
    const link = `${window.location.origin}/q/${questionnaire.access_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const toggleStatus = async () => {
    const newStatus = questionnaire.status === 'active' ? 'closed' : 'active';
    try {
      const response = await questionnairesAPI.update(id, { status: newStatus });
      setQuestionnaire(response.data);
      toast.success(`Questionnaire ${newStatus === 'active' ? 'activated' : 'closed'}`);
    } catch (error) {
      toast.error('Failed to update questionnaire');
    }
  };

  const generatePersonas = async () => {
    if (responses.filter(r => r.status === 'completed').length < 5) {
      toast.error('Need at least 5 completed responses to generate personas');
      return;
    }

    setGenerating(true);
    try {
      const response = await questionnairesAPI.generatePersonas(id);
      toast.success(`Generated ${response.data.personas.length} personas!`);
      navigate('/personas');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate personas');
    } finally {
      setGenerating(false);
    }
  };

  const deleteQuestionnaire = async () => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return;
    try {
      await questionnairesAPI.delete(id);
      toast.success('Questionnaire deleted');
      navigate('/questionnaires');
    } catch (error) {
      toast.error('Failed to delete questionnaire');
    }
  };

  const deleteAllPersonas = async () => {
    if (!confirm('Are you sure you want to delete ALL personas for this questionnaire? This cannot be undone.')) return;
    setDeletingPersonas(true);
    try {
      const response = await questionnairesAPI.deletePersonas(id);
      toast.success(`Deleted ${response.data.count} personas`);
    } catch (error) {
      toast.error('Failed to delete personas');
    } finally {
      setDeletingPersonas(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!questionnaire) return null;

  const completedResponses = responses.filter(r => r.status === 'completed').length;

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      active: 'badge-success',
      closed: 'badge-warning',
    };
    return badges[status] || 'badge-gray';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/questionnaires"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{questionnaire.name}</h1>
            <span className={getStatusBadge(questionnaire.status)}>
              {questionnaire.status}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            {questionnaire.description || 'No description'}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedResponses}</p>
              <p className="text-sm text-gray-500">Completed responses</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {questionnaire.questions?.length || 0}
              </p>
              <p className="text-sm text-gray-500">Questions</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-2">Access Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
              {questionnaire.access_code}
            </code>
            <button
              onClick={copyAccessLink}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Copy link"
            >
              <Copy className="w-5 h-5 text-gray-500" />
            </button>
            {questionnaire.status === 'active' && (
              <a
                href={`/q/${questionnaire.access_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Open questionnaire"
              >
                <ExternalLink className="w-5 h-5 text-gray-500" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleStatus}
          className={`btn-outline ${
            questionnaire.status === 'active'
              ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
              : 'text-green-600 border-green-300 hover:bg-green-50'
          }`}
        >
          {questionnaire.status === 'active' ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Close Questionnaire
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </button>

        <button
          onClick={generatePersonas}
          disabled={generating || completedResponses < 5}
          className="btn-primary"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Personas
        </button>

        <button
          onClick={deleteAllPersonas}
          disabled={deletingPersonas}
          className="btn-outline text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          {deletingPersonas ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <UserX className="w-4 h-4 mr-2" />
          )}
          Delete All Personas
        </button>

        <button
          onClick={deleteQuestionnaire}
          className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </button>
      </div>

      {completedResponses < 5 && (
        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> You need at least 5 completed responses to generate personas.
            Currently: {completedResponses}/5
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['overview', 'responses', 'questions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Questionnaire Details</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-gray-900">
                {new Date(questionnaire.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Template</dt>
              <dd className="text-gray-900">
                {questionnaire.template_name || 'Custom'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Anonymous Responses</dt>
              <dd className="text-gray-900">
                {questionnaire.is_anonymous ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="card overflow-hidden">
          {responses.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Respondent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {responses.map((response) => (
                  <tr key={response.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {questionnaire.is_anonymous ? (
                        <span className="text-gray-500 italic">Anonymous</span>
                      ) : (
                        <span className="text-gray-900">
                          {response.respondent_email || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          response.status === 'completed'
                            ? 'badge-success'
                            : 'badge-warning'
                        }
                      >
                        {response.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {response.completed_at
                        ? new Date(response.completed_at).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No responses yet</p>
              {questionnaire.status === 'active' && (
                <button
                  onClick={copyAccessLink}
                  className="mt-4 btn-outline btn-sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy link to share
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questionnaire.questions?.map((q, index) => (
            <div key={q.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{q.question}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Type: {q.type} {q.required && '• Required'}
                  </p>
                  {q.options && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <span
                          key={opt}
                          className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionnaireDetailPage;
