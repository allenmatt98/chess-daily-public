/*
  # Create Articles Management System

  1. New Tables
    - `articles`: Store article content and metadata
      - `id` (uuid, primary key)
      - `title` (text, article title)
      - `slug` (text, URL-friendly identifier)
      - `content` (text, full article content in HTML/Markdown)
      - `excerpt` (text, short description/teaser)
      - `thumbnail_url` (text, featured image URL)
      - `author_name` (text, author's name)
      - `author_bio` (text, author biography)
      - `author_avatar_url` (text, author profile image)
      - `category` (text, article category)
      - `tags` (text[], array of tags)
      - `read_time_minutes` (integer, estimated reading time)
      - `published_at` (timestamp, publication date)
      - `featured` (boolean, whether to show in carousel)
      - `view_count` (integer, number of views)
      - `status` (text, draft/published/archived)
      - `seo_title` (text, SEO optimized title)
      - `seo_description` (text, meta description)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `article_categories`: Manage article categories
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `slug` (text, URL-friendly identifier)
      - `description` (text, category description)
      - `color` (text, display color)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for published articles
    - Admin write access for content management
    - Add indexes for performance

  3. Functions
    - Get featured articles for carousel
    - Get articles with pagination and filtering
    - Update view counts
    - Search functionality
*/

-- Create article categories table
CREATE TABLE IF NOT EXISTS article_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#22c55e',
  created_at timestamptz DEFAULT now()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text NOT NULL,
  thumbnail_url text,
  author_name text NOT NULL,
  author_bio text,
  author_avatar_url text,
  category_id uuid REFERENCES article_categories(id),
  tags text[] DEFAULT '{}',
  read_time_minutes integer DEFAULT 5,
  published_at timestamptz,
  featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Published articles are viewable by everyone"
  ON articles
  FOR SELECT
  TO public
  USING (status = 'published' AND published_at <= now());

-- Public read access for categories
CREATE POLICY "Categories are viewable by everyone"
  ON article_categories
  FOR SELECT
  TO public
  USING (true);

