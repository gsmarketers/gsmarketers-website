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
    const response = await fetch('/blog-posts.json');
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    const data = await response.json();
    const allPosts = data.posts;
    
    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allPosts.length / pageSize);

    return { posts: paginatedPosts, totalPages };
  } catch (error) {
    console.error('Error fetching Notion posts:', error);
    throw error;
  }
}

export async function getPost(slug: string): Promise<NotionPost | null> {
  try {
    const response = await fetch('/blog-posts.json');
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    const data = await response.json();
    const post = data.posts.find((p: NotionPost) => p.slug === slug);
    
    return post || null;
  } catch (error) {
    console.error('Error fetching Notion post:', error);
    throw error;
  }
}
