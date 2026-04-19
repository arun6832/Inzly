import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

const testCases = [
  {
    title: "Basic User Signup Flow",
    feature: "Auth",
    description: "Verify that a new user can successfully register with valid credentials.",
    steps: "1. Go to /signup\n2. Enter name, valid email, and password\n3. Click 'Create Account'",
    expected: "Account is created in Firebase, user is redirected to the home feed.",
    priority: "High"
  },
  {
    title: "Invalid Login Error Handling",
    feature: "Auth",
    description: "Ensure that users see a clear error message when entering wrong credentials.",
    steps: "1. Go to /login\n2. Enter an unregistered email or wrong password\n3. Click 'Login'",
    expected: "Error toast appears indicating 'Invalid email or password'.",
    priority: "High"
  },
  {
    title: "Forgot Password Redirection",
    feature: "Auth",
    description: "Verify the link to reset password works.",
    steps: "1. Go to /login\n2. Click 'Forgot Password?'",
    expected: "User is navigated to the password reset request page.",
    priority: "Medium"
  },
  {
    title: "Logout Functionality",
    feature: "Auth",
    description: "Verify that logging out terminates the session and redirects correctly.",
    steps: "1. Click the Logout button in the navbar/profile menu.",
    expected: "User is redirected to /login and cannot access protected routes.",
    priority: "High"
  },
  {
    title: "Logo Navigation Logic",
    feature: "Navigation",
    description: "Ensure the brand logo always returns the user to the starting point.",
    steps: "1. Navigate to any subpage (e.g., /saved)\n2. Click the 'Inzly' logo in the navbar.",
    expected: "User is redirected back to the main landing page or home feed.",
    priority: "Low"
  },
  {
    title: "Swipe Right Action (Like)",
    feature: "Swipe",
    description: "Verify that right-swiping correctly flags an idea as liked.",
    steps: "1. On the home feed, swipe an idea card to the right.",
    expected: "Card animates right and is added to the 'Saved' list database.",
    priority: "High"
  },
  {
    title: "Swipe Left Action (Nope)",
    feature: "Swipe",
    description: "Verify that left-swiping correctly discards an idea.",
    steps: "1. On the home feed, swipe an idea card to the left.",
    expected: "Card animates left and is removed from the current session queue.",
    priority: "High"
  },
  {
    title: "Button Interaction (Like Icon)",
    feature: "Swipe",
    description: "Verify manual button clicks behave the same as gestures.",
    steps: "1. Click the Heart button on an idea card.",
    expected: "The card triggers the 'Like' animation and is saved.",
    priority: "Medium"
  },
  {
    title: "Empty Feed State",
    feature: "Swipe",
    description: "Ensure the UI handles the end of the idea stack gracefully.",
    steps: "1. Swipe through all available ideas in the feed.",
    expected: "A 'You've caught up!' screen or similar empty state appears.",
    priority: "Medium"
  },
  {
    title: "Create Idea Page Accessibility",
    feature: "Ideas",
    description: "Verify the submission form is reachable.",
    steps: "1. Click 'Post Idea' or navigate to /create.",
    expected: "The idea submission form loads without errors.",
    priority: "High"
  },
  {
    title: "Field Validation on Idea Post",
    feature: "Ideas",
    description: "Ensure users cannot post empty or incomplete ideas.",
    steps: "1. Leave all fields empty on /create\n2. Click 'Submit'",
    expected: "Validation errors appear for Title and Description fields.",
    priority: "Medium"
  },
  {
    title: "Idea Detail View Content",
    feature: "Ideas",
    description: "Verify the detail page shows all necessary metadata.",
    steps: "1. Click 'Read Details' on any idea card.",
    expected: "Full description, tags, and architect info are displayed.",
    priority: "High"
  },
  {
    title: "Message Architect Visibility",
    feature: "Ideas",
    description: "Ensure the message option is available for collaboration.",
    steps: "1. View an idea detail page belonging to another user.",
    expected: "The 'Message Architect' button is visible and active.",
    priority: "High"
  },
  {
    title: "Edit Idea Restriction",
    feature: "Ideas",
    description: "Verify users cannot edit ideas they don't own.",
    steps: "1. View an idea belonging to another user.",
    expected: "No 'Edit' or 'Management' tools are visible.",
    priority: "High"
  },
  {
    title: "Map Marker Interaction",
    feature: "Map",
    description: "Verify clicking a marker shows relevant info.",
    steps: "1. Navigate to /map\n2. Click on any innovation node (marker).",
    expected: "A preview card/tooltip appears with the idea title and summary.",
    priority: "Medium"
  },
  {
    title: "Map Filter Persistence",
    feature: "Map",
    description: "Ensure selected filters (e.g., Distance) apply correctly.",
    steps: "1. Select '25km' filter on the map.",
    expected: "Only markers within that radius are displayed on the viewport.",
    priority: "Medium"
  },
  {
    title: "Map Responsive Zoom",
    feature: "Map",
    description: "Verify clustering logic during zoom events.",
    steps: "1. Zoom out on the map using scroll or pinch gestures.",
    expected: "Markers cluster together smoothly as the zoom level decreases.",
    priority: "Low"
  },
  {
    title: "Saved Ideas List Loading",
    feature: "Saved Ideas",
    description: "Verify users can access their collection easily.",
    steps: "1. Navigate to /saved.",
    expected: "All previously 'Liked' ideas appear in the list.",
    priority: "High"
  },
  {
    title: "Remove from Saved",
    feature: "Saved Ideas",
    description: "Verify un-saving logic works as expected.",
    steps: "1. On the /saved page, click the 'Remove' or 'Unsave' icon.",
    expected: "The idea is instantly removed from the view and persistent storage.",
    priority: "Medium"
  },
  {
    title: "Profile Data Display",
    feature: "Profile",
    description: "Ensure user statistics are correctly rendered.",
    steps: "1. Navigate to your own profile /user/[username].",
    expected: "Name, bio, and total engagement score are visible.",
    priority: "Medium"
  },
  {
    title: "Profile Portfolio Items",
    feature: "Profile",
    description: "Verify all posted ideas appear on the profile.",
    steps: "1. View a user's profile.",
    expected: "A list/grid of their submitted ideas is displayed at the bottom.",
    priority: "Medium"
  },
  {
    title: "Recent Chats Ordering",
    feature: "Messaging",
    description: "Ensure most active conversations are at the top.",
    steps: "1. Receive a new message from a user you haven't talked to recently.",
    expected: "Their conversation moves to the first position in the chat list.",
    priority: "Medium"
  },
  {
    title: "Send Chat Message",
    feature: "Messaging",
    description: "Verify basic text communication logic.",
    steps: "1. Enter a chat room\n2. Type 'Hello' and send.",
    expected: "Message appears in the chat bubble and is stored in Firebase.",
    priority: "High"
  },
  {
    title: "Leaderboard Tab Switching",
    feature: "Leaderboard",
    description: "Verify navigation within the leaderboard.",
    steps: "1. Go to /leaderboard\n2. Click between 'Builders' and 'Ideas' tabs.",
    expected: "The rankings update instantly to reflect the selected category.",
    priority: "Low"
  },
  {
    title: "Footer Legal Links",
    feature: "General",
    description: "Verify standard compliance links.",
    steps: "1. Scroll to the bottom of the page\n2. Click 'Privacy Policy'.",
    expected: "Relevant policy document or page is displayed.",
    priority: "Low"
  }
];

function buildNotionProperties(testCase) {
  return {
    'Test Name': { title: [{ text: { content: testCase.title || 'Untitled Test Case' } }] },
    'Test Type': { select: { name: 'Basic Functional' } },
    'Environment': { select: { name: 'Staging' } },
    'Status': { status: { name: 'Not started' } },
    'Description': { rich_text: [{ text: { content: testCase.description || '' } }] },
    'Priority': { select: { name: testCase.priority || 'Medium' } },
    'Build Version': { rich_text: [{ text: { content: 'v1.0.0 (Base)' } }] },
    'Last Run Date': { date: { start: new Date().toISOString() } }
  };
}

async function pushTestCases() {
  console.log(`Pushing ${testCases.length} BASIC test cases to Notion Database: ${databaseId}...`);
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
  
  console.log(`\n🎉 Successfully pushed ${successCount}/${testCases.length} basic test cases to Notion!`);
}

pushTestCases();
