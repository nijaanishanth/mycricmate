import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        await loginWithGoogle(code, redirectUri);
        
        // Check if user needs onboarding
        // This will be determined by checking if they have roles/city set
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to complete Google login:', err);
        navigate('/login?error=google_auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
