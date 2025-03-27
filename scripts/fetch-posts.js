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
  let nextCursor = null;
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
        // Fetch all blocks for the page
        const blocks = await fetchAllBlocks(page.id);
        
        console.log(`   Found ${blocks.length} content blocks`);

        const properties = page.properties || {};
        
        // Extract title from Page Content field
        const pageContent = properties['Page Content']?.title || [];
        extractedTitle = pageContent.length > 0
          ? pageContent.map(text => text.plain_text).join('')
          : 'Untitled';
        
        // Get full property values for properties that might exceed 25 references
        const slugProperty = await fetchPageProperties(page.id, 'Slug');
        const dateProperty = await fetchPageProperties(page.id, 'Published Date');
        const thumbnailProperty = await fetchPageProperties(page.id, 'Thumbnail');

        const slug = slugProperty?.rich_text?.[0]?.plain_text || 
          extractedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const publishedDate = dateProperty?.date?.start;
        const thumbnail = thumbnailProperty?.files?.[0]?.file?.url;
        
        console.log(`📄 Processing post: "${extractedTitle}" (${slug})`);
        
        const content = await Promise.all(blocks.map(async (block) => {
          // Add small delay between block processing
          await delay(200);
          
          try {
            switch (block.type) {
              case 'paragraph':
                return block.paragraph.rich_text.map((text) => {
                  const plainText = text.plain_text;
                  if (text.annotations.bold) return `**${plainText}**`;
                  if (text.annotations.italic) return `*${plainText}*`;
                  if (text.annotations.strikethrough) return `~~${plainText}~~`;
                  if (text.annotations.code) return `{${plainText}}`;
                  if (text.annotations.color !== 'default') {
                    return `{${text.annotations.color} ${plainText}}`;
                  }
                  return plainText;
                }).join('') + '\n\n';
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
                const language = block.code.language || 'text';
                return '```' + language + '\n' + 
                       block.code.rich_text.map((text) => text.plain_text).join('') + 
                       '\n``\n\n';
              case 'quote':
                return '> ' + block.quote.rich_text.map((text) => text.plain_text).join('') + '\n\n';
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
                return `${checked} ${block.to_do.rich_text.map((text) => text.plain_text).join('')}\n\n`;
              case 'toggle':
                const toggleText = block.toggle.rich_text.map((text) => text.plain_text).join('');
                return `> ${toggleText}\n\n`;
              case 'table':
                const rows = block.table.children.map((row) => 
                  row.table_row.cells.map((cell) => 
                    cell.map((text) => text.plain_text).join('')
                  ).join(' | ')
                );
                return rows.join('\n') + '\n\n';
              case 'table_row':
                return '';
              case 'table_cell':
                return '';
              case 'column_list':
                return '';
              case 'column':
                return '';
              case 'synced_block':
                return '';
              case 'template':
                return '';
              case 'child_page':
                return '';
              case 'child_database':
                return '';
              case 'link_preview':
                return '';
              case 'link_to_page':
                return '';
              case 'unsupported':
                return '';
              default:
                console.warn(`Unhandled block type: ${block.type}`);
                return '';
            }
          } catch (blockError) {
            console.error(`Error processing block ${block.id}:`, blockError);
            return '';
          }
        }));

        // Clean up content by removing extra newlines and empty lines
        const cleanedContent = content.join('').replace(/\n\n+/g, '\n\n').trim();

        // Convert markdown to HTML for preview
        const processedContent = cleanedContent
          ? cleanedContent
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Convert links
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold
              .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert italic
              .replace(/~~(.*?)~~/g, '<del>$1</del>') // Convert strikethrough
              .replace(/\{(.*?)\}/g, '<span class="code">$1</span>') // Convert code
              .replace(/\n\n/g, '<br><br>') // Convert newlines to HTML breaks
              .replace(/\n/g, '<br>') // Convert single newlines to HTML breaks
              .replace(/`(.*?)`/g, '<code>$1</code>') // Convert inline code
              .replace(/```(.*?)```/g, '<pre><code>$1</code></pre>') // Convert code blocks
              .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">') // Convert images
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Convert links
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Convert links
          : 'No content available';

        const post = {
          id: page.id,
          slug,
          title: extractedTitle,
          content: cleanedContent, // Store raw markdown
          processedContent, // Store processed HTML for preview
          thumbnail,
          date: publishedDate || page.created_time,
          lastEdited: page.last_edited_time
        };

        const filePath = path.join(BLOG_DIR, `${slug}.md`);

        const markdown = `---
title: "${post.title.replace(/"/g, '\\"')}"
date: "${post.date}"
thumbnail: "${post.thumbnail || ''}"
lastEdited: "${post.lastEdited}"
---

${post.content}`;

        // Only write if content has changed
        const existingContent = existingPosts.get(slug);
        if (!existingContent || existingContent !== markdown) {
          console.log(`   💾 Saving updated content for "${extractedTitle}"`);
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
          console.log(`   ⏭️ No changes detected for "${extractedTitle}"`);
        }

        // Add processed post to array for JSON
        processedPosts.push({
          id: page.id,
          slug,
          title: post.title,
          content: post.content,
          processedContent: post.processedContent,
          thumbnail: post.thumbnail,
          date: post.date,
          lastEdited: post.lastEdited
        });
        console.log(`Added post to processedPosts. Current count: ${processedPosts.length}`);

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
