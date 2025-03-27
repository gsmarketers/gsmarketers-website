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
  let results = [];
  let nextCursor = undefined;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await notion.blocks.children.list({
        block_id,
        start_cursor: nextCursor,
        page_size: 100
      });
      
      results = [...results, ...response.results];
      nextCursor = response.next_cursor;
      hasMore = response.has_more;

      // Process nested blocks
      for (const block of response.results) {
        if (block.has_children) {
          const nestedBlocks = await fetchAllBlocks(block.id);
          results = [...results, ...nestedBlocks];
        }
      }
    } catch (error) {
      console.error(`Error fetching blocks for ${block_id}:`, error);
      throw error;
    }
  }

  return results;
}

async function fetchPageProperties(page_id, property_name) {
  try {
    const response = await notion.pages.properties.retrieve({
      page_id,
      property_id: property_name
    });
    return response;
  } catch (error) {
    console.error(`Error fetching property ${property_name} for page ${page_id}:`, error);
    return null;
  }
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

    for (const page of response.results) {
      // Add delay between processing each post to avoid rate limits
      await delay(1000);
      let extractedTitle = '';
      try {
        // First, fetch the actual page content using the page ID
        console.log(`   📄 Processing post ID: ${page.id}`);
        
        // Get the page content
        const pageContent = await notion.blocks.children.list({
          block_id: page.id,
          page_size: 100
        });

        // Process the content blocks
        let content = '';
        for (const block of pageContent.results) {
          // Handle different block types
          switch (block.type) {
            case 'heading_1':
              if (!extractedTitle) {
                extractedTitle = block.heading_1.rich_text.map(text => text.plain_text).join('');
              }
              content += `# ${block.heading_1.rich_text.map(text => text.plain_text).join('')}\n\n`;
              break;
            case 'heading_2':
              content += `## ${block.heading_2.rich_text.map(text => text.plain_text).join('')}\n\n`;
              break;
            case 'heading_3':
              content += `### ${block.heading_3.rich_text.map(text => text.plain_text).join('')}\n\n`;
              break;
            case 'paragraph':
              content += `${block.paragraph.rich_text.map(text => text.plain_text).join('')}\n\n`;
              break;
            case 'bulleted_list_item':
              content += `- ${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}\n`;
              break;
            case 'numbered_list_item':
              content += `1. ${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}\n`;
              break;
            case 'image':
              const imageUrl = block.image.type === 'external' ? 
                block.image.external.url : 
                block.image.file.url;
              const caption = block.image.caption?.length ? 
                block.image.caption[0].plain_text : '';
              content += `![${caption}](${imageUrl})\n\n`;
              break;
            case 'embed':
              content += `Embed: ${block.embed.url}\n\n`;
              break;
            case 'bookmark':
              content += `Bookmark: ${block.bookmark.url}\n\n`;
              break;
            case 'video':
              content += `Video: ${block.video.type === 'external' ? 
                block.video.external.url : 
                block.video.file.url}\n\n`;
              break;
            case 'file':
              content += `File: ${block.file.type === 'external' ? 
                block.file.external.url : 
                block.file.file.url}\n\n`;
              break;
            case 'to_do':
              const checked = block.to_do.checked ? '[x]' : '[ ]';
              content += `${checked} ${block.to_do.rich_text.map(text => text.plain_text).join('')}\n\n`;
              break;
            case 'toggle':
              const toggleText = block.toggle.rich_text.map(text => text.plain_text).join('');
              content += `> ${toggleText}\n\n`;
              break;
            case 'table':
              try {
                // Get the table's children (rows)
                const rows = block.children || [];
                const formattedRows = rows.map((row) => {
                  if (!row?.table_row?.cells) return '';
                  return row.table_row.cells.map((cell) => {
                    if (!cell || !Array.isArray(cell)) return '';
                    return cell.map((text) => text.plain_text).join('');
                  }).join(' | ');
                }).filter(Boolean); // Remove empty rows
                
                // Add table headers with markdown formatting
                if (formattedRows.length > 0) {
                  const header = formattedRows[0];
                  const separator = formattedRows[0].split(' | ').map(() => '---').join(' | ');
                  content += `${header}\n${separator}\n${formattedRows.slice(1).join('\n')}\n\n`;
                }
              } catch (error) {
                console.error(`Error processing table block ${block.id}:`, error);
              }
              break;
            default:
              console.warn(`Unknown block type: ${block.type}`);
              break;
          }
        }

        // Get page properties
        const properties = page.properties || {};
        
        // Extract title from the first heading block
        let title = extractedTitle || 'Untitled';
        
        // Get other properties
        const date = properties['Published Date']?.date?.start || new Date().toISOString();
        const thumbnail = properties['Thumbnail']?.files?.[0]?.file?.url || '';

        // Create post object
        const post = {
          id: page.id,
          title,
          slug: title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, ''),
          date,
          thumbnail,
          content,
          url: `/blog/${post.slug}`
        };

        // Save to processedPosts
        processedPosts.push(post);

        const filePath = path.join(BLOG_DIR, `${post.slug}.md`);

        const markdown = `---
title: "${post.title}"
slug: "${post.slug}"
date: "${post.date}"
thumbnail: "${post.thumbnail || ''}"
---

${post.content}`;

        // Only write if content has changed
        const existingContent = existingPosts.get(post.slug);
        if (!existingContent || existingContent !== markdown) {
          console.log(`   💾 Saving updated content for "${post.title}"`);
          // Create backup before writing
          if (fs.existsSync(filePath)) {
            const backupPath = path.join(BLOG_DIR, '.backups');
            if (!fs.existsSync(backupPath)) {
              fs.mkdirSync(backupPath);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.copyFileSync(filePath, path.join(backupPath, `${post.slug}-${timestamp}.md`));
          }

          // Write new content
          fs.writeFileSync(filePath, markdown, 'utf8');
        } else {
          console.log(`   ⏭️ No changes detected for "${post.title}"`);
        }

      } catch (error) {
        console.error(`Error processing post ${page.id}:`, error);
        console.error('Skipping this post due to error');
        continue;
      }
    }

    // Write the JSON file
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    const postsJson = {
      posts: processedPosts,
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(postsJson, null, 2), 'utf8');
    console.log(`✅ Successfully generated blog posts JSON with ${processedPosts.length} posts`);

  } catch (error) {
    console.error('❌ Error in fetchPosts:', error);
    throw error;
  }
}

fetchPosts();
