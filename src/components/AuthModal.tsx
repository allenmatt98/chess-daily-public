import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword } = useAuthStore();

  if (!isOpen) return null;

  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'At least 1 uppercase letter' },
      { met: /[0-9]/.test(password), text: 'At least 1 number' },
      { met: /[!@#$%^&*]/.test(password), text: 'At least 1 special character' }
    ];

    return requirements;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setConfirmationSent(false);

    try {
      switch (mode) {
        case 'signin':
          await signIn(email, password);
          onClose();
          break;

        case 'signup':
          const { confirmationSent } = await signUp(email, password);
          if (confirmationSent) {
            setConfirmationSent(true);
            setEmail('');
            setPassword('');
          }
          break;

        case 'forgot':
          await resetPassword(email);
          setSuccess('Password reset instructions have been sent to your email.');
          setEmail('');
          break;

        case 'reset':
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
          }
          await updatePassword(password);
          setSuccess('Password has been successfully reset. Please sign in.');
          setTimeout(() => {
            setMode('signin');
            setPassword('');
            setConfirmPassword('');
          }, 2000);
          break;
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const passwordRequirements = validatePassword(password);
  const showPasswordRequirements = (mode === 'signup' || mode === 'reset') && password.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 relative animate-[scale-up_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {mode !== 'signin' && (
          <button
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccess('');
            }}
            className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <h2 className="text-2xl font-bold mb-6">
          {mode === 'signin' && 'Sign In'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'forgot' && 'Reset Password'}
          {mode === 'reset' && 'Set New Password'}
        </h2>

        {confirmationSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Check your email</h3>
                <p className="text-sm text-green-700 mt-1">
                  We've sent a confirmation link to {email}. Please check your email and click the link to activate your account.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  required
                />
              </div>
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  required
                />
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  required
                />
              </div>
            )}

            {showPasswordRequirements && (
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-700">Password requirements:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2 ${
                        req.met ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      <span className="w-4 h-4">
                        {req.met ? '✓' : '•'}
                      </span>
                      {req.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-90 transition-colors"
            >
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Instructions'}
              {mode === 'reset' && 'Reset Password'}
            </button>

            {mode === 'signin' && (
              <div className="space-y-2 text-sm text-center">
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                    className="text-primary hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
                <p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                    className="text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}