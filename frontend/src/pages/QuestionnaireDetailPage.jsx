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
  Info,
  Settings,
  Eye,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle,
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

  // Generation settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [maxPersonas, setMaxPersonas] = useState(5);
  const [selectedDomain, setSelectedDomain] = useState('general');
  const [generateInsights, setGenerateInsights] = useState(true);

  // Cluster preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [clusterPreview, setClusterPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Generation stats state
  const [generationStats, setGenerationStats] = useState(null);

  const domains = [
    { value: 'general', label: 'General' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'legal', label: 'Legal' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'executive', label: 'Executive' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionnaireRes, responsesRes] = await Promise.all([
          questionnairesAPI.get(id),
          questionnairesAPI.getResponses(id),
        ]);
        setQuestionnaire(questionnaireRes.data);
        setResponses(Array.isArray(responsesRes.data) ? responsesRes.data : (responsesRes.data.responses || []));
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
    toast.success('Share link copied to clipboard!');
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

  const previewClusters = async () => {
    setLoadingPreview(true);
    try {
      const response = await questionnairesAPI.previewClusters(id, { maxPersonas });
      setClusterPreview(response.data);
      setShowPreviewModal(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to preview clusters');
    } finally {
      setLoadingPreview(false);
    }
  };

  const generatePersonas = async () => {
    if (responses.length < 5) {
      toast.error('Need at least 5 responses to generate personas');
      return;
    }
    setGenerating(true);
    setShowSettingsModal(false);
    try {
      const response = await questionnairesAPI.generatePersonas(id, {
        maxPersonas,
        domain: selectedDomain,
        generateInsights
      });
      setGenerationStats(response.data.generation_stats);
      toast.success(`Generated ${response.data.personas?.length || 0} personas with insights!`);
      // Show stats briefly then navigate
      setTimeout(() => navigate('/personas'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate personas');
    } finally {
      setGenerating(false);
    }
  };

  const deleteQuestionnaire = async () => {
    if (!confirm('Delete this questionnaire and all responses?')) return;
    try {
      await questionnairesAPI.delete(id);
      toast.success('Questionnaire deleted');
      navigate('/questionnaires');
    } catch (error) {
      toast.error('Failed to delete questionnaire');
    }
  };

  const deleteAllPersonas = async () => {
    if (!confirm('Delete ALL personas for this questionnaire? Raw responses will be preserved.')) return;
    setDeletingPersonas(true);
    try {
      await questionnairesAPI.deletePersonas(id);
      toast.success('Personas deleted. Responses preserved.');
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

  const responseCount = responses.length;
  const unprocessedCount = responses.filter(r => !r.processed).length;
  const canGeneratePersonas = unprocessedCount >= 3;
  const responsesNeeded = Math.max(0, 3 - unprocessedCount);

  const getStatusBadge = (status) => {
    const badges = { draft: 'badge-gray', active: 'badge-success', closed: 'badge-warning' };
    return badges[status] || 'badge-gray';
  };

  // Generation Settings Modal
  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            Generation Settings
          </h3>
          <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Max Personas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Personas: <span className="text-primary-600 font-bold">{maxPersonas}</span>
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={maxPersonas}
              onChange={(e) => setMaxPersonas(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fewer, broader</span>
              <span>More, specific</span>
            </div>
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Domain Context
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="input w-full"
            >
              {domains.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Tailors communication style and terminology to the selected domain
            </p>
          </div>

          {/* Generate Insights Toggle */}
          <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Generate Extended Insights</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Strengths, growth areas, learning style, compatibility</p>
            </div>
            <button
              onClick={() => setGenerateInsights(!generateInsights)}
              className={`w-12 h-6 rounded-full transition-colors ${generateInsights ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${generateInsights ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={previewClusters}
            disabled={loadingPreview}
            className="btn-outline flex-1"
          >
            {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Preview Clusters
          </button>
          <button
            onClick={generatePersonas}
            disabled={generating || !canGeneratePersonas}
            className="btn-primary flex-1"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate
          </button>
        </div>
      </div>
    </div>
  );

  // Cluster Preview Modal
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-600" />
            Cluster Preview
          </h3>
          <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {clusterPreview && (
            <>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Responses</span>
                  <span className="font-bold text-gray-900 dark:text-white">{clusterPreview.total_responses}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Suggested Clusters</span>
                  <span className="font-bold text-primary-600">{clusterPreview.suggested_clusters}</span>
                </div>
                {clusterPreview.recommendation && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-3 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {clusterPreview.recommendation}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {clusterPreview.clusters.map((cluster, i) => (
                  <div key={i} className="card p-4 border-l-4 border-primary-500">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 dark:text-white">Cluster {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{cluster.size} people ({cluster.percentage}%)</span>
                        {cluster.cohesion_score && (
                          <span className={`text-xs px-2 py-1 rounded-full ${cluster.cohesion_score > 0.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {Math.round(cluster.cohesion_score * 100)}% cohesion
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {cluster.dominant_traits.map((trait, j) => (
                        <span key={j} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${trait.direction === 'high' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {trait.direction === 'high' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {trait.trait}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cluster.demographic_snapshot.common_role} • {cluster.demographic_snapshot.common_department}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => { setShowPreviewModal(false); generatePersonas(); }} className="btn-primary w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate These Personas
          </button>
        </div>
      </div>
    </div>
  );

  // Generation Stats Display
  const StatsDisplay = () => generationStats && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personas Generated!</h3>

        <div className="grid grid-cols-2 gap-4 text-left mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">{generationStats.clusters_formed}</p>
            <p className="text-sm text-gray-500">Personas Created</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{generationStats.total_responses_processed}</p>
            <p className="text-sm text-gray-500">Responses Processed</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{(generationStats.processing_time_ms / 1000).toFixed(1)}s</p>
            <p className="text-sm text-gray-500">Processing Time</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{generationStats.domain_used}</p>
            <p className="text-sm text-gray-500">Domain</p>
          </div>
        </div>

        <p className="text-sm text-gray-500">Redirecting to personas...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {showSettingsModal && <SettingsModal />}
      {showPreviewModal && <PreviewModal />}
      {generationStats && <StatsDisplay />}

      <div className="flex items-center gap-4">
        <Link to="/questionnaires" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{questionnaire.name}</h1>
            <span className={getStatusBadge(questionnaire.status)}>{questionnaire.status}</span>
          </div>
          <p className="text-gray-600 mt-1">{questionnaire.description || 'No description'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100"><Users className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{responseCount}</p>
              <p className="text-sm text-gray-500">Total responses</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unprocessedCount}</p>
              <p className="text-sm text-gray-500">Ready to process</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100"><FileText className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{questionnaire.questions?.length || 0}</p>
              <p className="text-sm text-gray-500">VCPQ Questions</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-2">Share Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm truncate">{questionnaire.access_code}</code>
            <button onClick={copyAccessLink} className="p-2 rounded-lg hover:bg-gray-100" title="Copy share link"><Copy className="w-5 h-5 text-gray-500" /></button>
            {questionnaire.status === 'active' && (
              <a href={`/q/${questionnaire.access_code}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100" title="Open questionnaire">
                <ExternalLink className="w-5 h-5 text-gray-500" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={toggleStatus} className={`btn-outline ${questionnaire.status === 'active' ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50' : 'text-green-600 border-green-300 hover:bg-green-50'}`}>
          {questionnaire.status === 'active' ? <><Pause className="w-4 h-4 mr-2" />Close</> : <><Play className="w-4 h-4 mr-2" />Activate</>}
        </button>

        <div className="relative group">
          <button
            onClick={() => setShowSettingsModal(true)}
            disabled={generating || !canGeneratePersonas}
            className={`btn-primary ${!canGeneratePersonas ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Personas
          </button>
          {!canGeneratePersonas && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              <div className="flex items-center gap-2"><Info className="w-4 h-4" /><span>Need {responsesNeeded} more responses</span></div>
            </div>
          )}
        </div>

        <button onClick={deleteAllPersonas} disabled={deletingPersonas} className="btn-outline text-orange-600 border-orange-200 hover:bg-orange-50">
          {deletingPersonas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
          Delete Personas
        </button>
        <button onClick={deleteQuestionnaire} className="btn-outline text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-2" />Delete</button>
      </div>

      {!canGeneratePersonas && unprocessedCount > 0 && (
        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">{responsesNeeded} more response{responsesNeeded !== 1 ? 's' : ''} needed</p>
              <p className="text-yellow-700 text-sm mt-1">Minimum 3 unprocessed responses required for clustering. Current: {unprocessedCount}/3</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['overview', 'responses', 'questions'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}{tab === 'responses' && ` (${responseCount})`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-500">Created</dt><dd className="text-gray-900">{new Date(questionnaire.created_at).toLocaleDateString()}</dd></div>
            <div><dt className="text-sm text-gray-500">Template</dt><dd className="text-gray-900">{questionnaire.template_id ? 'Custom' : 'VCPQ (28 questions)'}</dd></div>
            <div><dt className="text-sm text-gray-500">Anonymous</dt><dd className="text-gray-900">{questionnaire.is_anonymous ? 'Yes' : 'No'}</dd></div>
          </dl>
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="card overflow-hidden">
          {responses.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {responses.map((r) => (
                  <tr key={r.id}><td className="px-6 py-4 font-mono text-sm">{r.id?.slice(0, 8)}...</td><td className="px-6 py-4"><span className={r.processed ? 'badge-success' : 'badge-warning'}>{r.processed ? 'Processed' : 'Pending'}</span></td><td className="px-6 py-4 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">No responses yet</p>{questionnaire.status === 'active' && <button onClick={copyAccessLink} className="mt-4 btn-outline btn-sm"><Copy className="w-4 h-4 mr-2" />Copy share link</button>}</div>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questionnaire.questions?.map((q) => (
            <div key={q.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center justify-center">{q.id}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{q.question}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{q.module}</span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">Meta: {q.meta_vector}</span>
                    {q.reversed && <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">Reversed</span>}
                  </div>
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