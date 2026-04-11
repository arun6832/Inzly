import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const notion = new Client({ auth: envVars.NOTION_API_KEY });
const databaseId = envVars.NOTION_DATABASE_ID;

const testCases = [
  {
    title: "User login with valid credentials",
    feature: "Auth",
    description: "Verify user can login successfully via email",
    steps: "1. Go to /login \n2. Enter valid email and password \n3. Click Login",
    expected: "User is redirected to dashboard and authenticated",
    status: "Failed",
    priority: "High",
    assigned: "Alice"
  },
  {
    title: "User signup with existing email",
    feature: "Auth",
    description: "Ensure user cannot register twice with same email",
    steps: "1. Go to /signup \n2. Enter an already registered email \n3. Submit",
    expected: "Error message 'Email already in use' is shown",
    status: "Passed",
    priority: "High",
    assigned: "Bob"
  },
  {
    title: "Create new abstract idea",
    feature: "Ideas",
    description: "Verify user can submit a new idea with tags",
    steps: "1. Go to /create \n2. Fill out title, description, and tags \n3. Click 'Share Idea'",
    expected: "Idea is saved and visible on the Swipe feed",
    status: "Not Started",
    priority: "Medium",
    assigned: "Alice"
  },
  {
    title: "Swipe right on an idea",
    feature: "Swipe",
    description: "Ensure right-swiping saves it to 'Saved'",
    steps: "1. Go to / \n2. Swipe right on an idea card",
    expected: "Card animates right and is added to /saved",
    status: "In Progress",
    priority: "High",
    assigned: "Charlie"
  },
  {
    title: "Swipe left on an idea",
    feature: "Swipe",
    description: "Ensure left-swiping discards the idea",
    steps: "1. Go to / \n2. Swipe left on an idea card",
    expected: "Card animates left and is completely removed from view",
    status: "Not Started",
    priority: "Medium",
    assigned: "Charlie"
  },
  {
    title: "Send a message in discussion",
    feature: "Discussion",
    description: "Verify users can send real-time chat messages",
    steps: "1. Go to /messages/[id] \n2. Type 'Hello' in input \n3. Hit Enter",
    expected: "Message appears instantly in chat log",
    status: "Passed",
    priority: "Medium",
    assigned: "Alice"
  },
  {
    title: "Edit profile bio",
    feature: "Profile",
    description: "Ensure user can update their own bio",
    steps: "1. Go to /user/[username] \n2. Click Edit \n3. Change bio text \n4. Save",
    expected: "New bio is displayed on the profile page",
    status: "Not Started",
    priority: "Low",
    assigned: "Bob"
  },
  {
    title: "View Leaderboard ranking",
    feature: "Leaderboard",
    description: "Verify leaderboard shows top creators correctly",
    steps: "1. Go to /leaderboard \n2. View top users",
    expected: "Users are ordered by score descending",
    status: "Not Started",
    priority: "Medium",
    assigned: "Charlie"
  },
  {
    title: "Load Idea Detail page",
    feature: "Ideas",
    description: "Ensure clicking an idea opens full detail view",
    steps: "1. Go to /saved \n2. Click on a saved idea snippet",
    expected: "User is navigated to /idea/[id] and full info loads",
    status: "In Progress",
    priority: "High",
    assigned: "Alice"
  },
  {
    title: "Github Repository Link Integration",
    feature: "Ideas",
    description: "Verify unauthenticated users can see Github link on Idea card",
    steps: "1. Use incognito window \n2. Load a swipe card with github link \n3. Check for Github icon",
    expected: "Github icon is visible and points to correct repo",
    status: "Not Started",
    priority: "Low",
    assigned: "Bob"
  }
];

function buildNotionProperties(testCase) {
  return {
    Name: { title: [{ text: { content: testCase.title } }] },
    Feature: { select: { name: testCase.feature } },
    Description: { rich_text: [{ text: { content: testCase.description } }] },
    Steps: { rich_text: [{ text: { content: testCase.steps } }] },
    'Expected Result': { rich_text: [{ text: { content: testCase.expected } }] },
    Status: { select: { name: testCase.status } },
    Priority: { select: { name: testCase.priority } },
    'Assigned Tester': { rich_text: [{ text: { content: testCase.assigned } }] },
    'Created At': { date: { start: new Date().toISOString() } },
  };
}

async function run() {
  for (const tc of testCases) {
    try {
      const properties = buildNotionProperties(tc);
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties,
      });
      console.log(`Created: ${tc.title}`);
    } catch (err) {
      console.error(`Error with ${tc.title}:`, err.message);
    }
  }
  console.log('Script completely finished.');
}

run();
