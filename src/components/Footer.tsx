import React from 'react';
import { Mail, Github, Twitter } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 border-t border-slate-700 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Daily Chess Puzzle</h3>
            <p className="text-sm text-slate-400">
              Improve your chess skills with our daily tactical challenges.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-sm text-slate-400 hover:text-green-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-sm text-slate-400 hover:text-green-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-slate-400 hover:text-green-400 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Contact</h3>
            <div className="space-y-2">
              <a
                href="mailto:support@chess-daily.com"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@chess-daily.com
              </a>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-green-400 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-green-400 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8">
          <p className="text-sm text-center text-slate-500">
            © {currentYear} Daily Chess Puzzle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}