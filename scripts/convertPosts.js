import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// Create blog directory if it doesn't exist
if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

// Convert WordPress post to MDX format
function convertToMDX(post) {
  const frontmatter = `---
title: "${post.title.rendered.replace(/"/g, '\\"')}"
date: "${post.date}"
excerpt: "${post.excerpt.rendered.replace(/<[^>]*>/g, '').replace(/"/g, '\\"').trim()}"
featuredImage: "${post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''}"
author: "${post._embedded?.author?.[0]?.name || ''}"
---

${post.content.rendered}`;

  return frontmatter;
}

// Save post as MDX file
function savePost(slug, content) {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved: ${filePath}`);
}

// Main conversion process
export async function convertPosts(posts) {
  for (const post of posts) {
    const mdxContent = convertToMDX(post);
    savePost(post.slug, mdxContent);
  }
}