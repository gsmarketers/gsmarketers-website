import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from 'date-fns';
import type { NotionPost } from '@/lib/notion';
import { ArrowUpRight } from 'lucide-react';

interface BlogCardProps {
  post: NotionPost;
}

export function BlogCard({ post }: BlogCardProps) {
  // Handle expired or missing thumbnails
  const [imageError, setImageError] = useState(false);
  const fallbackImage = 'https://media.licdn.com/dms/image/v2/D4D0BAQGBoHISU63wpg/company-logo_200_200/B4DZWkEeJpHAAM-/0/1742214390982/gsmarketers_logo?e=1748476800&v=beta&t=q6haZ3dDgQuCEGiB4cOMRqUPRwyz79kANQNFMqLCIfU';
  
  const handleImageError = () => {
    console.log('Image failed to load:', post.thumbnail);
    setImageError(true);
  };

  const imageUrl = imageError || !post.thumbnail ? fallbackImage : post.thumbnail;
  
  const getContentPreview = (content: string): string => {
    try {
      // Split by newlines and find the first non-empty line that's not a heading
      const lines = content.split('\n');
      const preview = lines.find(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('>');
      }) || '';
      
      // Clean up markdown syntax
      return preview
        .replace(/[#*`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace markdown links with just the text
        .trim();
    } catch (error) {
      console.error('Error processing content preview:', error);
      return '';
    }
  };

  const formatPostDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDate(date, 'MMMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Link to={`/blog/${post.slug}`} className="group block h-full">
      <article className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:bg-white/10 h-full flex flex-col">
        {imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={post.title}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </div>
          
          <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-white/90 transition-colors line-clamp-2">
            {post.title}
          </h2>
          
          <div className="text-white/70 line-clamp-3 mb-4">
            {getContentPreview(post.content || '')}
          </div>
          <div className="flex items-center text-cyan-400 font-medium mt-auto pt-4">
            Read More
            <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}
