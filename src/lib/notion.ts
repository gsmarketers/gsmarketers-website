export interface NotionPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  thumbnail?: string;
  date: string;
  lastEdited: string;
}

export async function getPosts(page = 1, pageSize = 10): Promise<{
  posts: NotionPost[];
  totalPages: number;
}> {
  try {
    const response = await fetch('/blog-posts.json?t=' + new Date().getTime(), {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    const data = await response.json();
    const allPosts = data.posts || [];
    
    // Ensure all required fields exist
    const validPosts = allPosts.map(post => ({
      ...post,
      content: post.content || '',
      title: post.title || 'Untitled',
      date: post.date || new Date().toISOString(),
      lastEdited: post.lastEdited || new Date().toISOString(),
      slug: post.slug || 'untitled-post'
    }));
    
    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = validPosts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(validPosts.length / pageSize);

    return { posts: paginatedPosts, totalPages };
  } catch (error) {
    console.error('Error fetching Notion posts:', error);
    throw error;
  }
}

export async function getPost(slug: string): Promise<NotionPost | null> {
  try {
    const response = await fetch('/blog-posts.json?' + new Date().getTime(), {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    const data = await response.json();
    const posts = data.posts || [];
    const post = posts.find((p: NotionPost) => p.slug === slug);
    
    return post || null;
  } catch (error) {
    console.error('Error fetching Notion post:', error);
    throw error;
  }
}
