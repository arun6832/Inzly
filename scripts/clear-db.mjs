// Clear DB script: Deletes all documents in main Firestore collections
// Run with: node scripts/clear-db.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBeRACMKRLcEkme0IBdzDSI7SiIi0HK0W4",
    authDomain: "inzly-3518e.firebaseapp.com",
    projectId: "inzly-3518e",
    storageBucket: "inzly-3518e.firebasestorage.app",
    messagingSenderId: "257986504746",
    appId: "1:257986504746:web:7d7641c9130d8ac9ab7b53"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS_TO_CLEAR = [
    "ideas",
    "users",
    "savedIdeas",
    "likes",
    "siteStats"
];

async function clearCollection(collectionName) {
    console.log(`🧹 Clearing collection: "${collectionName}"...`);
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = [];
        
        querySnapshot.forEach((document) => {
            deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
        });
        
        await Promise.all(deletePromises);
        console.log(`✅ Cleared ${querySnapshot.size} documents from "${collectionName}".`);
    } catch (err) {
        console.error(`❌ Failed to clear "${collectionName}":`, err.message);
    }
}

async function run() {
    console.log("🔥 PREPARING TO CLEAR FIRESTORE DATABASE...");
    console.log("⚠️  This action will permanently delete all content.\n");

    for (const collectionName of COLLECTIONS_TO_CLEAR) {
        await clearCollection(collectionName);
    }

    console.log("\n✨ Database clearing process complete.");
    process.exit(0);
}

run();
