import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { NotionPost } from '@/lib/notion';
import { ArrowUpRight } from 'lucide-react';

interface BlogCardProps {
  post: NotionPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const featuredImage = post.thumbnail;

  // Ensure the content preview is a string
  const contentPreview = post.content && typeof post.content === 'string' 
    ? post.content.split('\n\n')[0] 
    : 'No content available';

  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:bg-white/10">
        {featuredImage && (
          <div className="relative h-48 overflow-hidden">
            {featuredImage && (
              <img
                src={featuredImage}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
            <time dateTime={post.date}>{formatDate(new Date(post.date))}</time>
          </div>
          
          <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-white/90 transition-colors line-clamp-2">
            {post.title}
          </h2>
          
          <div className="text-white/70 line-clamp-3 mb-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // Remove unwanted elements like headings from the preview
                h1: () => null,
                h2: () => null,
                h3: () => null,
                h4: () => null,
                h5: () => null,
                h6: () => null,
                // Style paragraphs and links
                p: ({ node, ...props }) => <p className="text-white/70" {...props} />,
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-cyan-400 no-underline hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            >
              {contentPreview}
            </ReactMarkdown>
          </div>
          
          <div className="flex items-center text-cyan-400 font-medium">
            Read More
            <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}
