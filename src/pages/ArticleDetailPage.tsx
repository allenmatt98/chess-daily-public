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
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between">
            <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-white/80">
              <button
                onClick={() => navigate('/')}
                className="hover:text-white transition-colors duration-200 truncate"
              >
                Home
              </button>
              <span className="hidden sm:inline">/</span>
              <button
                onClick={() => navigate('/articles')}
                className="hover:text-white transition-colors duration-200 truncate"
              >
                Articles
              </button>
              <span className="hidden sm:inline">/</span>
              <span className="text-white truncate">{article.category_name}</span>
            </nav>

            <button
              onClick={handleShare}
              className="p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all duration-200 flex-shrink-0"
              aria-label="Share article"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Article Meta */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Article Body */}
              <div 
                className="prose prose-sm sm:prose-base lg:prose-lg max-w-none custom-prose"
                style={{ color: 'var(--color-text)' }}
                dangerouslySetInnerHTML={{ __html: article.content || article.excerpt }}
              />

              {/* Tags */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: 'var(--color-text)' }}>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors duration-200 hover:bg-green-500 hover:text-white cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--color-border)', 
                        color: 'var(--color-text-muted)' 
                      }}
                    >
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Table of Contents (if needed) */}
              <div className="card p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>
                  Quick Actions
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <button
                    onClick={handleShare}
                    className="w-full btn-secondary text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Share Article
                  </button>
                  <button
                    onClick={() => navigate('/articles')}
                    className="w-full btn-secondary text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    More Articles
                  </button>
                </div>
              </div>

              {/* Reading Progress */}
              <div className="card p-3 sm:p-4">
                <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>
                  Article Info
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{article.read_time_minutes} min read</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{formatDate(article.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{article.tags.length} tags</span>
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