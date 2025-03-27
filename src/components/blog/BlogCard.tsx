import { Link } from 'react-router-dom'; // Adjust import based on your routing library
import { ArrowRight } from 'lucide-react'; // Adjust based on your icon library
import { formatDate } from '../utils/dateUtils'; // Adjust path to your utility function

interface BlogCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    content?: string; // Optional to account for potential missing content
    date: string;
  };
}

export function BlogCard({ post }: BlogCardProps) {
  // Safely get a content preview
  const contentPreview = post.content && typeof post.content === 'string'
    ? post.content.split('\n\n')[0]
    : 'No content available';

  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <article className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300 h-full flex flex-col">
        <div className="p-6 flex flex-col flex-grow">
          <time className="text-sm text-white/70 mb-2 block">
            {formatDate(new Date(post.date))}
          </time>
          <h2 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
            {post.title}
          </h2>
          <div className="text-white/70 mb-4 flex-grow">
            {contentPreview}
          </div>
          <div className="mt-auto">
            <span className="inline-flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
              Read More <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
