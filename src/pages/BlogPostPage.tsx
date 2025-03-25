import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPost, type NotionPost } from '@/lib/notion';
import { format as formatDate } from 'date-fns';
import { ArrowLeft, Calendar, User2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<NotionPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const postData = await getPost(slug);
        if (!postData) {
          setError('Post not found');
        } else {
          setPost(postData);
        }
      } catch (err) {
        setError('Failed to load blog post. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl text-red-400 mb-4">{error}</h1>
          <Link
            to="/blog"
            className="inline-flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const author = post._embedded?.author?.[0];

  return (
    <div className="min-h-screen pt-32 pb-16">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          <h1
            className="text-3xl md:text-4xl font-semibold mb-6 text-white"
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-white/60 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
            {author && (
              <div className="flex items-center gap-2">
                <User2 className="w-4 h-4" />
                <span>{author.name}</span>
              </div>
            )}
          </div>

          {post.coverImage && (
            <div className="relative h-[400px] mb-8 rounded-2xl overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-invert prose-cyan max-w-none
                     prose-headings:text-white prose-headings:font-semibold
                     prose-p:text-white/80 prose-p:leading-relaxed
                     prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-white prose-strong:font-semibold
                     prose-blockquote:border-cyan-400 prose-blockquote:text-white/70
                     prose-code:text-cyan-400 prose-pre:bg-white/5
                     prose-ol:text-white/80 prose-ul:text-white/80
                     prose-li:marker:text-cyan-400"
          >
            {post.content}
          </div>
        </motion.div>
      </article>
    </div>
  );
};

export default BlogPostPage;
