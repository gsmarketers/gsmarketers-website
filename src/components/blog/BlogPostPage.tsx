import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NotionPost {
  title: string;
  content: string;
  featuredImage: string;
}

export function BlogPostPage({ post }: { post: NotionPost }) {
  // Ensure content is a string and not empty
  const processedContent = post.content ? post.content : 'No content available';

  return (
    <article className="prose prose-invert max-w-none">
      {post.featuredImage && (
        <div className="relative h-[400px] mb-8 rounded-2xl overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => (
            <img
              {...props}
              className="rounded-lg"
              loading="lazy"
            />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mb-4" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold mb-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-cyan-400 hover:text-cyan-300"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-black/10 p-4 rounded-lg overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </article>
  );
}
