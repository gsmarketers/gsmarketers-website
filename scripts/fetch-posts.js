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
  notionVersion: '2022-06-28' // Set the Notion API version as per the cURL command
});

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch all blocks, handling pagination and nested blocks
async function fetchAllBlocks(blockId) {
  let allBlocks = [];
  let startCursor = undefined;

  try {
    do {
      const response = await notion.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: startCursor
      });

      allBlocks = allBlocks.concat(response.results);
      startCursor = response.next_cursor;
    } while (startCursor);

    // Recursively fetch nested blocks
    for (const block of allBlocks) {
      if (block.has_children) {
        console.log(`   Fetching child blocks for block ${block.id} (type: ${block.type})`);
        const childBlocks = await fetchAllBlocks(block.id);
        block.children = childBlocks;
      }
    }
  } catch (error) {
    console.error(`Error fetching blocks for block ${blockId}:`, error);
    throw error;
  }

  return allBlocks;
}

// Function to process a block and its children into Markdown
function processBlock(block, indentLevel = 0) {
  let blockContent = '';
  const indent = '  '.repeat(indentLevel);

  console.log(`   Processing block ${block.id} (type: ${block.type})`);

  switch (block.type) {
    case 'heading_1':
      blockContent = `${indent}# ${block.heading_1?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'heading_2':
      blockContent = `${indent}## ${block.heading_2?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'heading_3':
      blockContent = `${indent}### ${block.heading_3?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'paragraph':
      blockContent = `${indent}${block.paragraph?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'bulleted_list_item':
      blockContent = `${indent}- ${block.bulleted_list_item?.rich_text?.map((text) => text.plain_text).join('') || ''}\n`;
      break;
    case 'numbered_list_item':
      blockContent = `${indent}1. ${block.numbered_list_item?.rich_text?.map((text) => text.plain_text).join('') || ''}\n`;
      break;
    case 'code':
      blockContent = `${indent}\`\`\`\n${block.code?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\`\`\`\n\n`;
      break;
    case 'quote':
      blockContent = `${indent}> ${block.quote?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'image':
      const imageUrl = block.image?.type === 'external' ? block.image.external.url : block.image?.file?.url;
      const caption = block.image?.caption?.length ? block.image.caption[0].plain_text : '';
      blockContent = imageUrl ? `${indent}![${caption}](${imageUrl})\n\n` : '';
      break;
    default:
      console.log(`   Unsupported block type: ${block.type}`);
      blockContent = '';
      break;
  }

  // Process child blocks recursively
  if (block.has_children && block.children) {
    console.log(`   Processing ${block.children.length} child blocks for block ${block.id}`);
    const childContents = block.children.map(child => processBlock(child, indentLevel + 1)).join('');
    blockContent += childContents;
  }

  return blockContent;
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
      await delay(500);
      try {
        // Safely extract properties with fallbacks
        const properties = page.properties || {};
        // "Title" is a text property, not used as the actual title
        const titleFromProperty = properties?.Title?.text?.[0]?.plain_text || '';
        const slug = (properties.Slug?.type === 'text' && properties.Slug.text?.[0]?.plain_text) ||
          (properties.Slug?.rich_text?.[0]?.plain_text) ||
          titleFromProperty.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const publishedDate = properties['Published Date']?.date?.start;
        const thumbnail = properties.Thumbnail?.files?.[0]?.file?.url;

        console.log(`📄 Processing post ID: ${page.id}, Slug: ${slug}`);

        // Fetch all blocks, including nested ones
        const blocks = await fetchAllBlocks(page.id);

        console.log(`   Found ${blocks.length} content blocks`);

        // Log the raw block data to debug
        console.log('   Raw blocks:', JSON.stringify(blocks, null, 2));

        let extractedTitle = titleFromProperty; // Fallback to the text property
        const contentBlocks = [];
        let isFirstHeading = true;

        // Process all blocks to extract the title (first heading) and content
        for (const block of blocks) {
          await delay(100);

          // Extract the title from the first heading
          if (isFirstHeading) {
            if (block.type === 'heading_1') {
              extractedTitle = block.heading_1?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
              isFirstHeading = false;
            } else if (block.type === 'heading_2') {
              extractedTitle = block.heading_2?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
              isFirstHeading = false;
            } else if (block.type === 'heading_3') {
              extractedTitle = block.heading_3?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
              isFirstHeading = false;
            } else if (block.type === 'paragraph' && block.has_children) {
              // If the paragraph has children, check them for a heading
              if (block.children) {
                const firstChild = block.children.find(child =>
                  ['heading_1', 'heading_2', 'heading_3'].includes(child.type)
                );
                if (firstChild) {
                  extractedTitle = firstChild[firstChild.type]?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
                  isFirstHeading = false;
                }
              }
            }
          }

          // Process the block into Markdown
          const blockContent = processBlock(block);
          if (blockContent) {
            contentBlocks.push(blockContent);
          }
        }

        // Fallback to "Untitled" if no heading was found
        if (!extractedTitle) {
          extractedTitle = 'Untitled';
        }

        const post = {
          title: extractedTitle,
          date: publishedDate || page.created_time,
          thumbnail,
          lastEdited: page.last_edited_time,
          content: contentBlocks.join('')
        };

        console.log(`   Extracted title: ${post.title}`);
        console.log(`   Content length: ${post.content.length} characters`);

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
          console.log(`   💾 Saving updated content for "${post.title}"`);
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
          console.log(`   ⏭️ No changes detected for "${post.title}"`);
        }

        // Add processed post to array for JSON
        processedPosts.push({
          id: page.id,
          slug,
          title: post.title,
          content: post.content,
          thumbnail: post.thumbnail,
          date: post.date,
          lastEdited: post.lastEdited
        });

        console.log(`   Added post to processedPosts. Current count: ${processedPosts.length}`);
      } catch (error) {
        console.error(`Error processing post ${page.id}:`, error);
        console.log('Skipping post due to error');
        continue;
      }
    }

    // Write processed posts to JSON file
    console.log('Final processedPosts:', JSON.stringify(processedPosts, null, 2));
    await writeFile(
      POSTS_JSON_PATH,
      JSON.stringify({ 
        posts: processedPosts,
        lastUpdated: new Date().toISOString()
      }, null, 2),
      'utf8'
    );
    console.log(`✅ Successfully generated blog posts JSON with ${processedPosts.length} posts`);

  } catch (error) {
    console.error('❌ Error during post processing:', error);
    process.exit(1);
  }
}

fetchPosts();
