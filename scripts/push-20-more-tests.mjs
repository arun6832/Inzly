import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

const testCases = [
  {
    title: "Verify Firebase Email/Password Authentication Flow",
    feature: "Auth",
    description: "Ensure complete login cycle works with Firebase Authentication.",
    steps: "1. Navigate to /login\n2. Enter valid test user credentials\n3. Wait for Firebase completion",
    expected: "User is successfully authenticated and redirected to /.",
    status: "Not Started",
    priority: "High"
  },
  {
    title: "Test edge case: Username longer than 32 characters",
    feature: "Profile",
    description: "Check boundaries for profile name limitations.",
    steps: "1. Go to Profile Settings\n2. Attempt renaming username to 33 characters",
    expected: "Input is restricted and shows validation warning.",
    status: "Not Started",
    priority: "Low"
  },
  {
    title: "Verify timestamp grouping in chat messaging",
    feature: "Messaging",
    description: "Messages sent within the same minute should not repeat the timestamp.",
    steps: "1. Open chat\n2. Send 3 messages rapidly within 20 seconds",
    expected: "Timestamp is only appended once to the group of messages.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Ensure 'No more ideas' state is shown when feed is empty",
    feature: "Swipe",
    description: "Check the fallback UI when all ideas are swiped.",
    steps: "1. Swipe all remaining ideas in the queue.",
    expected: "A congratulatory 'You are caught up!' empty state is displayed.",
    status: "Not Started",
    priority: "High"
  },
  {
    title: "Keyboard navigation works for swiping (Left/Right Arrows)",
    feature: "Swipe",
    description: "Accessibility check for desktop power users.",
    steps: "1. Focus Swipe card\n2. Press Right Arrow key",
    expected: "Idea triggers the right-swipe animation and gets saved.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Copy Share URL button copies correct absolute path",
    feature: "Ideas",
    description: "Ensure sharing functionality works across browsers.",
    steps: "1. Open idea detail\n2. Click 'Share Idea'\n3. Paste into notepad",
    expected: "Correct absolute URL is pasted into the clipboard.",
    status: "Not Started",
    priority: "High"
  },
  {
    title: "Clicking a tag filters the Ideas feed",
    feature: "Discovery",
    description: "Verify tag-based taxonomy indexing works.",
    steps: "1. Open idea detail\n2. Click the 'Frontend' tag badge",
    expected: "Navigated to search results filtered strictly by 'Frontend'.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Messaging empty state prompts user to start a conversation",
    feature: "Messaging",
    description: "Blank chat rooms should encourage interaction.",
    steps: "1. Create new chat room with an inactive user\n2. Check UI",
    expected: "Empty state graphic and 'Send the first message' text appears.",
    status: "Not Started",
    priority: "Low"
  },
  {
    title: "External HTTP links in descriptions open safely (rel=noopener)",
    feature: "Ideas",
    description: "Security check for user-submitted URLs.",
    steps: "1. View idea with a random HTTP link\n2. Inspect element",
    expected: "Anchor tag contains rel='noopener noreferrer' and target='_blank'.",
    status: "Not Started",
    priority: "High"
  },
  {
    title: "Graceful 404 for missing/deleted Idea ID",
    feature: "Ideas",
    description: "Testing dynamic route error boundary.",
    steps: "1. Manually navigate to /idea/invalid-deleted-id",
    expected: "404 page is shown instead of a 500 server crash.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Leaderboard tie-breaker sorts by newest member if scores equal",
    feature: "Leaderboard",
    description: "Check sorting logic specificity.",
    steps: "1. Seed database with two users having exactly 150 points",
    expected: "The newer user profile should be ranked higher.",
    status: "Not Started",
    priority: "Low"
  },
  {
    title: "Careers page filters jobs by technical/non-technical toggle",
    feature: "Careers",
    description: "Check UI tabs for job classifications.",
    steps: "1. Go to /careers\n2. Click 'Engineering' toggle",
    expected: "Only Engineering jobs are listed, marketing jobs vanish without reloading.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Navbar active states bold the current route correctly",
    feature: "Navbar",
    description: "Verify next/navigation router hooks.",
    steps: "1. Click on 'Leaderboard'",
    expected: "Leaderboard nav item becomes styled as active (highlighted text).",
    status: "Not Started",
    priority: "Low"
  },
  {
    title: "User default fallback avatar is an initial-based placeholder",
    feature: "Profile",
    description: "Users without Github pictures should have generated avatars.",
    steps: "1. Register natively via Email without uploading picture",
    expected: "Avatar is an SVG with the first 2 letters of their name.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Offline PWA alert when network is lost",
    feature: "Performance",
    description: "Test service worker/offline awareness.",
    steps: "1. Disconnect WiFi\n2. Try to swipe",
    expected: "Small non-intrusive toast indicates 'You are currently offline'.",
    status: "Not Started",
    priority: "Low"
  },
  {
    title: "Deleting an account anonymizes their chat messages",
    feature: "Auth",
    description: "Test GDPR/privacy handling.",
    steps: "1. Delete test user account\n2. View a chat room they participated in",
    expected: "Their messages remain but name says 'Deleted User' and avatar is grayed.",
    status: "Not Started",
    priority: "High"
  },
  {
    title: "Un-saving an idea removes it from /saved instantly",
    feature: "Saved Ideas",
    description: "Optimistic UI update verify.",
    steps: "1. Go to /saved\n2. Click 'Remove Bookmark' icon on an idea",
    expected: "Idea vanishes immediately without requiring page refresh.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "XSS prevention in Idea title submission",
    feature: "Ideas",
    description: "Security check for React escaping.",
    steps: "1. Submit idea with title `<script>alert(1)</script>`",
    expected: "Text is safely displayed as raw string, no alert executes.",
    status: "Not Started",
    priority: "High"
  },
  {
    title: "Long word wrapping in chat message bubbles",
    feature: "Messaging",
    description: "CSS test for break-word.",
    steps: "1. Send a 100-character string with NO spaces",
    expected: "The bubble wraps the text downward instead of expanding past the viewport.",
    status: "Not Started",
    priority: "Medium"
  },
  {
    title: "Test loading skeletons for initial feed data fetch",
    feature: "Performance",
    description: "Ensure layout does not shift heavily during suspense.",
    steps: "1. Hard refresh / on a slow 3G connection",
    expected: "Shimmering cards placeholders show until the real Firebase data loads.",
    status: "Not Started",
    priority: "Medium"
  }
];

// Helper to map JSON to Notion properties
function buildNotionProperties(testCase) {
  return {
    'Test Name': { title: [{ text: { content: testCase.title || 'Untitled Test Case' } }] },
    'Test Type': { select: { name: testCase.feature === 'Dashboard' ? 'UI Testing' : 'Functional Testing' } },
    'Environment': { select: { name: 'Staging' } },
    'Status': { status: { name: 'Not started' } },
    'Description': { rich_text: [{ text: { content: testCase.description || '' } }] },
    'Priority': { select: { name: testCase.priority || 'Medium' } },
    'Build Version': { rich_text: [{ text: { content: 'v1.0.0' } }] },
    'Last Run Date': { date: { start: new Date().toISOString() } }
  };
}

async function pushTestCases() {
  console.log(`Pushing 20 MORE test cases to Notion Database: ${databaseId}...`);
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
  
  console.log(`\n🎉 Successfully pushed ${successCount}/${testCases.length} MORE test cases to Notion!`);
}

pushTestCases();
