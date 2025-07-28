import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, Share2, BookOpen, Calendar } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { getArticleBySlug, Article } from '../lib/articlesService';


export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const articleData = await getArticleBySlug(slug);
        setArticle(articleData);
      } catch (error) {
        console.error('Error loading article:', error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadArticle();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to copying URL to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
        <Header
          onHowToPlay={() => {}}
          onSignIn={() => {}}
          onSignOut={() => { useAuthStore.getState().signOut(); }}
          onLogoClick={() => navigate('/')}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
        <Header
          onHowToPlay={() => {}}
          onSignIn={() => {}}
          onSignOut={() => { useAuthStore.getState().signOut(); }}
          onLogoClick={() => navigate('/')}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Article Not Found
            </h1>
            <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
              The article you're looking for doesn't exist or has been moved.
            </p>
            <button
              onClick={() => navigate('/articles')}
              className="btn-primary"
            >
              Browse All Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
      <Header
        onHowToPlay={() => {}}
        onSignIn={() => {}}
        onSignOut={() => { useAuthStore.getState().signOut(); }}
        onLogoClick={() => navigate('/')}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={article.thumbnail_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Navigation Overlay */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm text-white/80">
              <button
                onClick={() => navigate('/')}
                className="hover:text-white transition-colors duration-200"
              >
                Home
              </button>
              <span>/</span>
              <button
                onClick={() => navigate('/articles')}
                className="hover:text-white transition-colors duration-200"
              >
                Articles
              </button>
              <span>/</span>
              <span className="text-white">{article.category_name}</span>
            </nav>

            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all duration-200"
              aria-label="Share article"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Article Meta */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-white/80">
              <span 
                className="px-2 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: article.category_color }}
              >
                {article.category_name}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.read_time_minutes} min read
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.published_at)}
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Article Body */}
              <div 
                className="prose prose-lg max-w-none custom-prose"
                style={{ color: 'var(--color-text)' }}
                dangerouslySetInnerHTML={{ __html: article.content || article.excerpt }}
              />

              {/* Tags */}
              <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors duration-200 hover:bg-green-500 hover:text-white cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--color-border)', 
                        color: 'var(--color-text-muted)' 
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Author Bio */}
              <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-start gap-4">
                  <img
                    src={article.author_avatar_url}
                    alt={article.author_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      {article.author_name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {article.author_bio}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Table of Contents (if needed) */}
              <div className="card p-4 mb-6">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleShare}
                    className="w-full btn-secondary text-sm flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Article
                  </button>
                  <button
                    onClick={() => navigate('/articles')}
                    className="w-full btn-secondary text-sm flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    More Articles
                  </button>
                </div>
              </div>

              {/* Reading Progress */}
              <div className="card p-4">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Article Info
                </h3>
                <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {article.read_time_minutes} min read
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.published_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {article.tags.length} tags
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}