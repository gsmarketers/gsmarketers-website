import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('❌ Missing required environment variables:');
  if (!process.env.NOTION_TOKEN) console.error('   - NOTION_TOKEN');
  if (!process.env.NOTION_DATABASE_ID) console.error('   - NOTION_DATABASE_ID');
  process.exit(1);
}

const BLOG_DIR = path.join(__dirname, '../src/content/blog');
const PUBLIC_DIR = path.join(__dirname, '../public');
const POSTS_JSON_PATH = path.join(PUBLIC_DIR, 'blog-posts.json');

console.log('🔄 Starting Notion blog post sync...');
console.log(`📁 Blog directory: ${BLOG_DIR}`);
console.log(`📄 Posts JSON path: ${POSTS_JSON_PATH}`);

if (!fs.existsSync(BLOG_DIR)) {
  console.log(`📁 Creating blog directory: ${BLOG_DIR}`);
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

if (!fs.existsSync(PUBLIC_DIR)) {
  console.log(`📁 Creating public directory: ${PUBLIC_DIR}`);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: '2022-06-28'
});

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllBlocks(block_id) {
  let hasMore = true;
  let nextCursor = null;
  let blocks = [];

  while (hasMore) {
    const response = await notion.blocks.children.list({
      block_id,
      page_size: 100,
      start_cursor: nextCursor
    });

    blocks = blocks.concat(response.results);
    hasMore = response.has_more;
    nextCursor = response.next_cursor;
  }

  // Recursively fetch children for blocks that have them
  for (const block of blocks) {
    if (block.has_children && !block.children) {
      const children = await fetchAllBlocks(block.id);
      block.children = children;
    }
  }

  return blocks;
}

async function fetchPosts() {
  try {
    console.log('📚 Fetching posts from Notion database...');

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
      console.log(`📝 Found ${existingPosts.size} existing posts`);
    } catch (err) {
      console.warn('Warning: Could not read existing posts:', err);
    }

    // Array to store processed posts for JSON
    const processedPosts = [];

    console.log('🔍 Querying Notion database...');
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Published',
            checkbox: {
              equals: true
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

    console.log(`✨ Found ${response.results.length} published posts`);

    let extractedTitle = '';
    for (const page of response.results) {
      // Add delay between processing each post to avoid rate limits
      await delay(1000);
      try {
        // First, fetch the actual page content using the page ID
        console.log(`   📄 Processing post ID: ${page.id}`);
        
        // Get the page properties
        const properties = page.properties || {};
        
        // Get all content blocks
        const allBlocks = await fetchAllBlocks(page.id);
        console.log(`   Found ${allBlocks.length} content blocks`);

        // Process the content blocks
        let content = '';
        for (const block of allBlocks) {
          content += await processBlock(block, extractedTitle);
        }

        // Extract title from the first heading block
        let title = extractedTitle || properties['Title']?.rich_text?.[0]?.plain_text || 'Untitled';
        const slug = title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        
        // Get other properties
        const date = properties['Published Date']?.date?.start || new Date().toISOString();
        const thumbnail = properties['Thumbnail']?.files?.[0]?.file?.url || '';

        // Create post object
        const post = {
          id: page.id,
          title,
          slug,
          date,
          thumbnail,
          content,
          url: `/blog/${slug}`
        };

        // Save to processedPosts
        processedPosts.push(post);

        const filePath = path.join(BLOG_DIR, `${slug}.md`);

        const markdown = `---
title: "${title}"
slug: "${slug}"
date: "${date}"
thumbnail: "${thumbnail || ''}"
---

${content}`;

        // Only write if content has changed
        const existingContent = existingPosts.get(slug);
        if (!existingContent || existingContent !== markdown) {
          console.log(`   💾 Saving updated content for "${title}"`);
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
        } else {
          console.log(`   ⏭️ No changes detected for "${title}"`);
        }
        extractedTitle = '';

      } catch (error) {
        console.error(`Error processing post ${page.id}:`, error);
        console.error('Skipping this post due to error');
      }
    }

    // Generate JSON file
    fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(processedPosts, null, 2), 'utf8');
    console.log(`✅ Successfully generated blog posts JSON with ${processedPosts.length} posts`);

  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    process.exit(1);
  }
}

async function processBlock(block, extractedTitle) {
  try {
    switch (block.type) {
      case 'heading_1':
        if (!extractedTitle) {
          extractedTitle = block.heading_1.rich_text.map(text => text.plain_text).join('');
        }
        return `# ${block.heading_1.rich_text.map(text => text.plain_text).join('')}\n\n`;
      case 'heading_2':
        return `## ${block.heading_2.rich_text.map(text => text.plain_text).join('')}\n\n`;
      case 'heading_3':
        return `### ${block.heading_3.rich_text.map(text => text.plain_text).join('')}\n\n`;
      case 'paragraph':
        return `${block.paragraph.rich_text.map(text => text.plain_text).join('')}\n\n`;
      case 'bulleted_list_item':
        return `- ${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}\n`;
      case 'numbered_list_item':
        return `1. ${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}\n`;
      case 'image':
        const imageUrl = block.image.type === 'external' ? 
          block.image.external.url : 
          block.image.file.url;
        const caption = block.image.caption?.length ? 
          block.image.caption[0].plain_text : '';
        return `![${caption}](${imageUrl})\n\n`;
      case 'embed':
        return `Embed: ${block.embed.url}\n\n`;
      case 'bookmark':
        return `Bookmark: ${block.bookmark.url}\n\n`;
      case 'video':
        return `Video: ${block.video.type === 'external' ? 
          block.video.external.url : 
          block.video.file.url}\n\n`;
      case 'file':
        return `File: ${block.file.type === 'external' ? 
          block.file.external.url : 
          block.file.file.url}\n\n`;
      case 'to_do':
        const checked = block.to_do.checked ? '[x]' : '[ ]';
        return `${checked} ${block.to_do.rich_text.map(text => text.plain_text).join('')}\n\n`;
      case 'toggle':
        const toggleText = block.toggle.rich_text.map(text => text.plain_text).join('');
        return `> ${toggleText}\n\n`;
      case 'table':
        try {
          const rows = block.children || [];
          const formattedRows = rows.map((row) => {
            if (!row?.table_row?.cells) return '';
            return row.table_row.cells.map((cell) => {
              if (!cell || !Array.isArray(cell)) return '';
              return cell.map((text) => text.plain_text).join('');
            }).join(' | ');
          }).filter(Boolean);
          
          if (formattedRows.length > 0) {
            const header = formattedRows[0];
            const separator = formattedRows[0].split(' | ').map(() => '---').join(' | ');
            return `${header}\n${separator}\n${formattedRows.slice(1).join('\n')}\n\n`;
          }
          return '';
        } catch (error) {
          console.error(`Error processing table block ${block.id}:`, error);
          return '';
        }
      default:
        console.warn(`Unknown block type: ${block.type}`);
        return '';
    }
  } catch (error) {
    console.error(`Error processing block ${block.id} (${block.type}):`, error);
    return '';
  }
}

fetchPosts();
