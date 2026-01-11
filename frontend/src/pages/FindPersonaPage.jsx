import { useState } from 'react';
import { Link } from 'react-router-dom';
import { personasAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  Search,
  Loader2,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const FindPersonaPage = () => {
  const { user } = useAuthStore();
  const [description, setDescription] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      toast.error('Please provide a longer description (at least 10 characters)');
      return;
    }

    setLoading(true);
    try {
      const response = await personasAPI.findSimilar({
        description,
        companyId: user?.company?.id,
      });
      setResults(response.data.results);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to find similar personas');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const ResultCard = ({ result, index }) => (
    <div
      className="card p-6 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
          #{index + 1}
        </div>

        {/* Persona info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
              {result.persona?.name[0]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{result.persona?.name}</h3>
              <p className="text-sm text-gray-500">{result.persona?.tagline}</p>
            </div>
          </div>

          {/* Match score */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-2 py-1 rounded-lg text-sm font-medium ${getSimilarityColor(
                result.similarity_score
              )}`}
            >
              {Math.round(result.similarity_score * 100)}% match
            </span>
          </div>

          {/* Matching traits */}
          {result.matching_traits && result.matching_traits.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Matching Traits
              </p>
              <div className="flex flex-wrap gap-2">
                {result.matching_traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              to={`/personas/${result.persona?.id}`}
              className="btn-outline btn-sm"
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              to={`/personas/${result.persona?.id}/chat`}
              className="btn-primary btn-sm"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Find My Persona</h1>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          Describe yourself, your communication style, and work preferences.
          We'll find the persona that matches you best.
        </p>
      </div>

      {/* Search form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="label">
              Describe yourself
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I'm someone who prefers direct communication and values efficiency. I like to get straight to the point in meetings and appreciate when others do the same. I'm motivated by solving complex problems and learning new technologies. I can sometimes get frustrated by unclear requirements or too many unnecessary meetings..."
              rows={6}
              className="input resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Include details about your communication style, values, motivations,
              and what frustrates you at work.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || description.length < 10}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Finding matches...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Find Matching Personas
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {results.length > 0
              ? `Found ${results.length} matching persona${results.length > 1 ? 's' : ''}`
              : 'No matching personas found'}
          </h2>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => (
                <ResultCard key={result.persona_id} result={result} index={index} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-500">
                Try providing more details about your communication style and preferences.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {!results && (
        <div className="card p-6 bg-blue-50 border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3">
            💡 Tips for better matches
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Describe how you prefer to receive feedback</li>
            <li>• Mention your typical response to stress or conflict</li>
            <li>• Share what motivates you at work</li>
            <li>• Include your feelings about meetings and collaboration</li>
            <li>• Describe your decision-making style</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FindPersonaPage;
