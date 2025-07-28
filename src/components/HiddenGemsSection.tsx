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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Hidden Gems from the Chess World
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-muted)' }}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {articles.slice(slideIndex * 3, slideIndex * 3 + 3).map((article) => (
                    <article
                      key={article.id}
                      className="group cursor-pointer transition-all duration-300 hover:scale-105"
                      onClick={() => navigate(`/articles/${article.slug}`)}
                    >
                      {/* Article Card */}
                      <div className="card p-4 h-full flex flex-col">
                        {/* Thumbnail */}
                        <div className="relative mb-4 overflow-hidden rounded-lg">
                          <img
                            src={article.thumbnail_url}
                            alt={article.title}
                            className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                            {article.read_time_minutes} min read
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            {article.category_name}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col">
                          <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 group-hover:text-green-400 transition-colors duration-200" style={{ color: 'var(--color-text)' }}>
                            {truncateText(article.title, 60)}
                          </h3>
                          
                          <p className="text-xs sm:text-sm mb-4 flex-1 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                            {truncateText(article.excerpt, 160)}
                          </p>

                          {/* Read More Button */}
                          <button className="btn-secondary text-xs sm:text-sm flex items-center gap-2 self-start group-hover:bg-green-500 group-hover:text-white transition-all duration-200">
                            Read More
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.ceil(articles.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-green-500 w-6' 
                  : 'bg-gray-400 hover:bg-gray-300'
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