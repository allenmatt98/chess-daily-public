import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Puzzles
        </Link>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using Daily Chess Puzzle, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. You agree to notify us immediately of any unauthorized access or use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Use automated methods to solve puzzles</li>
                <li>Share solutions or hints with other users</li>
                <li>Attempt to manipulate ratings or statistics</li>
                <li>Use the service for any unlawful purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Intellectual Property</h2>
              <p className="text-gray-700">
                The service and its original content, features, and functionality are owned by Daily Chess Puzzle and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Termination</h2>
              <p className="text-gray-700">
                We may terminate or suspend your account and access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms, please contact us at{' '}
                <a href="mailto:support@chess-daily.com" className="text-blue-600 hover:text-blue-800">
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