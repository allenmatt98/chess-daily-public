import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, Share2, BookOpen, Calendar } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';

interface ArticleContent {
  id: string;
  title: string;
  content: string;
  thumbnail: string;
  readTime: string;
  category: string;
  publishedAt: string;
  slug: string;
  tags: string[];
  author: {
    name: string;
    bio: string;
    avatar: string;
  };
  relatedArticles: string[];
}

// Sample article content - in production, this would come from your CMS/API
const articleContent: Record<string, ArticleContent> = {
  'immortal-game-anderssen-sacrifices': {
    id: '1',
    title: 'The Immortal Game: When Anderssen Sacrificed Everything',
    content: `
      <p>In the annals of chess history, few games shine as brightly as the "Immortal Game" played between Adolf Anderssen and Lionel Kieseritzky in London, 1851. This masterpiece of romantic chess demonstrates the beauty of sacrificial play and tactical brilliance that defined the era.</p>

      <h2>The Setting</h2>
      <p>The game was played during a break in the first international chess tournament. Anderssen, representing Germany, faced the French master Kieseritzky in what was meant to be a casual encounter. Neither player could have imagined they were about to create chess immortality.</p>

      <h2>The Sacrificial Storm</h2>
      <p>What makes this game truly immortal is Anderssen's willingness to sacrifice material for the sake of attack. In the span of just a few moves, he sacrificed:</p>
      <ul>
        <li>A bishop on move 11</li>
        <li>Both rooks</li>
        <li>His queen on the final move</li>
      </ul>

      <p>Each sacrifice was calculated to maintain the initiative and drive his opponent's king into an inescapable mating net.</p>

      <h2>The Final Position</h2>
      <p>The game concluded with one of the most beautiful checkmate patterns ever recorded. Anderssen's remaining pieces - just two bishops and a knight - delivered mate against Kieseritzky's materially superior but poorly coordinated army.</p>

      <blockquote>
        "This game represents the pinnacle of romantic chess, where beauty and brilliance mattered more than material advantage." - Garry Kasparov
      </blockquote>

      <h2>Legacy and Impact</h2>
      <p>The Immortal Game has inspired countless chess players and continues to be studied today. It demonstrates that in chess, as in art, sometimes the most beautiful creations come from bold sacrifices and unwavering commitment to one's vision.</p>

      <p>Modern chess engines confirm that while some of Anderssen's moves weren't the most accurate by today's standards, the game remains a testament to human creativity and the power of tactical vision.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&h=400&fit=crop&crop=center',
    readTime: '5 min read',
    category: 'Classic Games',
    publishedAt: '2024-01-15',
    slug: 'immortal-game-anderssen-sacrifices',
    tags: ['sacrifice', 'romantic era', 'masterpiece', 'anderssen', 'tactics'],
    author: {
      name: 'Dr. Elena Marchetti',
      bio: 'Chess historian and International Master with a PhD in Medieval Studies. Author of "The Romantic Era of Chess" and curator of chess artifacts at the World Chess Museum.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    relatedArticles: ['chess-medieval-courts-power-moves', 'psychology-blunders-masters-mistakes']
  },
  'chess-medieval-courts-power-moves': {
    id: '2',
    title: 'Chess in Medieval Courts: Power Moves Beyond the Board',
    content: `
      <p>Long before chess became the global phenomenon we know today, it served as more than just a game in the royal courts of medieval Europe. It was a symbol of power, a tool of diplomacy, and a reflection of the social hierarchy that defined the age.</p>

      <h2>The Royal Game</h2>
      <p>Chess arrived in Europe through the Islamic world around the 10th century, but it was in the medieval courts where it truly flourished. Kings and nobles didn't just play chess; they used it to demonstrate their strategic thinking and intellectual prowess.</p>

      <h2>Symbolism and Society</h2>
      <p>The chess pieces themselves reflected medieval society:</p>
      <ul>
        <li>The King represented the monarch</li>
        <li>The Queen (originally the advisor or vizier) symbolized the power behind the throne</li>
        <li>Bishops represented the church's influence</li>
        <li>Knights embodied the military nobility</li>
        <li>Rooks symbolized the fortified castles</li>
        <li>Pawns represented the common people</li>
      </ul>

      <h2>Political Chess</h2>
      <p>Historical records show that chess games between nobles often carried political weight. A well-played game could enhance one's reputation, while a poor showing might damage political standing. Some treaties were even negotiated over the chessboard.</p>

      <blockquote>
        "Chess is the gymnasium of the mind." - Blaise Pascal
      </blockquote>

      <h2>The Evolution of Rules</h2>
      <p>Medieval chess differed significantly from the modern game. The queen was much weaker, bishops moved only two squares diagonally, and castling didn't exist. These changes evolved gradually, often influenced by the political and social changes of the time.</p>

      <p>The transformation of the queen from a weak advisor to the most powerful piece on the board coincided with the rise of powerful female rulers like Isabella of Castile and Elizabeth I of England.</p>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=400&fit=crop&crop=center',
    readTime: '7 min read',
    category: 'History',
    publishedAt: '2024-01-12',
    slug: 'chess-medieval-courts-power-moves',
    tags: ['medieval', 'royalty', 'culture', 'history', 'symbolism'],
    author: {
      name: 'Prof. Marcus Thornfield',
      bio: 'Medieval historian specializing in court culture and games. Professor at Oxford University and author of "Games of Power: Entertainment in Medieval Courts."',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    relatedArticles: ['immortal-game-anderssen-sacrifices', 'chess-cafes-vienna-legends-born']
  }
};

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();
  
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug && articleContent[slug]) {
      setArticle(articleContent[slug]);
    } else {
      // In production, you would fetch from your API here
      setArticle(null);
    }
    setLoading(false);
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.content.substring(0, 160) + '...',
          url: window.location.href,
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
            src={article.thumbnail}
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
              <span className="text-white">{article.category}</span>
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
              <span className="px-2 py-1 rounded-full bg-green-500 text-white font-medium">
                {article.category}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
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
              {/* Back Navigation */}
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => navigate('/articles')}
                  className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-green-400"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Articles
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-green-400"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <BookOpen className="w-4 h-4" />
                  Back to Homepage
                </button>
              </div>

              {/* Article Body */}
              <div 
                className="prose prose-lg max-w-none"
                style={{ 
                  color: 'var(--color-text)',
                  '--tw-prose-headings': 'var(--color-text)',
                  '--tw-prose-links': '#22c55e',
                  '--tw-prose-bold': 'var(--color-text)',
                  '--tw-prose-quotes': 'var(--color-text-muted)',
                  '--tw-prose-quote-borders': '#22c55e',
                  '--tw-prose-code': 'var(--color-text)',
                }}
                dangerouslySetInnerHTML={{ __html: article.content }}
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
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      {article.author.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {article.author.bio}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Ad Space */}
              <div className="card p-4 mb-6">
                <div className="w-full h-64 rounded-lg border-2 border-dashed flex items-center justify-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  Article Sidebar Ad
                </div>
              </div>

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
                    {article.readTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.publishedAt)}
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

        {/* Mobile Ad Space */}
        <div className="lg:hidden mx-4 mb-8">
          <div className="w-full h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            Mobile Article Ad
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}