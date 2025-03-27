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
      if (block.heading_1?.is_toggleable) {
        blockContent = `${indent}<details><summary>${block.heading_1?.rich_text?.map((text) => text.plain_text).join('') || ''}</summary>\n\n`;
      }
      break;
    case 'heading_2':
      blockContent = `${indent}## ${block.heading_2?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      if (block.heading_2?.is_toggleable) {
        blockContent = `${indent}<details><summary>${block.heading_2?.rich_text?.map((text) => text.plain_text).join('') || ''}</summary>\n\n`;
      }
      break;
    case 'heading_3':
      blockContent = `${indent}### ${block.heading_3?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      if (block.heading_3?.is_toggleable) {
        blockContent = `${indent}<details><summary>${block.heading_3?.rich_text?.map((text) => text.plain_text).join('') || ''}</summary>\n\n`;
      }
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
      blockContent = `${indent}\`\`\`${block.code?.language || ''}\n${block.code?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\`\`\`\n\n`;
      break;
    case 'quote':
      blockContent = `${indent}> ${block.quote?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'image':
      const imageUrl = block.image?.type === 'external' ? block.image.external.url : block.image?.file?.url;
      const imageCaption = block.image?.caption?.length ? block.image.caption.map((text) => text.plain_text).join('') : '';
      blockContent = imageUrl ? `${indent}![${imageCaption}](${imageUrl})\n\n` : '';
      break;
    case 'callout':
      const calloutIcon = block.callout?.icon?.emoji || block.callout?.icon?.external?.url || '';
      blockContent = `${indent}> ${calloutIcon} ${block.callout?.rich_text?.map((text) => text.plain_text).join('') || ''}\n\n`;
      break;
    case 'divider':
      blockContent = `${indent}---\n\n`;
      break;
    case 'child_page':
      blockContent = `${indent}[Child Page: ${block.child_page?.title || 'Untitled'}](https://www.notion.so/${block.id.replace(/-/g, '')})\n\n`;
      break;
    case 'column_list':
      // Column lists are just containers; process children (columns) directly
      blockContent = '';
      break;
    case 'column':
      // Columns are processed as part of column_list; just process their children
      blockContent = '';
      break;
    case 'embed':
      blockContent = `${indent}[Embed: ${block.embed?.url || ''}](${block.embed?.url || ''})\n\n`;
      break;
    case 'bookmark':
      blockContent = `${indent}[Bookmark: ${block.bookmark?.url || ''}](${block.bookmark?.url || ''})\n\n`;
      break;
    case 'breadcrumb':
      blockContent = `${indent}*(Breadcrumb navigation)*\n\n`;
      break;
    case 'child_database':
      blockContent = `${indent}*(Child Database: ${block.child_database?.title || 'Untitled'})*\n\n`;
      break;
    case 'equation':
      blockContent = `${indent}\$\$${block.equation?.expression || ''}\$\$\n\n`;
      break;
    case 'file':
      const fileUrl = block.file?.type === 'external' ? block.file.external.url : block.file?.file?.url;
      const fileCaption = block.file?.caption?.length ? block.file.caption.map((text) => text.plain_text).join('') : '';
      blockContent = fileUrl ? `${indent}[File: ${fileCaption || 'Download'}](${fileUrl})\n\n` : '';
      break;
    case 'synced_block':
      // Synced blocks reference another block; process their children
      blockContent = '';
      break;
    case 'pdf':
      const pdfUrl = block.pdf?.type === 'external' ? block.pdf.external.url : block.pdf?.file?.url;
      const pdfCaption = block.pdf?.caption?.length ? block.pdf.caption.map((text) => text.plain_text).join('') : '';
      blockContent = pdfUrl ? `${indent}[PDF: ${pdfCaption || 'View PDF'}](${pdfUrl})\n\n` : '';
      break;
    case 'table':
      if (block.has_children && block.children) {
        // Get table width from first row
        const tableWidth = block.children[0]?.table_row?.cells?.length || 0;
        
        // Process rows
        const rows = block.children.map((row, rowIndex) => {
          const cells = row.table_row?.cells || [];
          // Ensure each cell has content and proper spacing
          const formattedCells = cells.map(cell => {
            const cellContent = cell.map(text => text.plain_text).join('').trim();
            return cellContent || ' ';
          });
          
          // Pad cells to match table width
          while (formattedCells.length < tableWidth) {
            formattedCells.push(' ');
          }
          
          return `| ${formattedCells.join(' | ')} |`;
        });
        
        // Create header separator
        const separator = `|${Array(tableWidth).fill('---').map(s => ` ${s} `).join('|')}|`;
        
        // Combine all parts with proper spacing
        blockContent = `\n${rows[0]}\n${separator}\n${rows.slice(1).join('\n')}\n\n`;
      }
      break;
    case 'to_do':
      const checked = block.to_do?.checked ? '[x]' : '[ ]';
      blockContent = `${indent}- ${checked} ${block.to_do?.rich_text?.map((text) => text.plain_text).join('') || ''}\n`;
      break;
    case 'toggle':
      blockContent = `${indent}<details><summary>${block.toggle?.rich_text?.map((text) => text.plain_text).join('') || ''}</summary>\n\n`;
      break;
    case 'video':
      const videoUrl = block.video?.type === 'external' ? block.video.external.url : block.video?.file?.url;
      const videoCaption = block.video?.caption?.length ? block.video.caption.map((text) => text.plain_text).join('') : '';
      blockContent = videoUrl ? `${indent}[Video: ${videoCaption || 'Watch Video'}](${videoUrl})\n\n` : '';
      break;
    case 'table_of_contents':
      blockContent = `${indent}*(Table of Contents)*\n\n`;
      break;
    case 'mention':
      const mentionText = block.mention?.type === 'page' ? `[Page Mention: ${block.mention.page.id}](https://www.notion.so/${block.mention.page.id.replace(/-/g, '')})` :
        block.mention?.type === 'user' ? `@${block.mention.user?.name || 'User'}` :
        block.mention?.type === 'date' ? block.mention.date?.start || '' : '*(Mention)*';
      blockContent = `${indent}${mentionText}\n`;
      break;
    case 'link_preview':
      blockContent = `${indent}[Link Preview: ${block.link_preview?.url || ''}](${block.link_preview?.url || ''})\n\n`;
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
    // Close toggle blocks if applicable
    if (['heading_1', 'heading_2', 'heading_3', 'toggle'].includes(block.type) && (block[block.type]?.is_toggleable || block.type === 'toggle')) {
      blockContent += `${indent}</details>\n\n`;
    }
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
        const titleFromProperty = properties?.Title?.text?.[0]?.plain_text || '';
        const slug = (properties.Slug?.type === 'text' && properties.Slug.text?.[0]?.plain_text) ||
          (properties.Slug?.rich_text?.[0]?.plain_text) ||
          titleFromProperty.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const publishedDate = properties['Published Date']?.date?.start;
        // Handle both external and internal thumbnail URLs
        const thumbnail = properties.Thumbnail?.files?.[0]?.type === 'external' 
          ? properties.Thumbnail.files[0].external.url
          : properties.Thumbnail?.files?.[0]?.file?.url;

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

          // Extract the title from the first heading, prioritizing heading_1
          if (isFirstHeading) {
            if (block.type === 'heading_1') {
              extractedTitle = block.heading_1?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
              isFirstHeading = false;
            } else if (block.type === 'heading_2' && isFirstHeading) {
              extractedTitle = block.heading_2?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
              isFirstHeading = false;
            } else if (block.type === 'heading_3' && isFirstHeading) {
              extractedTitle = block.heading_3?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
              isFirstHeading = false;
            } else if (block.type === 'paragraph' && block.has_children) {
              // Check nested blocks for a heading
              if (block.children) {
                const firstChildHeading = block.children.find(child =>
                  ['heading_1', 'heading_2', 'heading_3'].includes(child.type)
                );
                if (firstChildHeading) {
                  extractedTitle = firstChildHeading[firstChildHeading.type]?.rich_text?.map((text) => text.plain_text).join('') || extractedTitle;
                  isFirstHeading = false;
                }
              }
            } else if (block.type === 'paragraph' && !block.has_children && isFirstHeading) {
              const paragraphText = block.paragraph?.rich_text?.map((text) => text.plain_text).join('') || '';
              if (paragraphText) {
                extractedTitle = paragraphText;
                isFirstHeading = false;
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
        console.log(`   Full content: ${post.content}`); // Log the full content for debugging

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
          thumbnail: post.thumbnail || '/blog-placeholder.jpg',  // Fallback image
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
