import { Client } from '@notionhq/client';

const notion = new Client({
  auth: import.meta.env.VITE_NOTION_TOKEN
});

export interface NotionPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  coverImage?: string;
  date: string;
  published: boolean;
}

export async function getPosts(page = 1, pageSize = 10): Promise<{
  posts: NotionPost[];
  totalPages: number;
}> {
  if (!import.meta.env.VITE_NOTION_TOKEN || !import.meta.env.VITE_NOTION_DATABASE_ID) {
    throw new Error('Notion configuration not found');
  }

  try {
    const response = await notion.databases.query({
      database_id: import.meta.env.VITE_NOTION_DATABASE_ID,
      page_size: pageSize,
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
      ]
    });

    const posts: NotionPost[] = await Promise.all(
      response.results.map(async (page: any) => {
        // Get the page content blocks
        const blocks = await notion.blocks.children.list({
          block_id: page.id
        });

        const content = await processBlocks(blocks.results);

        return {
          id: page.id,
          slug: page.properties.Slug?.rich_text[0]?.plain_text || page.id,
          title: page.properties.Title?.title[0]?.plain_text || 'Untitled',
          content,
          coverImage: page.properties.CoverImage?.files[0]?.file?.url || undefined,
          date: page.properties['Published Date']?.date?.start || new Date().toISOString(),
          published: page.properties.Published?.checkbox || false
        };
      })
    );

    const totalPages = Math.ceil(response.total / pageSize);
    return { posts, totalPages };
  } catch (error) {
    console.error('Error fetching Notion posts:', error);
    throw error;
  }
}

export async function getPost(slug: string): Promise<NotionPost | null> {
  if (!import.meta.env.VITE_NOTION_TOKEN || !import.meta.env.VITE_NOTION_DATABASE_ID) {
    throw new Error('Notion configuration not found');
  }

  try {
    const response = await notion.databases.query({
      database_id: import.meta.env.VITE_NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Slug',
            rich_text: {
              equals: slug
            }
          },
          {
            property: 'Published',
            checkbox: {
              equals: true
            }
          }
        ]
      }
    });

    if (!response.results.length) {
      return null;
    }

    const page = response.results[0];
    const blocks = await notion.blocks.children.list({
      block_id: page.id
    });

    const content = await processBlocks(blocks.results);

    return {
      id: page.id,
      slug: page.properties.Slug?.rich_text[0]?.plain_text || page.id,
      title: page.properties.Title?.title[0]?.plain_text || 'Untitled',
      content,
      coverImage: page.properties.CoverImage?.files[0]?.file?.url || undefined,
      date: page.properties['Published Date']?.date?.start || new Date().toISOString(),
      published: page.properties.Published?.checkbox || false
    };
  } catch (error) {
    console.error('Error fetching Notion post:', error);
    throw error;
  }
}

async function processBlocks(blocks: any[]): Promise<string> {
  const contentBlocks = await Promise.all(blocks.map(async (block: any) => {
    if (block.type === 'child_page') {
      const childBlocks = await notion.blocks.children.list({
        block_id: block.id
      });
      return processBlocks(childBlocks.results);
    }

    switch (block.type) {
      case 'paragraph':
        return block.paragraph.rich_text.map((text: any) => text.plain_text).join('') + '\n\n';
      case 'heading_1':
        return '# ' + block.heading_1.rich_text.map((text: any) => text.plain_text).join('') + '\n\n';
      case 'heading_2':
        return '## ' + block.heading_2.rich_text.map((text: any) => text.plain_text).join('') + '\n\n';
      case 'heading_3':
        return '### ' + block.heading_3.rich_text.map((text: any) => text.plain_text).join('') + '\n\n';
      case 'bulleted_list_item':
        return '- ' + block.bulleted_list_item.rich_text.map((text: any) => text.plain_text).join('') + '\n';
      case 'numbered_list_item':
        return '1. ' + block.numbered_list_item.rich_text.map((text: any) => text.plain_text).join('') + '\n';
      case 'code':
        return '```\n' + block.code.rich_text.map((text: any) => text.plain_text).join('') + '\n```\n\n';
      case 'quote':
        return '> ' + block.quote.rich_text.map((text: any) => text.plain_text).join('') + '\n\n';
      case 'image':
        const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        const caption = block.image.caption?.length ? block.image.caption[0].plain_text : '';
        return `![${caption}](${imageUrl})\n\n`;
      default:
        return '';
    }
  }));

  return contentBlocks.join('');
}
