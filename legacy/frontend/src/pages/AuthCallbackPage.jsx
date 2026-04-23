import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (accessToken && refreshToken) {
      handleOAuthCallback(accessToken, refreshToken);
      navigate('/dashboard');
    } else {
      navigate('/login?error=missing_tokens');
    }
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      <p className="mt-4 text-gray-600">Completing sign in...</p>
    </div>
  );
};

export default AuthCallbackPage;
