import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/wordpress';
import type { WordPressPost } from '@/lib/wordpress';
import { ArrowUpRight } from 'lucide-react';

interface BlogCardProps {
  post: WordPressPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const author = post._embedded?.author?.[0];

  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:bg-white/10">
        {featuredImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={featuredImage}
              alt={post.title.rendered}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {author && (
              <>
                <span>•</span>
                <span>{author.name}</span>
              </>
            )}
          </div>
          
          <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-white/90 transition-colors line-clamp-2"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          
          <div className="text-white/70 line-clamp-3 mb-4"
               dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
          />
          
          <div className="flex items-center text-cyan-400 font-medium">
            Read More
            <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}