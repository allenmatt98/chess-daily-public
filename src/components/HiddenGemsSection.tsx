import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedArticles, Article } from '../lib/articlesService';


interface HiddenGemsSectionProps {
  className?: string;
}

export function HiddenGemsSection({ className = '' }: HiddenGemsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load featured articles on component mount
  useEffect(() => {
    async function loadFeaturedArticles() {
      try {
        setLoading(true);
        const featuredArticles = await getFeaturedArticles(6);
        setArticles(featuredArticles);
      } catch (error) {
        console.error('Error loading featured articles:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedArticles();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(articles.length / 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, articles.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.ceil(articles.length / 3) - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(articles.length / 3));
  };

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Get visible articles for current slide
  const getVisibleArticles = () => {
    const startIndex = currentIndex * 3;
    return articles.slice(startIndex, startIndex + 3);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className={`card p-4 sm:p-6 lg:p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className={`card p-4 sm:p-6 lg:p-8 ${className}`}>
        <div className="text-center py-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Hidden Gems from the Chess World
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            No articles available at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={`card p-4 sm:p-6 lg:p-8 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Hidden Gems from the Chess World"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--color-text)' }}>
            Hidden Gems from the Chess World
          </h2>
          <p className="text-xs sm:text-sm lg:text-base" style={{ color: 'var(--color-text-muted)' }}>
            Discover fascinating stories, secrets, and legends from chess history
          </p>
        </div>
        {/* Removed Ad Space Placeholder */}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows - Desktop */}
        <button
          onClick={goToPrevious}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 z-20 w-10 h-10 items-center justify-center rounded-full shadow-xl bg-white/80 backdrop-blur-md border border-gray-300 transition-all duration-200 hover:scale-110"
          style={{ 
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)'
          }}
          aria-label="Previous articles"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 z-20 w-10 h-10 items-center justify-center rounded-full shadow-xl bg-white/80 backdrop-blur-md border border-gray-300 transition-all duration-200 hover:scale-110"
          style={{ 
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)'
          }}
          aria-label="Next articles"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Content */}
        <div
          ref={carouselRef}
          className="overflow-hidden rounded-lg"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {Array.from({ length: Math.ceil(articles.length / 3) }).map((_, slideIndex) => (
              <div key={slideIndex} className="w-full flex-shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {articles.slice(slideIndex * 3, slideIndex * 3 + 3).map((article) => (
                    <article
                      key={article.id}
                      className="group cursor-pointer transition-all duration-300 hover:scale-105"
                      onClick={() => navigate(`/articles/${article.slug}`)}
                    >
                      <div className="card p-3 sm:p-4 h-full flex flex-col">
                        {/* Thumbnail */}
                        <div className="relative mb-3 sm:mb-4 overflow-hidden rounded-lg">
                          <img
                            src={article.thumbnail_url}
                            alt={article.title}
                            className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                            {article.read_time_minutes} min read
                          </div>
                          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            {article.category_name}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col">
                          <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-green-400 transition-colors duration-200" style={{ color: 'var(--color-text)' }}>
                            {article.title}
                          </h3>
                          
                          <p className="text-xs sm:text-sm mb-3 sm:mb-4 flex-1 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                            {truncateText(article.excerpt, 120)}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                            {article.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs transition-colors duration-200 hover:bg-green-500 hover:text-white cursor-pointer"
                                style={{ 
                                  backgroundColor: 'var(--color-border)', 
                                  color: 'var(--color-text-muted)' 
                                }}
                              >
                                <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Date */}
                          <div className="mt-auto">
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {formatDate(article.published_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center mt-4 sm:mt-6 md:hidden">
          {Array.from({ length: Math.ceil(articles.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full mx-1 transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* View All Articles Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => navigate('/articles')}
          className="btn-primary px-6 py-3 text-sm sm:text-base font-semibold"
        >
          View All Articles
        </button>
      </div>
    </section>
  );
}