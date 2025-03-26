import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPosts() {
  try {
    // Get existing posts to compare
    const existingPosts = new Map();
    try {
      if (fs.existsSync(BLOG_DIR)) {
        fs.readdirSync(BLOG_DIR).forEach(file => {
          if (file.endsWith('.md')) {
            const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
            const slug = file.replace('.md', '');
            existingPosts.set(slug, content);
          }
        });
      }
    } catch (err) {
      console.warn('Warning: Could not read existing posts:', err);
    }

    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter_properties: ['Title', 'Published Date', 'Page Content', 'CoverImage', 'Slug'],
      filter: {
        and: [
          {
            property: 'Published',
            checkbox: {
              equals: true
            }
          },
          {
            property: 'Published Date',
            date: {
              is_not_empty: true
            }
          }
        ]
      },
      sorts: [
        {
          property: 'Published Date',
          direction: 'descending'
        }
      ],
      page_size: 100
    });

    for (const page of response.results) {
      // Add delay between processing each post to avoid rate limits
      await delay(500);
      try {
        // Safely get title
        const title = page.properties?.Title?.title?.[0]?.plain_text || 'Untitled';
        const slug = page.properties?.Slug?.rich_text?.[0]?.plain_text || page.id;
        
        const blocks = await notion.blocks.children.list({
          block_id: page.id
        });
        
        const content = await Promise.all(blocks.results.map(async (block) => {
          // Add small delay between block processing
          await delay(100);
          
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
          title,
          date: page.properties['Published Date']?.date?.start || new Date().toISOString(),
          pageContent: page.properties?.['Page Content']?.rich_text?.[0]?.plain_text || '',
          coverImage: page.properties?.CoverImage?.files?.[0]?.file?.url || '',
          lastEdited: page.last_edited_time,
          content: content.join('')
        };

        const filePath = path.join(BLOG_DIR, `${slug}.md`);

        const markdown = `---
title: "${post.title.replace(/"/g, '\\"')}"
date: "${post.date}"
pageContent: "${post.pageContent.replace(/"/g, '\\"')}"
coverImage: "${post.coverImage}"
lastEdited: "${post.lastEdited}"
---

${post.content}`;

        // Only write if content has changed
        const existingContent = existingPosts.get(slug);
        if (!existingContent || existingContent !== markdown) {
          // Create backup before writing
          if (fs.existsSync(filePath)) {
            const backupPath = path.join(BLOG_DIR, '.backups');
            if (!fs.existsSync(backupPath)) {
              fs.mkdirSync(backupPath);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.copyFileSync(filePath, path.join(backupPath, `${slug}-${timestamp}.md`));
          }

          // Write new content
          fs.writeFileSync(filePath, markdown, 'utf8');
          console.log(`Updated: ${filePath}`);
        } else {
          console.log(`No changes for: ${slug}`);
        }

      } catch (error) {
        console.error(`Error processing post ${page.id}:`, error);
        // Continue with next post instead of failing completely
        console.log('Skipping post due to error');
        continue;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fetchPosts();
