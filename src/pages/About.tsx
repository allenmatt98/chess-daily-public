import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, ArrowLeft } from 'lucide-react';

function About() {
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
        
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About Daily Chess Puzzle</h1>
          <p className="text-lg text-gray-700 mb-6">
            Daily Chess Puzzle is a platform designed to help chess enthusiasts improve their tactical skills through carefully curated daily challenges. Each puzzle is selected to provide a unique learning opportunity, helping players develop pattern recognition and strategic thinking.
          </p>
          <p className="text-lg text-gray-700">
            The platform features a rating system that adapts to your skill level, providing an engaging and personalized learning experience. Track your progress, maintain your streak, and compete with others to become a better chess player.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About the Creator</h2>
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Allen Matthew George is a software engineer turned product manager with a passion for creating impactful digital experiences. With a strong technical background and product-focused mindset, he bridges the gap between user needs and technical solutions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="mailto:allenmatthewgeorge@gmail.com"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email Me
              </a>
              <a
                href="https://www.linkedin.com/in/allen-matthew-george-a936aa153/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Linkedin className="w-5 h-5 mr-2" />
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;