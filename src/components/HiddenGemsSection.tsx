import React from 'react';
import { Calendar, Clock, ExternalLink, BookOpen, User, Tag } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  publishDate: string;
  readTime: string;
  thumbnail: string;
  category: string;
  author: string;
  url: string;
  featured?: boolean;
}

// Curated chess articles with better content variety
const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'The Chess Café Revolution: How Greenwich Village Shaped American Chess',
    excerpt: 'In the smoky corners of 1960s New York coffee shops, a generation of chess masters was born. Discover how Washington Square Park and Village cafés became the unlikely epicenter of American chess culture.',
    publishDate: '2024-01-15',
    readTime: '8 min read',
    thumbnail: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&h=400&fit=crop&crop=center',
    category: 'History',
    author: 'Sarah Chen',
    url: '#',
    featured: true
  },
  {
    id: '2',
    title: 'The Forgotten Queen: Vera Menchik\'s Revolutionary Chess Legacy',
    excerpt: 'Before Judit Polgar, there was Vera Menchik—the first women\'s world champion whose aggressive tactical style challenged the chess establishment and paved the way for future generations.',
    publishDate: '2024-01-12',
    readTime: '12 min read',
    thumbnail: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=600&h=400&fit=crop&crop=center',
    category: 'Biography',
    author: 'Marcus Rodriguez',
    url: '#'
  },
  {
    id: '3',
    title: 'The Secret Variations of the Immortal Game',
    excerpt: 'Chess historians have uncovered alternative lines from Anderssen vs. Kieseritzky that were never played. These hidden variations reveal fascinating "what-if" scenarios from chess\'s most famous game.',
    publishDate: '2024-01-10',
    readTime: '15 min read',
    thumbnail: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=600&h=400&fit=crop&crop=center',
    category: 'Analysis',
    author: 'Dr. Elena Petrov',
    url: '#'
  },
  {
    id: '4',
    title: 'Chess in the Soviet Underground: The Untold Stories',
    excerpt: 'Beyond the official tournaments, a vibrant underground chess scene thrived in Soviet Russia. Meet the players who risked everything to play the game they loved.',
    publishDate: '2024-01-08',
    readTime: '10 min read',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center',
    category: 'History',
    author: 'Alexei Volkov',
    url: '#'
  },
  {
    id: '5',
    title: 'The Psychology of Chess Blunders: What Science Reveals',
    excerpt: 'Recent neuroscience research reveals why even grandmasters make shocking mistakes. Understanding the psychology behind blunders can transform your game.',
    publishDate: '2024-01-05',
    readTime: '7 min read',
    thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop&crop=center',
    category: 'Psychology',
    author: 'Dr. James Mitchell',
    url: '#'
  },
  {
    id: '6',
    title: 'The Chess Prodigy Who Vanished: The Mystery of Reshevsky\'s Rival',
    excerpt: 'In 1920s America, a young chess prodigy rivaled Samuel Reshevsky\'s fame—then disappeared completely. Decades later, chess historians are still searching for answers.',
    publishDate: '2024-01-03',
    readTime: '11 min read',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center',
    category: 'Mystery',
    author: 'Rebecca Thompson',
    url: '#'
  }
];

export function HiddenGemsSection() {
  // Show featured article first, then others
  const featuredArticle = sampleArticles.find(article => article.featured);
  const regularArticles = sampleArticles.filter(article => !article.featured).slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'History': 'bg-amber-500',
      'Biography': 'bg-purple-500',
      'Analysis': 'bg-blue-500',
      'Psychology': 'bg-green-500',
      'Mystery': 'bg-red-500',
      'Culture': 'bg-indigo-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <section 
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-12 sm:py-16" 
      aria-labelledby="hidden-gems-title"
    >
      {/* Section Header */}
      <header className="text-center mb-12 sm:mb-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
          <h2 
            id="hidden-gems-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            Hidden Gems from the Chess World
          </h2>
        </div>
        <p 
          className="text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Discover fascinating stories, forgotten legends, and untold tales from chess history 
          that most enthusiasts have never heard. Dive deep into the rich tapestry of our beloved game.
        </p>
      </header>

      {/* Featured Article */}
      {featuredArticle && (
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-green-400">Featured Story</h3>
          </div>
          
          <article className="group card overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative overflow-hidden lg:order-2">
                <img
                  src={featuredArticle.thumbnail}
                  alt={`Featured story: ${featuredArticle.title}`}
                  className="w-full h-64 lg:h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span 
                    className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${getCategoryColor(featuredArticle.category)}`}
                  >
                    {featuredArticle.category}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center lg:order-1">
                <h4 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight group-hover:text-green-400 transition-colors duration-300">
                  <a 
                    href={featuredArticle.url}
                    className="block"
                    style={{ color: 'var(--color-text)' }}
                    aria-label={`Read featured article: ${featuredArticle.title}`}
                  >
                    {featuredArticle.title}
                  </a>
                </h4>

                <p 
                  className="text-base sm:text-lg mb-6 leading-relaxed"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <span style={{ color: 'var(--color-text-muted)' }}>{featuredArticle.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <time 
                        dateTime={featuredArticle.publishDate}
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {formatDate(featuredArticle.publishDate)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <span style={{ color: 'var(--color-text-muted)' }}>{featuredArticle.readTime}</span>
                    </div>
                  </div>
                  <a
                    href={featuredArticle.url}
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors duration-200 font-semibold"
                    aria-label={`Read full featured article: ${featuredArticle.title}`}
                  >
                    Read Story
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Regular Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {regularArticles.map((article) => (
          <article 
            key={article.id}
            className="group card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex flex-col"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.thumbnail}
                alt={`Story thumbnail: ${article.title}`}
                className="w-full h-48 sm:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3">
                <span 
                  className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getCategoryColor(article.category)}`}
                >
                  {article.category}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col flex-grow">
              <h4 className="text-lg sm:text-xl font-bold mb-3 leading-tight group-hover:text-green-400 transition-colors duration-200 flex-grow">
                <a 
                  href={article.url}
                  className="block"
                  style={{ color: 'var(--color-text)' }}
                  aria-label={`Read article: ${article.title}`}
                >
                  {article.title}
                </a>
              </h4>

              <p 
                className="text-sm sm:text-base mb-4 leading-relaxed line-clamp-3 flex-grow"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {article.excerpt}
              </p>

              <div className="mt-auto">
                <div className="flex items-center gap-3 text-xs sm:text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{article.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <time 
                      dateTime={article.publishDate}
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {formatDate(article.publishDate)}
                    </time>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{article.readTime}</span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <a
                    href={article.url}
                    className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors duration-200 font-medium text-sm"
                    aria-label={`Read full article: ${article.title}`}
                  >
                    Read More
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12 sm:mt-16">
        <div className="inline-flex flex-col sm:flex-row items-center gap-4">
          <a
            href="/chess-articles"
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-semibold"
            aria-label="Explore all hidden chess gems and stories"
          >
            <BookOpen className="w-5 h-5" />
            Explore All Hidden Gems
          </a>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            New stories added weekly
          </p>
        </div>
      </div>
    </section>
  );
}