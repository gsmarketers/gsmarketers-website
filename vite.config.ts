import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    historyApiFallback: true,
    hmr: {
      clientPort: 443
    },
    setupMiddleware: (middleware, server) => {
      // Ensure blog-posts.json exists
      const publicDir = path.resolve(__dirname, 'public');
      const blogPostsPath = path.join(publicDir, 'blog-posts.json');
      
      if (!fs.existsSync(blogPostsPath)) {
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(blogPostsPath, JSON.stringify({ posts: [] }, null, 2));
      }
    }
  },
  optimizeDeps: {
    include: ['react-markdown', 'remark-gfm', 'rehype-raw']
  }
});
