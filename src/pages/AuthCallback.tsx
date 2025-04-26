import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

function AuthCallback() {
  const navigate = useNavigate();
  const { setShowAuthModal } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('Processing auth callback');
        
        // Get the URL parameters
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        
        if (type === 'recovery') {
          // For password reset, show the auth modal in reset mode
          setShowAuthModal(true);
          navigate('/', { replace: true });
          return;
        }

        // Handle email confirmation and other auth callbacks
        const { error } = await supabase.auth.getSessionFromUrl();
        
        if (error) {
          console.error('Error in auth callback:', error);
          alert('There was an error signing in. Please try again.');
        } else {
          alert('Successfully signed in! You can now start solving puzzles.');
        }

        // Always redirect back to the main app
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
    <div className="min-h-screen flex items-center justify-center bg-[--color-background]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-700">Processing...</h1>
        <p className="text-gray-500 mt-2">Please wait while we complete your request.</p>
      </div>
    </div>
  );
}

export default AuthCallback;