-- Admin policies (you'll need to create an admin role)
CREATE POLICY "Admin full access to articles"
  ON articles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to categories"
  ON article_categories
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Function to get featured articles for carousel
CREATE OR REPLACE FUNCTION get_featured_articles(limit_count integer DEFAULT 6)
RETURNS SETOF articles
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT a.*
  FROM articles a
  JOIN article_categories c ON a.category_id = c.id
  WHERE a.status = 'published' 
    AND a.featured = true 
    AND a.published_at <= now()
  ORDER BY a.published_at DESC
  LIMIT limit_count;
$$;

-- Function to get articles with pagination and filtering
CREATE OR REPLACE FUNCTION get_articles(
  category_slug text DEFAULT NULL,
  search_term text DEFAULT NULL,
  limit_count integer DEFAULT 12,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  thumbnail_url text,
  author_name text,
  author_avatar_url text,
  category_name text,
  category_slug text,
  category_color text,
  tags text[],
  read_time_minutes integer,
  published_at timestamptz,
  view_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.thumbnail_url,
    a.author_name,
    a.author_avatar_url,
    c.name as category_name,
    c.slug as category_slug,
    c.color as category_color,
    a.tags,
    a.read_time_minutes,
    a.published_at,
    a.view_count
  FROM articles a
  JOIN article_categories c ON a.category_id = c.id
  WHERE a.status = 'published' 
    AND a.published_at <= now()
    AND (category_slug IS NULL OR c.slug = category_slug)
    AND (search_term IS NULL OR 
         a.title ILIKE '%' || search_term || '%' OR 
         a.excerpt ILIKE '%' || search_term || '%' OR
         search_term = ANY(a.tags))
  ORDER BY a.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- Function to get single article by slug
CREATE OR REPLACE FUNCTION get_article_by_slug(article_slug text)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  content text,
  excerpt text,
  thumbnail_url text,
  author_name text,
  author_bio text,
  author_avatar_url text,
  category_name text,
  category_slug text,
  category_color text,
  tags text[],
  read_time_minutes integer,
  published_at timestamptz,
  view_count integer,
  seo_title text,
  seo_description text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.content,
    a.excerpt,
    a.thumbnail_url,
    a.author_name,
    a.author_bio,
    a.author_avatar_url,
    c.name as category_name,
    c.slug as category_slug,
    c.color as category_color,
    a.tags,
    a.read_time_minutes,
    a.published_at,
    a.view_count,
    a.seo_title,
    a.seo_description
  FROM articles a
  JOIN article_categories c ON a.category_id = c.id
  WHERE a.slug = article_slug 
    AND a.status = 'published' 
    AND a.published_at <= now();
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_article_views(article_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE articles 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE slug = article_slug 
    AND status = 'published';
$$;

-- Insert sample categories
INSERT INTO article_categories (name, slug, description, color) VALUES
  ('Classic Games', 'classic-games', 'Famous historical chess games and their analysis', '#ef4444'),
  ('History', 'history', 'Chess history, evolution, and historical context', '#f59e0b'),
  ('Psychology', 'psychology', 'Mental aspects of chess and player psychology', '#8b5cf6'),
  ('Secrets', 'secrets', 'Hidden stories and lesser-known chess facts', '#06b6d4'),
  ('Art', 'art', 'Chess as art, composition, and aesthetic beauty', '#ec4899'),
  ('Culture', 'culture', 'Chess in society, literature, and popular culture', '#22c55e'),
  ('Mysteries', 'mysteries', 'Unsolved chess mysteries and intriguing stories', '#6366f1'),
  ('Pioneers', 'pioneers', 'Chess pioneers and groundbreaking players', '#f97316')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample articles
INSERT INTO articles (
  title, slug, content, excerpt, thumbnail_url, author_name, author_bio, author_avatar_url,
  category_id, tags, read_time_minutes, published_at, featured, status, seo_title, seo_description
) VALUES
  (
    'The Immortal Game: When Anderssen Sacrificed Everything',
    'immortal-game-anderssen-sacrifices',
    '<p>In the annals of chess history, few games shine as brightly as the "Immortal Game" played between Adolf Anderssen and Lionel Kieseritzky in London, 1851. This masterpiece of romantic chess demonstrates the beauty of sacrificial play and tactical brilliance that defined the era.</p><h2>The Setting</h2><p>The game was played during a break in the first international chess tournament. Anderssen, representing Germany, faced the French master Kieseritzky in what was meant to be a casual encounter. Neither player could have imagined they were about to create chess immortality.</p><h2>The Sacrificial Storm</h2><p>What makes this game truly immortal is Anderssen''s willingness to sacrifice material for the sake of attack. In the span of just a few moves, he sacrificed both rooks and his queen, keeping only his bishops and knight for the final mating attack.</p>',
    'Discover how Adolf Anderssen created chess history with the most beautiful sacrificial attack ever played in 1851.',
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=250&fit=crop&crop=center',
    'Dr. Elena Marchetti',
    'Chess historian and International Master with a PhD in Medieval Studies. Author of "The Romantic Era of Chess".',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    (SELECT id FROM article_categories WHERE slug = 'classic-games'),
    ARRAY['sacrifice', 'romantic era', 'masterpiece', 'anderssen', 'tactics'],
    5,
    now() - interval '1 day',
    true,
    'published',
    'The Immortal Game: Anderssen''s Greatest Chess Sacrifice',
    'Learn about the most famous chess game ever played, where Adolf Anderssen sacrificed everything for a brilliant checkmate in 1851.'
  ),
  (
    'Chess in Medieval Courts: Power Moves Beyond the Board',
    'chess-medieval-courts-power-moves',
    '<p>Long before chess became the global phenomenon we know today, it served as more than just a game in the royal courts of medieval Europe. It was a symbol of power, a tool of diplomacy, and a reflection of the social hierarchy that defined the age.</p><h2>The Royal Game</h2><p>Chess arrived in Europe through the Islamic world around the 10th century, but it was in the medieval courts where it truly flourished. Kings and nobles didn''t just play chess; they used it to demonstrate their strategic thinking and intellectual prowess.</p>',
    'How chess became the ultimate symbol of strategy and intellect in royal courts across Europe during the Middle Ages.',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=250&fit=crop&crop=center',
    'Prof. Marcus Thornfield',
    'Medieval historian specializing in court culture and games. Professor at Oxford University.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    (SELECT id FROM article_categories WHERE slug = 'history'),
    ARRAY['medieval', 'royalty', 'culture', 'history', 'symbolism'],
    7,
    now() - interval '2 days',
    true,
    'published',
    'Chess in Medieval Courts: The Game of Kings and Power',
    'Explore how chess became a symbol of power and intellect in medieval European courts, shaping politics and culture.'
  );

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION get_featured_articles TO public;
GRANT EXECUTE ON FUNCTION get_articles TO public;
GRANT EXECUTE ON FUNCTION get_article_by_slug TO public;
GRANT EXECUTE ON FUNCTION increment_article_views TO public;