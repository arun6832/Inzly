import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const serviceAccount = require('C:/Users/arunp/Downloads/inzly-3518e-firebase-adminsdk-fbsvc-f126166679.json');

const adminApp = initializeApp({ credential: cert(serviceAccount) });
console.log('✅ Loaded service account for:', serviceAccount.project_id);

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

const COLLECTIONS_TO_CLEAR = [
    "savedIdeas",
    "likes",
    "siteStats",
    "collaborationRequests",
    "access_requests",
    "nda_acceptance",
    "idea_views",
    "reports",
    "problems"
];

async function deleteCollection(collectionPath) {
    const snapshot = await db.collection(collectionPath).get();
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
    });
    
    if (count > 0) {
        await batch.commit();
    }
    return count;
}

async function clearAuthUsers() {
    console.log("\n🧹 Clearing Firebase Auth users...");
    let userCount = 0;
    try {
        let nextPageToken;
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            if (listUsersResult.users.length === 0) break;
            const deletePromises = listUsersResult.users.map((userRecord) => auth.deleteUser(userRecord.uid));
            await Promise.all(deletePromises);
            userCount += listUsersResult.users.length;
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        console.log(`✅ Cleared ${userCount} users from Firebase Auth.`);
    } catch (err) {
        console.error("❌ Failed to clear Firebase Auth users:", err.message);
    }
}

async function clearDb() {
    console.log("\n🔥 Clearing Firestore Collections...");
    
    // Clear basic flat collections
    for (const coll of COLLECTIONS_TO_CLEAR) {
        try {
            const clearedCount = await deleteCollection(coll);
            console.log(`✅ Cleared ${clearedCount} documents from "${coll}".`);
        } catch (e) {
            console.error(`❌ Failed to clear collection "${coll}":`, e.message);
        }
    }
    
    // Clear ideas with their versions subcollections
    try {
        console.log("🧹 Clearing ideas and version subcollections...");
        const ideasSnap = await db.collection("ideas").get();
        let versionCount = 0;
        let ideaCount = 0;
        
        for (const doc of ideasSnap.docs) {
            // Delete subcollection versions
            const versionsSnap = await doc.ref.collection("versions").get();
            const batch = db.batch();
            versionsSnap.docs.forEach((vDoc) => {
                batch.delete(vDoc.ref);
                versionCount++;
            });
            if (versionsSnap.docs.length > 0) {
                await batch.commit();
            }
            
            // Delete idea document
            await doc.ref.delete();
            ideaCount++;
        }
        console.log(`✅ Cleared ${ideaCount} ideas and ${versionCount} historical versions.`);
    } catch (e) {
        console.error("❌ Failed to clear ideas:", e.message);
    }
    
    // Clear chats with their messages subcollections
    try {
        console.log("🧹 Clearing chats and message subcollections...");
        const chatsSnap = await db.collection("chats").get();
        let messageCount = 0;
        let chatCount = 0;
        
        for (const doc of chatsSnap.docs) {
            // Delete subcollection messages
            const messagesSnap = await doc.ref.collection("messages").get();
            const batch = db.batch();
            messagesSnap.docs.forEach((mDoc) => {
                batch.delete(mDoc.ref);
                messageCount++;
            });
            if (messagesSnap.docs.length > 0) {
                await batch.commit();
            }
            
            // Delete chat document
            await doc.ref.delete();
            chatCount++;
        }
        console.log(`✅ Cleared ${chatCount} chats and ${messageCount} real-time messages.`);
    } catch (e) {
        console.error("❌ Failed to clear chats:", e.message);
    }
    
    // Clear users collection
    try {
        const clearedUsers = await deleteCollection("users");
        console.log(`✅ Cleared ${clearedUsers} profile documents from "users".`);
    } catch (e) {
        console.error("❌ Failed to clear users collection:", e.message);
    }
}

async function run() {
    console.log("==========================================");
    console.log("🔥 INZLY PLATFORM FRESH-START RESETS 🔥");
    console.log("==========================================");
    
    await clearDb();
    await clearAuthUsers();
    
    console.log("\n✨ Database and Users have been completely reset to a blank canvas!");
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Critical reset failure:", err);
    process.exit(1);
});
