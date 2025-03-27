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
    const response = await fetch('/blog-posts.json?' + new Date().getTime(), {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Fetched blog posts data:', data); // Debug log
    
    const allPosts = data.posts || [];
    if (!Array.isArray(allPosts)) {
      throw new Error('Invalid blog posts data: posts is not an array');
    }

    // Validate that each post has a content field
    allPosts.forEach((post, index) => {
      if (!post.content || typeof post.content !== 'string') {
        console.warn(`Post at index ${index} has invalid content:`, post);
        post.content = 'No content available'; // Fallback
      }
    });
    
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
    const response = await fetch('/blog-posts.json?' + new Date().getTime(), {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Fetched blog posts data for single post:', data); // Debug log
    
    const allPosts = data.posts || [];
    if (!Array.isArray(allPosts)) {
      throw new Error('Invalid blog posts data: posts is not an array');
    }

    const post = allPosts.find((p: NotionPost) => p.slug === slug);
    
    if (post && (!post.content || typeof post.content !== 'string')) {
      console.warn(`Post with slug ${slug} has invalid content:`, post);
      post.content = 'No content available'; // Fallback
    }
    
    return post || null;
  } catch (error) {
    console.error('Error fetching Notion post:', error);
    throw error;
  }
}
