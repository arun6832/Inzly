import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import ngeohash from 'ngeohash';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const serviceAccount = require('C:/Users/arunp/Downloads/inzly-3518e-firebase-adminsdk-fbsvc-f126166679.json');

const adminApp = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(adminApp);

const AUTHOR_ID = 'IwaWalcQGCfygPHAdklS7pRA27V2'; // From research

const DISTRICTS = [
    { name: 'Palakkad', lat: 10.7867, lng: 76.6547, areas: ['Victoria College', 'Kanjikode Industrial', 'Ottapalam', 'Chittur', 'Alathur'] },
    { name: 'Thrissur', lat: 10.5276, lng: 76.2144, areas: ['Swaraj Round', 'Mannuthy', 'Guruvayur', 'Kunnamkulam', 'Kodungallur'] },
    { name: 'Malappuram', lat: 11.0735, lng: 76.0740, areas: ['Kottakkal', 'Manjeri', 'Perinthalmanna', 'Tirur', 'Nilambur'] },
];

const IDEA_TEMPLATES = [
    { title: 'AgriSmart Palakkad', idea: 'IoT-based precision irrigation focused on the paddy fields of Palakkad to reduce water waste.', category: 'AgriTech' },
    { title: 'Cultural Connect Thrissur', idea: 'A digital marketplace for Thrissur artisans to sell traditional jewelry and woodcraft globally.', category: 'Social' },
    { title: 'EduBridge Malappuram', idea: 'Low-latency skill training platform for vocational students in rural Malappuram.', category: 'EdTech' },
    { title: 'WasteRevive', idea: 'Community-driven plastic waste management for small towns in Kerala.', category: 'CleanTech' },
    { title: 'LocalLogistics', idea: 'Hyper-local delivery network for small scale industries in Kanjikode.', category: 'SaaS' },
    { title: 'SilkScale', idea: 'AI-assisted silk weaving patterns to modernize traditional handloom units.', category: 'AI/ML' },
    { title: 'HealthTracker Kerala', idea: 'Remote monitoring for elderly citizens whose children are working abroad.', category: 'HealthTech' },
    { title: 'QuickFin Micro', idea: 'Simplifying micro-loans for street vendors in Swaraj Round.', category: 'FinTech' },
    { title: 'FishFresh', idea: 'Cold-chain traceability app for Malappuram backwater fish markets.', category: 'AgriTech' },
    { title: 'SolarShare', idea: 'A P2P energy sharing network for residential clusters in Ottapalam.', category: 'CleanTech' },
    { title: 'TourGuide AR', idea: 'Augmented reality guide for Palakkad Fort and Thrissur temples.', category: 'Social' },
    { title: 'HireLocal', idea: 'Gig economy platform for blue-collar workers in industrial zones.', category: 'Social' },
    { title: 'GrainGuard', idea: 'Smart storage containers for small-scale paddy farmers in Kerala.', category: 'AgriTech' },
    { title: 'SkillSwap Thrissur', idea: 'Barter-based skill exchange for college students in Kerala.', category: 'EdTech' },
    { title: 'FinLiteracy VR', idea: 'Immersive financial literacy for rural women groups (Kudumbashree).', category: 'FinTech' },
    { title: 'MediDrone Kerala', idea: 'Urgent medicine delivery system for remote areas in Nilambur forest.', category: 'HealthTech' },
    { title: 'HandloomHero', idea: 'Subscription box for traditional Kerala handloom products.', category: 'SaaS' },
    { title: 'SmartGala', idea: 'Crowdsourced event management for local festivals and galas.', category: 'Social' },
    { title: 'AquaSense', idea: 'Real-time water quality monitoring for Malappuram river networks.', category: 'CleanTech' },
    { title: 'CoFounder Kerala', idea: 'Co-founder matching platform specifically for Tier 2 cities in Kerala.', category: 'Social' },
];

function jitter(value, amount = 0.08) {
    return value + (Math.random() - 0.5) * amount;
}

async function pushIdeas() {
    console.log('🚀  Pushing 20 targeted ideas to Palakkad, Thrissur, and Malappuram...');

    const batch = db.batch();
    const ideasColl = db.collection('ideas');

    for (let i = 0; i < 20; i++) {
        const district = DISTRICTS[i % DISTRICTS.length];
        const template = IDEA_TEMPLATES[i % IDEA_TEMPLATES.length];
        
        const area = district.areas[Math.floor(Math.random() * district.areas.length)];
        const lat = jitter(district.lat);
        const lng = jitter(district.lng);
        const geohash = ngeohash.encode(lat, lng, 6);
        
        const ideaId = `idea_dist_${Date.now()}_${i}`;
        const ideaRef = ideasColl.doc(ideaId);

        const newIdea = {
            title: template.title,
            idea: template.idea,
            category: template.category,
            userId: AUTHOR_ID,
            authorUsername: 'inzly_test_admin',
            createdAt: FieldValue.serverTimestamp(),
            likesCount: Math.floor(Math.random() * 50),
            views: Math.floor(Math.random() * 200) + 50,
            engagementScore: Math.floor(Math.random() * 100),
            visibility: 'public',
            location: {
                city: district.name,
                area: area,
                lat: lat,
                lng: lng,
                geohash: geohash
            }
        };

        batch.set(ideaRef, newIdea);
        console.log(`  ➕ Adding: ${template.title} at ${district.name} (${area})`);
    }

    await batch.commit();
    console.log('\n✅ Successfully pushed 20 new ideas!');
    process.exit(0);
}

pushIdeas().catch(err => {
    console.error('❌ Push failed:', err.message);
    process.exit(1);
});
