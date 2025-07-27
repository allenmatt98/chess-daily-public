import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Clock, Tag } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';

interface Article {
  id: string;
  title: string;
  teaser: string;
  thumbnail: string;
  readTime: string;
  category: string;
  publishedAt: string;
  slug: string;
  tags: string[];
}

// Extended articles data for the full listing
const allArticles: Article[] = [
  {
    id: '1',
    title: 'The Immortal Game: When Anderssen Sacrificed Everything',
    teaser: 'Discover how Adolf Anderssen created chess history with the most beautiful sacrificial attack ever played in 1851.',
    thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=250&fit=crop&crop=center',
    readTime: '5 min read',
    category: 'Classic Games',
    publishedAt: '2024-01-15',
    slug: 'immortal-game-anderssen-sacrifices',
    tags: ['sacrifice', 'romantic era', 'masterpiece']
  },
  {
    id: '2',
    title: 'Chess in Medieval Courts: Power Moves Beyond the Board',
    teaser: 'How chess became the ultimate symbol of strategy and intellect in royal courts across Europe during the Middle Ages.',
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=250&fit=crop&crop=center',
    readTime: '7 min read',
    category: 'History',
    publishedAt: '2024-01-12',
    slug: 'chess-medieval-courts-power-moves',
    tags: ['medieval', 'royalty', 'culture']
  },
  {
    id: '3',
    title: 'The Psychology of Blunders: Why Masters Make Mistakes',
    teaser: 'Exploring the mental factors that lead even world champions to make shocking errors in critical moments.',
    thumbnail: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=250&fit=crop&crop=center',
    readTime: '6 min read',
    category: 'Psychology',
    publishedAt: '2024-01-10',
    slug: 'psychology-blunders-masters-mistakes',
    tags: ['psychology', 'blunders', 'mental game']
  },
  {
    id: '4',
    title: 'Secret Chess Codes: How Players Communicated in Tournaments',
    teaser: 'The fascinating world of hidden signals and communication methods used by chess players in competitive tournaments.',
    thumbnail: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400&h=250&fit=crop&crop=center',
    readTime: '4 min read',
    category: 'Secrets',
    publishedAt: '2024-01-08',
    slug: 'secret-chess-codes-tournament-communication',
    tags: ['secrets', 'tournaments', 'communication']
  },
  {
    id: '5',
    title: 'The Lost Art of Chess Composition: Creating Perfect Puzzles',
    teaser: 'Meet the artists who craft the most elegant and challenging chess problems, and learn about their creative process.',
    thumbnail: 'https://images.unsplash.com/photo-1611195974226-ef16ab4e4c8d?w=400&h=250&fit=crop&crop=center',
    readTime: '8 min read',
    category: 'Art',
    publishedAt: '2024-01-05',
    slug: 'lost-art-chess-composition-perfect-puzzles',
    tags: ['composition', 'puzzles', 'art']
  },
  {
    id: '6',
    title: 'Chess Cafés of Vienna: Where Legends Were Born',
    teaser: 'Step into the smoky cafés where chess masters gathered to play, discuss theory, and create chess history.',
    thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop&crop=center',
    readTime: '6 min read',
    category: 'Culture',
    publishedAt: '2024-01-03',
    slug: 'chess-cafes-vienna-legends-born',
    tags: ['vienna', 'cafes', 'culture']
  },
  {
    id: '7',
    title: 'The Great Chess Automaton Hoax: The Mechanical Turk',
    teaser: 'Uncover the truth behind the 18th century chess-playing machine that fooled emperors and intellectuals.',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop&crop=center',
    readTime: '9 min read',
    category: 'Mysteries',
    publishedAt: '2024-01-01',
    slug: 'mechanical-turk-chess-automaton-hoax',
    tags: ['automaton', 'hoax', 'history']
  },
  {
    id: '8',
    title: 'Women Warriors of Chess: Forgotten Female Masters',
    teaser: 'Celebrating the pioneering women who broke barriers and excelled in the male-dominated world of competitive chess.',
    thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=250&fit=crop&crop=center',
    readTime: '10 min read',
    category: 'Pioneers',
    publishedAt: '2023-12-28',
    slug: 'women-warriors-chess-forgotten-masters',
    tags: ['women', 'pioneers', 'equality']
  }
];

const categories = ['All', 'Classic Games', 'History', 'Psychology', 'Secrets', 'Art', 'Culture', 'Mysteries', 'Pioneers'];

export default function ArticlesPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'readTime'>('newest');

  // Filter and sort articles
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = allArticles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.teaser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'readTime':
          return parseInt(a.readTime) - parseInt(b.readTime);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
      <Header
        onHowToPlay={() => {}}
        onSignIn={() => {}}
        onSignOut={() => { useAuthStore.getState().signOut(); }}
        onLogoClick={() => navigate('/')}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <button
            onClick={() => navigate('/')}
            className="hover:text-green-400 transition-colors duration-200"
          >
            Home
          </button>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>Hidden Gems</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 mb-4 text-sm transition-colors duration-200 hover:text-green-400"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Homepage
            </button>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Hidden Gems from the Chess World
            </h1>
            <p className="text-base sm:text-lg" style={{ color: 'var(--color-text-muted)' }}>
              Explore fascinating stories, secrets, and legends from chess history
            </p>
          </div>

          {/* Desktop Ad Space */}
          <div className="hidden lg:block w-48 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            Article Page Ad
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="card p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search articles, topics, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'readTime')}
                className="px-3 py-2 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="readTime">By Read Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Showing {filteredAndSortedArticles.length} of {allArticles.length} articles
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredAndSortedArticles.map((article) => (
            <article
              key={article.id}
              className="group cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => navigate(`/articles/${article.slug}`)}
            >
              <div className="card p-4 h-full flex flex-col">
                {/* Thumbnail */}
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                    {article.readTime}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                    {article.category}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-400 transition-colors duration-200" style={{ color: 'var(--color-text)' }}>
                    {article.title}
                  </h3>
                  
                  <p className="text-sm mb-4 flex-1 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                    {article.teaser}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
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

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{formatDate(article.publishedAt)}</span>
                    <button className="btn-secondary text-xs px-3 py-1 group-hover:bg-green-500 group-hover:text-white transition-all duration-200">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* No Results Message */}
        {filteredAndSortedArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                No articles found
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Mobile Ad Space */}
        <div className="lg:hidden mt-8 w-full h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          Mobile Article List Ad
        </div>
      </main>

      <Footer />
    </div>
  );
}