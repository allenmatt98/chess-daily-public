import { supabase } from './supabase';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string;
  thumbnail_url: string;
  author_name: string;
  author_bio?: string;
  author_avatar_url: string;
  category_name: string;
  category_slug: string;
  category_color: string;
  tags: string[];
  read_time_minutes: number;
  published_at: string;
  view_count: number;
  seo_title?: string;
  seo_description?: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

/**
 * Get featured articles for the homepage carousel
 */
export async function getFeaturedArticles(limit = 6): Promise<Article[]> {
  try {
    const { data, error } = await supabase.rpc('get_featured_articles', {
      limit_count: limit
    });

    if (error) {
      console.error('Error fetching featured articles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFeaturedArticles:', error);
    return [];
  }
}

/**
 * Get articles with pagination and filtering
 */
export async function getArticles({
  categorySlug,
  searchTerm,
  limit = 12,
  offset = 0
}: {
  categorySlug?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Article[]> {
  try {
    const { data, error } = await supabase.rpc('get_articles', {
      category_slug: categorySlug || null,
      search_term: searchTerm || null,
      limit_count: limit,
      offset_count: offset
    });

    if (error) {
      console.error('Error fetching articles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getArticles:', error);
    return [];
  }
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const { data, error } = await supabase.rpc('get_article_by_slug', {
      article_slug: slug
    });

    if (error) {
      console.error('Error fetching article:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Increment view count
    await supabase.rpc('increment_article_views', {
      article_slug: slug
    });

    return data[0];
  } catch (error) {
    console.error('Error in getArticleBySlug:', error);
    return null;
  }
}

/**
 * Get all article categories
 */
export async function getArticleCategories(): Promise<ArticleCategory[]> {
  try {
    const { data, error } = await supabase
      .from('article_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getArticleCategories:', error);
    return [];
  }
}

/**
 * Search articles by title, content, or tags
 */
export async function searchArticles(query: string, limit = 10): Promise<Article[]> {
  return getArticles({
    searchTerm: query,
    limit
  });
}