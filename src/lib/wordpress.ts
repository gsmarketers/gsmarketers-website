import { format } from 'date-fns';
import sanitizeHtmlPkg from 'sanitize-html';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'b', 'i', 'strong', 'em',
  'small', 'del', 'ins', 'mark', 'sub', 'sup',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'div', 'span', 'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img', 'figure', 'figcaption', 'a'
];

// Replace this with your WordPress site URL
const WORDPRESS_API_URL = import.meta.env.VITE_WORDPRESS_API_URL;

export interface WordPressPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  _embedded?: {
    author?: Array<{
      name: string;
      avatar_urls?: {
        [key: string]: string;
      };
    }>;
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}

export async function getPosts(page = 1, perPage = 10): Promise<{
  posts: WordPressPost[];
  totalPages: number;
}> {
  if (!WORDPRESS_API_URL) {
    console.error('WordPress API URL not configured');
    throw new Error('WordPress API URL not configured. Please check your environment variables.');
  }

  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed&page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }

    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

    return { posts, totalPages };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], totalPages: 0 };
  }
}

export async function getPost(slug: string): Promise<WordPressPost | null> {
  if (!WORDPRESS_API_URL) {
    console.error('WordPress API URL not configured');
    throw new Error('WordPress API URL not configured. Please check your environment variables.');
  }

  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed&slug=${slug}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }

    const posts = await response.json();
    return posts[0] || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMMM dd, yyyy');
}

export function sanitizeHtml(html: string | undefined): string {
  if (!html) return '';
  return sanitizeHtmlPkg(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'class'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      figure: ['class'],
      figcaption: ['class'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      code: ['class'],
      pre: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          target: attribs?.href?.startsWith('#') ? undefined : '_blank',
          rel: 'noopener noreferrer'
        }
      })
    }
  });
}
