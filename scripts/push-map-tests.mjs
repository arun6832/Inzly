import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

const testCases = [
  {
    title: "Map 25+ km bounds loading",
    feature: "Map",
    priority: "High",
  },
  {
    title: "Global filter unlocks bounds & zooms",
    feature: "Map",
    priority: "High",
  },
  {
    title: "Snapchat aesthetic heatmap rendering",
    feature: "Map",
    priority: "High",
  }
];

function buildNotionProperties(testCase) {
  return {
    'Test Name': { title: [{ text: { content: testCase.title || 'Untitled Test Case' } }] },
    'Test Type': { select: { name: 'Functional Testing' } },
    'Environment': { select: { name: 'Staging' } },
    'Status': { status: { name: 'Not started' } },
    'Priority': { select: { name: testCase.priority || 'Medium' } },
    'Build Version': { rich_text: [{ text: { content: 'v1.0.0' } }] },
    'Last Run Date': { date: { start: new Date().toISOString() } }
  };
}

async function pushTestCases() {
  console.log(`Pushing Map test cases to Notion Database: ${databaseId}...`);
  let successCount = 0;
  
  for (const testCase of testCases) {
    try {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: buildNotionProperties(testCase),
      });
      console.log(`[Success] Created: ${testCase.title}`);
      successCount++;
    } catch (err) {
      console.error(`[Error] Failed to create: ${testCase.title} - ${err.message}`);
    }
  }
  
  console.log(`\n🎉 Successfully pushed ${successCount}/${testCases.length} Map test cases to Notion!`);
}

pushTestCases();
