import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

function Terms() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center mb-8 transition-colors duration-200 hover:text-green-400"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Puzzles
        </Link>
        
        <div className="card p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-sm sm:text-base mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>1. Acceptance of Terms</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text)' }}>
                By accessing and using Daily Chess Puzzle, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>2. User Accounts</h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. You agree to notify us immediately of any unauthorized access or use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>3. Acceptable Use</h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                <li>Use automated methods to solve puzzles</li>
                <li>Share solutions or hints with other users</li>
                <li>Attempt to manipulate ratings or statistics</li>
                <li>Use the service for any unlawful purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>4. Intellectual Property</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text)' }}>
                The service and its original content, features, and functionality are owned by Daily Chess Puzzle and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>5. Termination</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text)' }}>
                We may terminate or suspend your account and access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>6. Contact</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text)' }}>
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:support@chess-daily.com" className="text-green-400 hover:text-green-300 transition-colors">
                  support@chess-daily.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;