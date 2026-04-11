# Day 8: Profile Management & QA Integration

Today focused on two major platform pillars — building a complete user profile management system and massively scaling the QA test case database with Notion integration.

### 🧪 QA & Notion Integration
- **Notion SDK Stabilized**: Diagnosed and fixed a breaking `@notionhq/client` incompatibility. Downgraded to stable `^2.2.14`, restoring full database sync capabilities.
- **40 New Test Cases Pushed**: Created and executed two automated scripts (`push-20-tests.mjs`, `push-20-more-tests.mjs`) injecting 40 rigorous, project-specific test cases directly into the Notion QA board — covering Auth, Messaging, Swipe UX, Performance, Security (XSS), and more.
- **Schema Alignment**: Refactored `src/app/api/testcases/sync/route.ts` to correctly map all fields to the live Notion database schema (`Test Name`, `Test Type`, `Environment`, `Status`, `Priority`, `Build Version`, `Last Run Date`).

### 👤 Profile & Identity System
- **View Profile**: Added an explicit "View Profile" button to both the Desktop Navbar and Mobile Menu, linking directly to the authenticated user's profile page.
- **Edit Profile Modal**: Built a clean, lightweight in-profile modal allowing users to update their **Display Name** and **Bio** (with 160 char limit and counter) — saved instantly to Firestore via `updateDoc`.
- **Initials Avatar**: Replaced all photo/DiceBear avatar complexity with a premium gradient-backed initials badge (e.g. `AR`, `JD`) — zero external dependencies, works instantly for every user old or new.
- **Account Deletion**: Implemented a double-confirmed "Danger Zone" action that cascades through: deleting all user ideas → deleting the Firestore user document → calling `deleteUser()` on Firebase Auth — completely freeing the email and username for future re-registration.
- **Firestore Fallback Query**: Profile pages now fallback to querying by Document ID (UID) for old accounts that were registered before the `username` field was introduced.
- **AuthContext Enhancement**: Upgraded `AuthContext` to broadcast a full `userData` snapshot globally, enabling the Navbar to render user-specific initials and profile links without additional fetches.

### 🛠️ Infrastructure & Fixes
- **`next.config.ts` Updates**: Added `allowedDevOrigins` for local network testing and configured `remotePatterns` for image domains.
- **Firestore & Storage Rules Guidance**: Identified and documented correct security rule configurations for both Firestore and Firebase Storage.
- **Stale Avatar Cleanup**: Wrote `scripts/clear-stale-avatars.mjs` to scan and purge any `seed=NaN` DiceBear URLs previously written to Firestore from a code bug.
