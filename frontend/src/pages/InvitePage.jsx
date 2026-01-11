import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    authAPI.validateInvite(token)
      .then((response) => {
        setInviteInfo(response.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Invalid invitation');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Persona</span>
          </div>

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          
          <p className="text-gray-600 mb-6">
            <span className="font-semibold">{inviteInfo.inviterName}</span> has invited you to join{' '}
            <span className="font-semibold">{inviteInfo.companyName}</span> as a{' '}
            <span className="capitalize">{inviteInfo.role.replace('_', ' ')}</span>.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Invited email</p>
            <p className="font-medium text-gray-900">{inviteInfo.email}</p>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-3"
            >
              Go to Dashboard
            </button>
          ) : (
            <div className="space-y-3">
              <Link
                to={`/register?invite=${token}`}
                className="btn-primary w-full py-3 block"
              >
                Create Account
              </Link>
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400">
            Invitation expires on {new Date(inviteInfo.expiresAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
