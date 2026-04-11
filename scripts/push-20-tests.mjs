import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

const testCases = [
  {
    title: "Verify 'Pulse' statistics are visible on mobile screens",
    feature: "Dashboard",
    description: "Ensure that key engagement statistics and platform 'Pulse' metrics render properly on narrow viewpoint devices.",
    steps: "1. Open site in Chrome Mobile emulation\n2. Navigate to Home Page\n3. Check visibility of Pulse stats",
    expected: "Pulse stats stack vertically or shrink to fit without horizontal overflow.",
    status: "Not Started",
    priority: "High",
    assigned: "Mobile QA"
  },
  {
    title: "Message auto-scrolls to latest message when receiving a new text",
    feature: "Messaging",
    description: "Ensure smooth user experience when a new real-time message arrives.",
    steps: "1. Open a chat room in two browser windows\n2. Send a message from Window A\n3. Observe Window B",
    expected: "Window B automatically scrolls to the bottom to display the new message.",
    status: "Not Started",
    priority: "Medium",
    assigned: "QA Automator"
  },
  {
    title: "Github icon correctly redirects to repository on new tab",
    feature: "Ideas",
    description: "Verify that the Github integration links on an idea card spawn securely.",
    steps: "1. Navigate to 'Saved' or 'Swipe' view\n2. Locate an idea with a Github repository attached\n3. Click the Github icon",
    expected: "A new browser tab opens navigating directly to the correct Github repository URL.",
    status: "Not Started",
    priority: "High",
    assigned: "Alice"
  },
  {
    title: "Swipe left discards the idea card and updates index",
    feature: "Swipe",
    description: "Confirm structural logic of rejecting an idea.",
    steps: "1. Go to Home\n2. Perform left swipe gesture on the top card",
    expected: "Card animates out of view to the left, and the next card becomes active. It is NOT added to saved list.",
    status: "Not Started",
    priority: "High",
    assigned: "Bob"
  },
  {
    title: "Search bar correctly filters user profiles by username",
    feature: "Discovery",
    description: "Validation of the user search functionality logic.",
    steps: "1. Click Search bar\n2. Type an existing username slowly",
    expected: "Search results instantly populate and correctly filter down to matching users.",
    status: "Not Started",
    priority: "Medium",
    assigned: "Charlie"
  },
  {
    title: "Empty state message is shown when user has no saved ideas",
    feature: "Saved Ideas",
    description: "Prevent blank screen confusion for fresh accounts.",
    steps: "1. Login with a brand new account\n2. Go to /saved",
    expected: "A descriptive empty state is shown (e.g., 'No ideas saved yet. Go swipe!')",
    status: "Not Started",
    priority: "Low",
    assigned: "Alice"
  },
  {
    title: "Validating Markdown rendering in Idea Detailed View",
    feature: "Ideas",
    description: "Ensure that complex markdown descriptions render HTML correctly inside the detail page.",
    steps: "1. Submit an idea with headers, bold text, and code blocks\n2. Open its detail view",
    expected: "Markdown is parsed and safely rendered as HTML without exposing script tags.",
    status: "Not Started",
    priority: "Medium",
    assigned: "Bob"
  },
  {
    title: "Navigation menu collapses into hamburger on screens < 768px",
    feature: "Navbar",
    description: "Test responsive breakpoint logic for the main Navbar.",
    steps: "1. Resize window width below 768px\n2. Check header",
    expected: "Text links disappear and a hamburger icon replaces them. Clicking it opens a dropdown.",
    status: "Not Started",
    priority: "High",
    assigned: "Mobile QA"
  },
  {
    title: "User can securely logout and token is removed",
    feature: "Auth",
    description: "Ensure logout fully terminates the session and cleans up storage.",
    steps: "1. Login as user\n2. Click Profile -> Logout\n3. Try to visit /saved",
    expected: "User is redirected to /login and localStorage/cookies related to auth are flushed.",
    status: "Not Started",
    priority: "High",
    assigned: "Alice"
  },
  {
    title: "Careers page renders role listings and applies layout correctly",
    feature: "Careers",
    description: "Smoke test for the careers page structure.",
    steps: "1. Navigate to /careers\n2. Verify listed roles and layout",
    expected: "Job openings are displayed clearly using the standard corporate theme without layout shifts.",
    status: "Not Started",
    priority: "Low",
    assigned: "Charlie"
  },
  {
    title: "Leaderboard ranks participants by decreasing engagement scores",
    feature: "Leaderboard",
    description: "Ensure ranking logic mathematically sorts by score correctly.",
    steps: "1. Navigate to /leaderboard\n2. Compare scores of Rank 1, 2, and 3",
    expected: "Scores must be strictly descending. E.g., Rank 1 score >= Rank 2 score.",
    status: "Not Started",
    priority: "Medium",
    assigned: "Bob"
  },
  {
    title: "Animated background gracefully degrades on low-power devices",
    feature: "Performance",
    description: "Check if the application respects 'prefers-reduced-motion'.",
    steps: "1. Enable 'prefers-reduced-motion' in OS settings\n2. Open website",
    expected: "Heavy background animations are disabled or simplified to conserve resources.",
    status: "Not Started",
    priority: "Medium",
    assigned: "QA Automator"
  },
  {
    title: "Environmental statistics on home page update correctly",
    feature: "Dashboard",
    description: "Verify that the fixed minimalist environmental markers display current generic stats.",
    steps: "1. View home page\n2. Check left/right margin data structures",
    expected: "Nodes online, active sessions, and global stats look visually accurate and aligned.",
    status: "Not Started",
    priority: "Low",
    assigned: "Charlie"
  },
  {
    title: "Submit Idea form validates minimum character limit",
    feature: "Ideas",
    description: "Prevent spammy or extremely short idea submissions.",
    steps: "1. Go to /create\n2. Enter 'test' as description\n3. Click Submit",
    expected: "Form prevents submission and shows validation error 'Description must be at least 20 characters'.",
    status: "Not Started",
    priority: "Medium",
    assigned: "Alice"
  },
  {
    title: "User cannot access /saved unless logged in",
    feature: "Auth",
    description: "Test protected route middleware logic.",
    steps: "1. Open incognito window\n2. Enter URL /saved manually",
    expected: "Application intercepts request and redirects instantly to /login.",
    status: "Not Started",
    priority: "High",
    assigned: "QA Automator"
  },
  {
    title: "Error toast appears when messaging fails to send",
    feature: "Messaging",
    description: "Verify error handling for socket/network disconnects.",
    steps: "1. Disconnect network completely (offline mode)\n2. Attempt to send a chat message",
    expected: "A red error toast notification appears indicating the message failed to send.",
    status: "Not Started",
    priority: "Medium",
    assigned: "Bob"
  },
  {
    title: "Updating profile picture reflects immediately across UI",
    feature: "Profile",
    description: "Verify global state/context updates upon profile modification.",
    steps: "1. Go to Profile Settings\n2. Upload a new avatar picture\n3. Check Navbar",
    expected: "The new avatar replaces the old one instantly in the navbar without a page reload.",
    status: "Not Started",
    priority: "Medium",
    assigned: "Alice"
  },
  {
    title: "Unauthenticated preview idea card prompts login when swiped",
    feature: "Swipe",
    description: "To increase conversions, guests can see a card but cannot interact fully without account.",
    steps: "1. Open as guest\n2. Swipe right on the teaser card",
    expected: "A login modal or redirect interrupts the swipe asking them to create an account to save ideas.",
    status: "Not Started",
    priority: "High",
    assigned: "Bob"
  },
  {
    title: "Database sync updates 'Created At' accurately",
    feature: "Sync",
    description: "Check if metadata timing functions execute properly.",
    steps: "1. Run database API sync\n2. Check Timestamp in Notion",
    expected: "The 'Created At' field reflects the exact UTC time the script was executed.",
    status: "Not Started",
    priority: "Low",
    assigned: "QA Automator"
  },
  {
    title: "Test 404 page routes correctly for unknown paths",
    feature: "Routing",
    description: "Catch-all error boundary handles non-existent pages beautifully.",
    steps: "1. Type /random-invalid-url-123 in address bar",
    expected: "The custom 404 Not Found page is displayed maintaining the site's premium design aesthetics.",
    status: "Not Started",
    priority: "Low",
    assigned: "Charlie"
  }
];

// Helper to map JSON to Notion properties
function buildNotionProperties(testCase) {
  return {
    'Test Name': { title: [{ text: { content: testCase.title || 'Untitled Test Case' } }] },
    'Test Type': { select: { name: testCase.feature === 'Dashboard' ? 'UI Testing' : 'Functional Testing' } },
    'Environment': { select: { name: 'Staging' } },
    'Status': { status: { name: 'Not started' } },
    'Priority': { select: { name: testCase.priority || 'Medium' } },
    'Build Version': { rich_text: [{ text: { content: 'v1.0.0' } }] },
    'Last Run Date': { date: { start: new Date().toISOString() } }
  };
}

async function pushTestCases() {
  console.log(`Pushing ${testCases.length} new test cases to Notion Database: ${databaseId}...`);
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
  
  console.log(`\n🎉 Successfully pushed ${successCount}/${testCases.length} test cases to Notion!`);
}

pushTestCases();
