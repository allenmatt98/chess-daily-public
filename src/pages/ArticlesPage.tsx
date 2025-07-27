import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Clock, Tag } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { getArticles, getArticleCategories, Article, ArticleCategory } from '../lib/articlesService';


export default function ArticlesPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'readTime'>('newest');

  // Load articles and categories on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [articlesData, categoriesData] = await Promise.all([
          getArticles({ limit: 50 }),
          getArticleCategories()
        ]);
        setArticles(articlesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading articles data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter and sort articles
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || article.category_slug === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort articles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        case 'oldest':
          return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
        case 'readTime':
          return a.read_time_minutes - b.read_time_minutes;
        default:
          return 0;
      }
    });

    return filtered;
  }, [articles, searchTerm, selectedCategory, sortBy]);

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
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.slug} value={category.slug}>{category.name}</option>
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
            Showing {filteredAndSortedArticles.length} of {articles.length} articles
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory && ` in ${categories.find(c => c.slug === selectedCategory)?.name}`}
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
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
                    {article.read_time_minutes} min read
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                    {article.category_name}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-400 transition-colors duration-200" style={{ color: 'var(--color-text)' }}>
                    {article.title}
                  </h3>
                  
                  <p className="text-sm mb-4 flex-1 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                    {article.excerpt}
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
                    <span>{formatDate(article.published_at)}</span>
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
                  setSelectedCategory('');
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