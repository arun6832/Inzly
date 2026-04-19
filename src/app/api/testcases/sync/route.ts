import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

interface TestCase {
  title: string;
  feature: string;
  description: string;
  steps: string;
  expected: string;
  status: string;
  priority: string;
  assigned: string;
}

export async function POST(request: Request) {
  if (!process.env.NOTION_API_KEY || !databaseId) {
    return NextResponse.json(
      { error: 'Missing Notion configuration. Check NOTION_API_KEY and NOTION_DATABASE_ID in environment variables.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { testCases } = body;

    if (!Array.isArray(testCases)) {
      return NextResponse.json(
        { error: 'Invalid input format. Expected { "testCases": [...] }' },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    // Process each testcase
    for (const testCase of testCases as TestCase[]) {
      try {
        if (!testCase.title) {
          errors.push({ title: 'Unknown', error: 'Missing title' });
          continue;
        }

        // Query if test case exists by title
        const existingPages = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Test Name',
            title: {
              equals: testCase.title,
            },
          },
        });

        // Map properties
        const properties = buildNotionProperties(testCase);

        if (existingPages.results.length > 0) {
          // Update existing page
          const pageId = existingPages.results[0].id;
          await notion.pages.update({
            page_id: pageId,
            properties: properties as any,
          });
          updatedCount++;
        } else {
          // Create new page
          await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties as any,
          });
          createdCount++;
        }
      } catch (err: any) {
        console.error(`Error processing testcase "${testCase.title}":`, err);
        errors.push({ title: testCase.title, error: err.message });
      }
    }

    return NextResponse.json({
      message: 'Sync complete',
      created: createdCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Internal server error while syncing test cases.', detail: error.message },
      { status: 500 }
    );
  }
}

// Helper to map JSON to Notion properties
function buildNotionProperties(testCase: TestCase) {
  return {
    'Test Name': {
      title: [
        {
          text: {
            content: testCase.title || 'Untitled Test Case',
          },
        },
      ],
    },
    'Test Type': {
      select: {
        name: testCase.feature || 'Functional',
      },
    },
    'Environment': {
      select: {
        name: 'Staging',
      },
    },
    'Build Version': {
      rich_text: [
        {
          text: {
            content: testCase.steps ? 'v1.0.0 (With Steps)' : 'v1.0.0',
          },
        },
      ],
    },
    'Status': {
      status: {
        name: 'Not started',
      },
    },
    'Description': {
      rich_text: [
        {
          text: {
            content: testCase.description || '',
          },
        },
      ],
    },
    'Priority': {
      select: {
        name: testCase.priority || 'Medium',
      },
    },
    'Last Run Date': {
      date: {
        start: new Date().toISOString(),
      },
    },
  };
}
