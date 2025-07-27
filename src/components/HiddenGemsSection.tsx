import React from 'react';
import { Calendar, Clock, ExternalLink, BookOpen } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  publishDate: string;
  readTime: string;
  thumbnail: string;
  category: string;
  url: string;
}

// Sample articles - in production, these would come from a CMS or API
const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'The Forgotten Chess Prodigy: Vera Menchik\'s Untold Story',
    excerpt: 'Before there was Judit Polgar, there was Vera Menchik - the first women\'s world champion whose revolutionary playing style changed chess forever.',
    publishDate: '2024-01-15',
    readTime: '8 min read',
    thumbnail: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=250&fit=crop&crop=center',
    category: 'History',
    url: '#'
  },
  {
    id: '2',
    title: 'The Chess Café Culture of 1960s New York',
    excerpt: 'Discover how Washington Square Park and Greenwich Village coffee shops became the unlikely breeding ground for American chess masters.',
    publishDate: '2024-01-12',
    readTime: '6 min read',
    thumbnail: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=250&fit=crop&crop=center',
    category: 'Culture',
    url: '#'
  },
  {
    id: '3',
    title: 'The Mysterious Immortal Game Variations',
    excerpt: 'Anderssen vs. Kieseritzky had alternative lines that were never played. Chess historians reveal what could have been.',
    publishDate: '2024-01-10',
    readTime: '12 min read',
    thumbnail: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400&h=250&fit=crop&crop=center',
    category: 'Analysis',
    url: '#'
  }
];

export function HiddenGemsSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12" aria-labelledby="hidden-gems-title">
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
          <h2 
            id="hidden-gems-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Hidden Gems from the Chess World
          </h2>
        </div>
        <p 
          className="text-base sm:text-lg max-w-3xl mx-auto leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Discover fascinating stories, forgotten legends, and untold tales from chess history that most enthusiasts have never heard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {sampleArticles.map((article) => (
          <article 
            key={article.id}
            className="group card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.thumbnail}
                alt={`Thumbnail for ${article.title}`}
                className="w-full h-48 sm:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  {article.category}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 leading-tight group-hover:text-green-400 transition-colors duration-200">
                <a 
                  href={article.url}
                  className="block"
                  style={{ color: 'var(--color-text)' }}
                  aria-label={`Read article: ${article.title}`}
                >
                  {article.title}
                </a>
              </h3>

              <p 
                className="text-sm sm:text-base mb-4 leading-relaxed line-clamp-3"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {article.excerpt}
              </p>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <time 
                      dateTime={article.publishDate}
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {new Date(article.publishDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </time>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{article.readTime}</span>
                  </div>
                </div>
                <a
                  href={article.url}
                  className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors duration-200 font-medium"
                  aria-label={`Read full article: ${article.title}`}
                >
                  Read More
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="text-center mt-8 sm:mt-12">
        <a
          href="/chess-articles"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
          aria-label="View all chess articles and stories"
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          Explore All Hidden Gems
        </a>
      </div>
    </section>
  );
}