import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';

function AuthCallback() {
  const navigate = useNavigate();
  const { setShowAuthModal } = useAuthStore();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('Processing auth callback');
        
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        
        if (type === 'recovery') {
          setShowAuthModal(true);
          navigate('/', { replace: true });
          return;
        }

        const { error } = await supabase.auth.getSessionFromUrl();
        
        if (error) {
          console.error('Error in auth callback:', error);
          alert('There was an error signing in. Please try again.');
        } else {
          alert('Successfully signed in! You can now start solving puzzles.');
        }

        navigate('/', { replace: true });
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        alert('An unexpected error occurred. Please try again.');
        navigate('/', { replace: true });
      }
    }

    handleCallback();
  }, [navigate, setShowAuthModal]);

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Processing...</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>Please wait while we complete your request.</p>
      </div>
    </div>
  );
}

export default AuthCallback;