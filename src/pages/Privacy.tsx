import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

function Privacy() {
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
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-sm sm:text-base mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Information We Collect</h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                <li>Email address when you create an account</li>
                <li>Puzzle solving statistics and progress</li>
                <li>Game performance and rating information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>How We Use Your Information</h2>
              <p className="mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                <li>Provide, maintain, and improve our services</li>
                <li>Track your progress and maintain your rating</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Data Security</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text)' }}>
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. Therefore, while we strive to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Contact Us</h2>
              <p className="leading-relaxed" style={{ color: 'var(--color-text)' }}>
                If you have any questions about this Privacy Policy, please contact us at{' '}
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

export default Privacy;