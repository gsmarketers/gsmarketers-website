import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, dirname } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

async function fetchPosts() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Status',
        status: {
          equals: 'Published'
        }
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    });

    for (const page of response.results) {
      const blocks = await notion.blocks.children.list({
        block_id: page.id
      });
      
      const content = await Promise.all(blocks.results.map(async (block) => {
        switch (block.type) {
          case 'paragraph':
            return block.paragraph.rich_text.map((text) => text.plain_text).join('') + '\n\n';
          case 'heading_1':
            return '# ' + block.heading_1.rich_text.map((text) => text.plain_text).join('') + '\n\n';
          case 'heading_2':
            return '## ' + block.heading_2.rich_text.map((text) => text.plain_text).join('') + '\n\n';
          case 'heading_3':
            return '### ' + block.heading_3.rich_text.map((text) => text.plain_text).join('') + '\n\n';
          case 'bulleted_list_item':
            return '- ' + block.bulleted_list_item.rich_text.map((text) => text.plain_text).join('') + '\n';
          case 'numbered_list_item':
            return '1. ' + block.numbered_list_item.rich_text.map((text) => text.plain_text).join('') + '\n';
          case 'code':
            return '```\n' + block.code.rich_text.map((text) => text.plain_text).join('') + '\n```\n\n';
          case 'quote':
            return '> ' + block.quote.rich_text.map((text) => text.plain_text).join('') + '\n\n';
          case 'image':
            const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
            const caption = block.image.caption?.length ? block.image.caption[0].plain_text : '';
            return `![${caption}](${imageUrl})\n\n`;
          default:
            return '';
        }
      }));

      const post = {
        title: page.properties.Title.title[0]?.plain_text || 'Untitled',
        date: page.properties.Date.date.start,
        excerpt: page.properties.Excerpt.rich_text[0]?.plain_text || '',
        coverImage: page.properties.CoverImage?.files[0]?.file?.url || '',
        author: page.properties.Author.rich_text[0]?.plain_text || 'Anonymous',
        content
      };

      const slug = page.properties.Slug.rich_text[0]?.plain_text || page.id;
      const filePath = path.join(BLOG_DIR, `${slug}.md`);

      const markdown = `---
title: "${post.title.replace(/"/g, '\\"')}"
date: "${post.date}"
excerpt: "${post.excerpt.replace(/"/g, '\\"')}"
coverImage: "${post.coverImage}"
author: "${post.author}"
---

${post.content}`;

      fs.writeFileSync(filePath, markdown, 'utf8');
      console.log(`Saved: ${filePath}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fetchPosts();