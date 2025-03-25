import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPosts, type WordPressPost } from '@/lib/wordpress';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/blog/Pagination';
import { ShimmerText } from '@/components/ui/shimmer-text';
import { Loader2 } from 'lucide-react';

const POSTS_PER_PAGE = 9;

const BlogPage = () => {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { posts: newPosts, totalPages: total } = await getPosts(currentPage, POSTS_PER_PAGE);
        setPosts(newPosts);
        setTotalPages(total);
      } catch (err) {
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <ShimmerText className="text-4xl md:text-5xl font-semibold mb-6">
            Latest Insights & Updates
          </ShimmerText>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Discover strategies, tips, and success stories to help you grow your business
            and connect with high-value clients.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;