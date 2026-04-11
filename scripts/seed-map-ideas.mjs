import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import ngeohash from 'ngeohash';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const serviceAccount = require('C:/Users/arunp/Downloads/inzly-3518e-firebase-adminsdk-fbsvc-f126166679.json');

const adminApp = initializeApp({ credential: cert(serviceAccount) });
console.log('✅ Loaded service account for:', serviceAccount.project_id);

const db = getFirestore(adminApp);

const CITIES = [
  { city: 'Bangalore', areas: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City'], lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', areas: ['Bandra', 'Andheri', 'Lower Parel', 'Powai', 'BKC'], lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', areas: ['Connaught Place', 'Saket', 'Noida Sector 18', 'Gurugram', 'Lajpat Nagar'], lat: 28.6139, lng: 77.2090 },
  { city: 'Hyderabad', areas: ['Hitec City', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kondapur'], lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', areas: ['T Nagar', 'Anna Nagar', 'OMR', 'Velachery', 'Adyar'], lat: 13.0827, lng: 80.2707 },
  { city: 'Pune', areas: ['Koregaon Park', 'Hinjewadi', 'Kothrud', 'Baner', 'Aundh'], lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', areas: ['Salt Lake', 'Park Street', 'Rajarhat', 'New Town', 'Howrah'], lat: 22.5726, lng: 88.3639 },
  { city: 'Ahmedabad', areas: ['SG Highway', 'CG Road', 'Prahalad Nagar', 'Navrangpura', 'Thaltej'], lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', areas: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Tonk Road', 'Mansarovar'], lat: 26.9124, lng: 75.7873 },
  { city: 'Kochi', areas: ['MG Road', 'Infopark', 'Kakkanad', 'Marine Drive', 'Edapally'], lat: 9.9312, lng: 76.2673 },
  { city: 'Calicut', areas: ['Beach Road', 'Mavoor Road', 'Civil Station', 'Nadakkavu', 'Pottammal'], lat: 11.2588, lng: 75.7804 },
];

function jitter(value, amount = 0.05) {
  return value + (Math.random() - 0.5) * amount;
}

async function seedMapIdeas() {
  console.log('🗺️  Seeding location data using Firebase Admin SDK...');

  const snap = await db.collection('ideas').get();
  console.log(`Found ${snap.docs.length} ideas to process.`);

  const batch = db.batch();
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < snap.docs.length; i++) {
    const ideaDoc = snap.docs[i];
    const data = ideaDoc.data();

    if (data.location?.lat) {
      skipped++;
      continue;
    }

    const cityData = CITIES[i % CITIES.length];
    const area = cityData.areas[Math.floor(Math.random() * cityData.areas.length)];
    const lat = jitter(cityData.lat);
    const lng = jitter(cityData.lng);
    const geohash = ngeohash.encode(lat, lng, 6);
    const engagementScore = (data.likesCount || 0) * 3 + (data.views || 0);

    batch.update(ideaDoc.ref, {
      location: { city: cityData.city, area, lat, lng, geohash },
      visibility: 'public',
      engagementScore,
    });

    console.log(`  ✅ ${ideaDoc.id.slice(0,8)}… → ${cityData.city}, ${area}`);
    updated++;

    // Firestore batch limit is 500
    if (updated % 490 === 0) {
      await batch.commit();
      console.log('  📦 Batch committed');
    }
  }

  await batch.commit();
  console.log(`\n✅ Done! Updated ${updated} ideas. Skipped ${skipped} (already had location).`);
  process.exit(0);
}

seedMapIdeas().catch(err => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
