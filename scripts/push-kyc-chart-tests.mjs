import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

const testCases = [
  {
    title: "Interactive Charts: S-Curve Hover Laser Ruler Tracking",
    feature: "Interactive Charts",
    description: "Verify that moving the cursor over the S-Curve SVG area displays the vertical laser guide ruler and updates the custom hovering tooltip coordinates.",
    priority: "High",
    testType: "UI Testing"
  },
  {
    title: "Interactive Charts: Donut Slice Segment Popping",
    feature: "Interactive Charts",
    description: "Confirm that hovering over a role segment in the distribution donut chart shifts its SVG coordinates outwards dynamically with a smooth scale transformation.",
    priority: "Medium",
    testType: "UI Testing"
  },
  {
    title: "Interactive Charts: Demographics Bar Chart Density & Alphabetical Sorting",
    feature: "Interactive Charts",
    description: "Test toggling the sorting order between density and alphabetical modes for geographic bar charts. Ensure bars animate to new values instantly without rendering delays.",
    priority: "High",
    testType: "Functional Testing"
  },
  {
    title: "KYC Gate: Profile Verification Gateway Visibility",
    feature: "KYC Gate",
    description: "Ensure unverified users see a prominent 'Verify Now' glassmorphic card on their own profile, whereas pending users see a pulsing progress status. Verified users must not see the verification widget.",
    priority: "High",
    testType: "UI Testing"
  },
  {
    title: "KYC Gate: LinkedIn and Portfolio Syntax Validation",
    feature: "KYC Gate",
    description: "Validate regex constraints on the credentials input step. Verify that non-LinkedIn or invalid URL strings prevent transition to the next wizard stage.",
    priority: "High",
    testType: "Functional Testing"
  },
  {
    title: "KYC Gate: Role-Specific Challenge MCQ Selection",
    feature: "KYC Gate",
    description: "Verify the KYC Wizard loads custom MCQs tailored to the user's role: Investor accounts get cap-table questions, Builders get engineering questions, and Thinkers get landscaping/validation questions.",
    priority: "High",
    testType: "Functional Testing"
  },
  {
    title: "KYC Gate: MCQ Challenge Scoring & Firestore Payload",
    feature: "KYC Gate",
    description: "Check that answering all 3 challenge questions registers the correct score in Firestore under the user's kycApplication.score attribute when submitted.",
    priority: "High",
    testType: "Functional Testing"
  },
  {
    title: "KYC Gate: Platform NDA Charter Signature Locks",
    feature: "KYC Gate",
    description: "Verify the platform charter checkbox signature lock blocks final application submissions unless checked, ensuring absolute NDA agreement before audit.",
    priority: "Medium",
    testType: "Functional Testing"
  },
  {
    title: "Admin Panel: KYC Audits Tab Count & List",
    feature: "Admin Panel",
    description: "Confirm the admin sidebar KYC Audits tab displays a badge with the exact number of pending applications, and the panel correctly lists pending user profiles with their credentials and quiz scores.",
    priority: "High",
    testType: "UI Testing"
  },
  {
    title: "Admin Panel: KYC Clearance Granting & Trust Score Boost",
    feature: "Admin Panel",
    description: "Verify clicking 'Grant Clearance' updates the user's status to 'verified', appends the Verified Badge, and boosts their platform trust score to 150. Decline must reset status and clear data.",
    priority: "High",
    testType: "Functional Testing"
  }
];

function buildNotionProperties(testCase) {
  return {
    'Test Name': { title: [{ text: { content: testCase.title || 'Untitled Test Case' } }] },
    'Test Type': { select: { name: testCase.testType || 'Functional Testing' } },
    'Environment': { select: { name: 'Staging' } },
    'Status': { status: { name: 'Not started' } },
    'Description': { rich_text: [{ text: { content: testCase.description || '' } }] },
    'Priority': { select: { name: testCase.priority || 'Medium' } },
    'Build Version': { rich_text: [{ text: { content: 'v1.3.0' } }] },
    'Last Run Date': { date: { start: new Date().toISOString() } }
  };
}

async function pushTestCases() {
  console.log(`Pushing Inzly v1.3.0 KYC & SVG Charts test cases to Notion Database: ${databaseId}...`);
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
  
  console.log(`\n🎉 Successfully pushed ${successCount}/${testCases.length} Inzly v1.3.0 test cases to Notion!`);
}

pushTestCases();
