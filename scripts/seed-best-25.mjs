import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createRequire } from 'module';
import ngeohash from 'ngeohash';

const require = createRequire(import.meta.url);
const serviceAccount = require('C:/Users/arunp/Downloads/inzly-3518e-firebase-adminsdk-fbsvc-f126166679.json');

const adminApp = initializeApp({ credential: cert(serviceAccount) });
console.log('✅ Loaded service account for:', serviceAccount.project_id);

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

const CITIES = [
  { city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707 }
];

const seedUsers = [
    { id: "u_kenji", name: "Kenji Takahashi", email: "kenji@inzly.io", username: "kenji_t", country: "Japan", mode: "builder", trustScore: 100 },
    { id: "u_hans", name: "Hans Müller", email: "hans@inzly.io", username: "hans_m", country: "Germany", mode: "catalyst", trustScore: 98 },
    { id: "u_sarah", name: "Sarah Jenkins", email: "sarah@inzly.io", username: "sarah_j", country: "United States", mode: "sparker", trustScore: 100 },
    { id: "u_mateus", name: "Mateus Silva", email: "mateus@inzly.io", username: "mateus_s", country: "Brazil", mode: "builder", trustScore: 95 },
    { id: "u_rohan", name: "Rohan Sen", email: "rohan@inzly.io", username: "rohan_s", country: "India", mode: "builder", trustScore: 100 },
    { id: "u_emma", name: "Emma Watson", email: "emma@inzly.io", username: "emma_w", country: "United Kingdom", mode: "explorer", trustScore: 97 },
    { id: "u_pierre", name: "Pierre Dupont", email: "pierre@inzly.io", username: "pierre_d", country: "France", mode: "sparker", trustScore: 99 },
    { id: "u_chloe", name: "Chloe Leblanc", email: "chloe@inzly.io", username: "chloe_l", country: "Canada", mode: "catalyst", trustScore: 100 },
    { id: "u_jack", name: "Jack Harrison", email: "jack@inzly.io", username: "jack_h", country: "Australia", mode: "builder", trustScore: 96 },
    { id: "u_chidi", name: "Chidi Oke", email: "chidi@inzly.io", username: "chidi_o", country: "Nigeria", mode: "builder", trustScore: 95 },
    { id: "u_thabo", name: "Thabo Ndlovu", email: "thabo@inzly.io", username: "thabo_n", country: "South Africa", mode: "sparker", trustScore: 98 },
    { id: "u_minjun", name: "Min-Jun Kim", email: "minjun@inzly.io", username: "minjun_k", country: "South Korea", mode: "builder", trustScore: 100 },
    { id: "u_liwei", name: "Li Wei", email: "liwei@inzly.io", username: "li_wei", country: "Singapore", mode: "catalyst", trustScore: 100 },
    { id: "u_bram", name: "Bram van der Meer", email: "bram@inzly.io", username: "bram_v", country: "Netherlands", mode: "builder", trustScore: 97 },
    { id: "u_giulia", name: "Giulia Bianchi", email: "giulia@inzly.io", username: "giulia_b", country: "Italy", mode: "sparker", trustScore: 99 },
    { id: "u_ale", name: "Alejandro Gomez", email: "ale@inzly.io", username: "ale_g", country: "Spain", mode: "builder", trustScore: 95 },
    { id: "u_sofia", name: "Sofia Rodriguez", email: "sofia@inzly.io", username: "sofia_r", country: "Mexico", mode: "explorer", trustScore: 96 },
    { id: "u_lucas", name: "Lucas Diaz", email: "lucas@inzly.io", username: "lucas_d", country: "Argentina", mode: "builder", trustScore: 98 },
    { id: "u_astrid", name: "Astrid Lindqvist", email: "astrid@inzly.io", username: "astrid_l", country: "Sweden", mode: "sparker", trustScore: 100 },
    { id: "u_marc", name: "Marc Keller", email: "marc@inzly.io", username: "marc_k", country: "Switzerland", mode: "catalyst", trustScore: 100 },
    { id: "u_layla", name: "Layla Hassan", email: "layla@inzly.io", username: "layla_h", country: "Egypt", mode: "builder", trustScore: 97 },
    { id: "u_wanjiku", name: "Wanjiku Kamau", email: "wanjiku@inzly.io", username: "wanjiku_k", country: "Kenya", mode: "builder", trustScore: 95 },
    { id: "u_faisal", name: "Faisal Al-Saud", email: "faisal@inzly.io", username: "faisal_s", country: "Saudi Arabia", mode: "catalyst", trustScore: 100 },
    { id: "u_demir", name: "Demir Yilmaz", email: "demir@inzly.io", username: "demir_y", country: "Turkey", mode: "builder", trustScore: 98 },
    { id: "u_nguyen", name: "Nguyen Tran", email: "nguyen@inzly.io", username: "nguyen_t", country: "Vietnam", mode: "sparker", trustScore: 99 }
];

const best25Datasets = [
  {
    category: "Clean Energy",
    problemTitle: "High Solar Irradiance Grid Overload in Semi-Arid Farms",
    problemChallenge: "Grid infrastructure in semi-arid zones routinely faces severe high-voltage surges during peak sunlight hours, leading to system trips and significant energy wastage because farms cannot consume the surplus.",
    ideaTitle: "HelioGrid Optimizer",
    ideaDescription: "A dynamic solid-state solar routing system that redirects excess electricity to modular containerized green hydrogen electrolyzers placed directly at the solar farm, generating hydrogen gas to sell during non-peak hours.",
    visibility: "public"
  },
  {
    category: "AgriTech",
    problemTitle: "Cold-Chain Spoilage in Tropical Last-Mile Logistics",
    problemChallenge: "Tropical smallholders lose up to 45% of fresh produce value during transit between farms and local markets due to unpredictable delays and lack of low-cost, off-grid refrigeration units.",
    ideaTitle: "ThermoFreeze Off-Grid",
    ideaDescription: "Phase-change material (PCM) cooled industrial cargo boxes equipped with solar-recharged thermoelectric cells that maintain a constant 4°C for 72 hours without active battery power.",
    visibility: "public"
  },
  {
    category: "HealthTech",
    problemTitle: "Silent Cardiac Arrests in Post-Operative Patients at Home",
    problemChallenge: "Post-surgery cardiac events at home are often detected too late because traditional spot-checking monitors fail to capture continuous early warning variations in heart rate variability (HRV).",
    ideaTitle: "PulseSentinel Wearable",
    ideaDescription: "A clinical-grade continuous biophotonic neck-patch that runs local edge-AI neural nets to analyze micro-vibrations of the carotid artery, predicting cardiac anomalies 30 minutes before physical onset.",
    visibility: "restricted"
  },
  {
    category: "DeepTech",
    problemTitle: "Quantum Decoherence in Cryogenic Processing Chambers",
    problemChallenge: "Industrial quantum qubits suffer sudden decoherence and loss of computational states due to microscopic electromagnetic thermal noise passing through cryo-chamber shielding layers.",
    ideaTitle: "Decoherence Shield",
    ideaDescription: "Active superconducting metamaterials that dynamically emit counter-phase magnetic waves, canceling thermal and cosmic radiation interference at sub-Kelvin levels.",
    visibility: "investor"
  },
  {
    category: "FinTech",
    problemTitle: "High Transaction Friction for Micro-Remittances in Emerging Markets",
    problemChallenge: "Migrant workers sending small funds home face exorbitant 8-12% fees because traditional cross-border settlement routes require multiple correspondent banks and high security margins.",
    ideaTitle: "NanoSwap Corridor",
    ideaDescription: "A liquidity-pool backed multi-chain settlement engine that executes cross-border payments instantly over local payment systems (like UPI or Pix) for a flat sub-cent transaction cost.",
    visibility: "public"
  },
  {
    category: "Clean Energy",
    problemTitle: "Low Wind Velocity Urban Turbulence Capturing",
    problemChallenge: "Traditional wind turbine models are useless in dense cities because winds are weak, fragmented, and highly turbulent, creating uneven structural wear instead of steady electricity.",
    ideaTitle: "AeroVane Helix",
    ideaDescription: "Vertical-axis wind turbines utilizing lightweight carbon-fiber sails that auto-align to low-velocity multidirectional turbulence, generating silent residential power starting at 1.5m/s wind speed.",
    visibility: "public"
  },
  {
    category: "SpaceTech",
    problemTitle: "High-Velocity Orbit Space Debris Collisions",
    problemChallenge: "Satellites in Low Earth Orbit (LEO) face critical damage risks from over 100 million micro-debris pieces too small for terrestrial radars to track, causing catastrophic hardware punctures.",
    ideaTitle: "OrbitShield Pulsar",
    ideaDescription: "Low-mass electromagnetic deflection plates mounted on satellites that generate dynamic plasma fields to alter the trajectory of oncoming micro-debris.",
    visibility: "public"
  },
  {
    category: "CyberSecurity",
    problemTitle: "Firmware Exploitations on Critical Water Infrastructure Control Systems",
    problemChallenge: "Municipal water valves and flow regulators are highly vulnerable to zero-day firmware over-writes because their legacy microcontrollers lack computational memory for standard decryption codes.",
    ideaTitle: "ValvGuard Hardware",
    ideaDescription: "An inline physical crypto-gate that intercepts control commands at the bus level, validating commands using ultra-lightweight elliptic curve cryptography before relaying to the valve.",
    visibility: "restricted"
  },
  {
    category: "BioTech",
    problemTitle: "Ineffective Treatment for Resistant Crop Soil Fungal Blight",
    problemChallenge: "Traditional chemical fungicides pollute underground aquifers and trigger rapid drug-resistance in soil-borne fungi, leaving crops defenseless within three growing seasons.",
    ideaTitle: "BioFungus Inhibitor",
    ideaDescription: "A targeted biological spray containing custom-engineered benign soil phages that selectively penetrate and dissolve the chitinous cell walls of pathogenic blight without harming beneficial root bacteria.",
    visibility: "public"
  },
  {
    category: "OceanTech",
    problemTitle: "Unregulated Coral Reef Thermal Bleaching Cascades",
    problemChallenge: "Coral reefs undergo sudden thermal bleaching during seasonal ocean heatwaves because local ecosystems cannot adjust to rapid 1.5°C water temperature spikes.",
    ideaTitle: "ReefCool Aerators",
    ideaDescription: "Subsurface wave-powered deepwater pump arrays that pull cooler, nutrient-rich ocean water from the twilight zone (80m deep) and diffuse it over shallow coral beds during peak heating cycles.",
    visibility: "public"
  },
  {
    category: "Materials",
    problemTitle: "Massive Environmental Impact of Construction Cement Emissions",
    problemChallenge: "Concrete manufacturing accounts for 8% of global CO2 emissions due to the high-heat calcination of limestone required to bind traditional cement mixes.",
    ideaTitle: "BioCement Silicates",
    ideaDescription: "A structural-grade bio-binding agent produced by cultured bacteria that mineralizes sand into concrete-strength stone at ambient room temperature, generating zero carbon emissions.",
    visibility: "public"
  },
  {
    category: "Mobility",
    problemTitle: "Unpredictable Electric Vehicle Fleet Battery Degredation",
    problemChallenge: "EV logistics networks experience sudden battery failures and high replacement costs because charging schedules are blind to internal cell chemical wear patterns.",
    ideaTitle: "Voltech Diagnostic Edge",
    ideaDescription: "An onboard telemetry controller that runs high-fidelity electrochemical impedance spectroscopy in real-time, optimizing EV charging speeds dynamically to double battery longevity.",
    visibility: "public"
  },
  {
    category: "EduTech",
    problemTitle: "High Attrition for Remote STEM Students Lacking Lab Equipment",
    problemChallenge: "Rural students in remote STEM classes drop out at rates exceeding 60% because online classrooms cannot replicate the tactile, hands-on feedback of real chemistry and physics labs.",
    ideaTitle: "LabPack VR",
    ideaDescription: "An interactive educational platform combining low-cost physical microfluidic trays with immersive VR headsets, allowing remote students to perform real chemical experiments safely at home.",
    visibility: "public"
  },
  {
    category: "Clean Energy",
    problemTitle: "Industrial Waste Heat Dissipation Losses",
    problemChallenge: "Steel and cement refineries waste more than 35% of their total input energy in the form of low-grade thermal exhaust, because standard recovery turbines require high pressure steam.",
    ideaTitle: "ThermGen Arrays",
    ideaDescription: "High-efficiency solid-state thermoelectric generators leveraging silicon-germanium nanostructures that convert low-grade waste exhaust (100°C - 300°C) directly into electrical current.",
    visibility: "investor"
  },
  {
    category: "AgriTech",
    problemTitle: "High Water Footprint in Sub-Surface Hydroponic Operations",
    problemChallenge: "Hydroponic facilities face critical operational expenses and mineral build-up because current closed-loop water recirculation systems require weekly flushes to prevent bacterial pathogens.",
    ideaTitle: "ClearFlow Sanitizer",
    ideaDescription: "An inline multi-stage purification tube combining silver-nanoparticle mesh and deep UV-C lasers to continuously sanitize nutrient solutions, reducing water discharge to zero.",
    visibility: "public"
  },
  {
    category: "Quantum Computing",
    problemTitle: "Inefficient Multi-Node Quantum Teleportation Routing",
    problemChallenge: "Early quantum networks struggle to route entanglement states across multiple nodes due to polarization drift and phase jitter along standard underground fiber-optic links.",
    ideaTitle: "EntangleRouter Node",
    ideaDescription: "Active polarization-compensation routing nodes that dynamically sense and correct fiber noise in real-time, enabling stable entanglement-swapping over metropolitan distances.",
    visibility: "public"
  },
  {
    category: "HealthTech",
    problemTitle: "Unstable Delivery of Fragile Biological Therapeutics",
    problemChallenge: "Next-generation mRNA and enzyme therapeutics fail inside the human bloodstream because traditional lipid nanoparticles dissolve premature when exposed to systemic immune cells.",
    ideaTitle: "NanoCapsule Safe",
    ideaDescription: "pH-sensitive biodegradable smart nanostructures that remain locked in systemic circulation and release their therapeutic cargo *only* inside highly acidic cancer cell environments.",
    visibility: "public"
  },
  {
    category: "FoodTech",
    problemTitle: "High Structural Fragility of Cultivated Cell Meat",
    problemChallenge: "Lab-grown meat lacks the realistic muscle texture of conventional livestock because cultured cells fail to form aligned, long-chain fiber bundles without complex growth matrices.",
    ideaTitle: "Scaff-Grow Fibers",
    ideaDescription: "A edible, plant-derived micro-fibrous scaffold fabricated using electrospinning that guides cell proliferation along natural grain lines, producing realistic steak textures.",
    visibility: "restricted"
  },
  {
    category: "CyberSecurity",
    problemTitle: "Malicious AI Model Swarm Poisioning Attacks",
    problemChallenge: "Decentralized edge-AI networks are highly susceptible to model poisoning attacks, where compromised edge devices transmit corrupt weight gradients to corrupt the main model.",
    ideaTitle: "SwarmVerify Ledger",
    ideaDescription: "A decentralized cryptographic validation ledger that audits individual model gradient updates using zero-knowledge proofs before aggregating them into the global model weights.",
    visibility: "public"
  },
  {
    category: "Smart Cities",
    problemTitle: "Inefficient Traffic Surge Routing in Congested Metro Channels",
    problemChallenge: "Cities suffer severe gridlock and increased carbon emissions because urban traffic signals operate on static timers that cannot adapt to spontaneous emergency or surge patterns.",
    ideaTitle: "FlowNode AI",
    ideaDescription: "Decoupled intersection controller nodes that utilize localized thermal cameras and edge reinforcement learning algorithms to coordinate green-wave routes in real-time.",
    visibility: "public"
  },
  {
    category: "Circular Economy",
    problemTitle: "Contaminated Industrial Textile Recycling Blockers",
    problemChallenge: "Over 90 million tons of polyester-blend garments are sent to landfills annually because chemical dyes and multi-fiber blends prevent traditional mechanical shredding and reprocessing.",
    ideaTitle: "TexRecycle Solvent",
    ideaDescription: "A selective green solvent process that dissolves and extracts pure polyester polymers from blended textiles, leaving organic cotton fibers intact for high-grade secondary spinning.",
    visibility: "public"
  },
  {
    category: "FinTech",
    problemTitle: "High Default Rates on Micro-Loans for Agricultural Co-ops",
    problemChallenge: "Micro-finance institutions suffer massive losses when loaning to farming co-ops due to the lack of real-time crop growth tracking, leading to misaligned repayment timelines.",
    ideaTitle: "AgriScore Oracle",
    ideaDescription: "A smart contract oracle system that feeds satellite vegetation indices (NDVI) directly to lending systems, dynamically adjusting loan repayment rates based on real harvest yield forecasts.",
    visibility: "public"
  },
  {
    category: "Clean Energy",
    problemTitle: "High Degradation of Deep-Cycle Sodium Ion Battery Pack Cells",
    problemChallenge: "Low-cost sodium-ion batteries face severe capacity drop-offs after 500 charge cycles because sodium ions cause severe volume swelling in traditional carbon anodes.",
    ideaTitle: "Sod-Volt Anodes",
    ideaDescription: "Multi-layered graphene-composite anodes with pre-engineered expansion gaps that allow sodium ions to intercalate smoothly without causing mechanical structural fractures.",
    visibility: "public"
  },
  {
    category: "DeepTech",
    problemTitle: "Inefficient Real-Time Machine Translation of Spatial Audio Signals",
    problemChallenge: "Industrial headsets struggle to translate localized warning calls in hazardous environments because spatial acoustic details are lost during standard audio-to-text digitization.",
    ideaTitle: "SpatialAudio Trans",
    ideaDescription: "A binaural edge-processor that preserves physical audio location, volume dynamics, and spatial direction while performing zero-latency neural speech translation.",
    visibility: "public"
  },
  {
    category: "SpaceTech",
    problemTitle: "Heavy Fuel Payload Constraints for Mars Transit Flights",
    problemChallenge: "Crewed deep-space missions face severe weight and fuel constraints because traditional chemical thrusters require launching massive fuel payloads from Earth's gravity well.",
    ideaTitle: "IonPulsar Engine",
    ideaDescription: "A high-thrust plasma ion propulsion system fueled by harvesting ambient atmospheric CO2 during low-orbital passages around Earth and Mars, reducing initial launch mass by 70%.",
    visibility: "public"
  }
];

function jitter(value, amount = 0.04) {
  return value + (Math.random() - 0.5) * amount;
}

async function seed() {
    console.log("🔥 STARTING BEST 25 SEEDING CYCLE...");
    console.log("⚠️  This will generate 25 Authentication Users, 25 Problems, and 25 premium linked Ideas.\n");

    const startTime = Date.now();

    // 1. Seed Auth Users and Profiles
    console.log("👤 Seeding Firebase Auth accounts and user profile documents...");
    for (const u of seedUsers) {
        try {
            // Check if user exists or create in Auth
            try {
                await auth.createUser({
                    uid: u.id,
                    email: u.email,
                    emailVerified: true,
                    password: "Password123!",
                    displayName: u.name
                });
                console.log(`  👤 Created Auth Account: ${u.name} (UID: ${u.id})`);
            } catch (err) {
                if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
                    console.log(`  👤 Auth account for ${u.name} already exists. Syncing...`);
                } else {
                    throw err;
                }
            }

            // Sync user to Firestore
            await db.collection("users").doc(u.id).set({
                id: u.id,
                email: u.email,
                username: u.username,
                name: u.name,
                country: u.country,
                mode: u.mode,
                trustScore: u.trustScore,
                reportsCount: 0,
                contributionActivity: Math.floor(Math.random() * 50) + 10,
                createdAt: Timestamp.now()
            });
        } catch (err) {
            console.error(`❌ Failed to sync user ${u.name}:`, err.message);
        }
    }

    // 2. Seed Problems and Ideas
    console.log("\n📦 Seeding 25 Parent Problems & Premium Linked Ideas...");
    let successCount = 0;

    for (let i = 0; i < best25Datasets.length; i++) {
        const item = best25Datasets[i];
        const user = seedUsers[i % seedUsers.length];

        // Coordinate placement (staggered around Indian hubs to keep scanner robust)
        const cityData = CITIES[i % CITIES.length];
        const lat = jitter(cityData.lat);
        const lng = jitter(cityData.lng);
        const geohash = ngeohash.encode(lat, lng, 6);

        // a. Create Problem
        let problemId = "";
        try {
            const probRef = await db.collection("problems").add({
                title: item.problemTitle,
                description: item.problemChallenge,
                category: item.category,
                userId: user.id,
                authorUsername: user.username,
                authorTrustScore: user.trustScore,
                lat,
                lng,
                city: cityData.city,
                status: "open",
                createdAt: Timestamp.fromDate(new Date(startTime - (best25Datasets.length - i) * 7200000)) // staggered
            });
            problemId = probRef.id;
        } catch (e) {
            console.error(`❌ Failed to seed problem for "${item.ideaTitle}":`, e.message);
            continue;
        }

        // b. Create Idea
        try {
            const views = Math.floor(Math.random() * 75) + 20;
            const likesCount = Math.floor(views * (0.3 + Math.random() * 0.4));
            const engagementScore = likesCount * 3 + views;
            const executionStatus = i % 3 === 0 ? "Building" : i % 3 === 1 ? "Refining" : "Thinking";

            const ideaData = {
                title: item.ideaTitle,
                idea: item.ideaDescription,
                category: item.category,
                lat,
                lng,
                city: cityData.city,
                location: {
                    city: cityData.city,
                    lat,
                    lng,
                    geohash
                },
                engagementScore,
                likesCount,
                views,
                userId: user.id,
                authorUsername: user.username,
                authorTrustScore: user.trustScore,
                problemId: problemId,
                visibility: item.visibility,
                executionStatus,
                currentVersion: 1,
                createdAt: Timestamp.fromDate(new Date(startTime - (best25Datasets.length - i) * 7200000))
            };

            await db.collection("ideas").add(ideaData);
            
            // Increment views and likes logs optionally or just seed stats
            successCount++;
            console.log(`  [${successCount}/25] ✅ Pushed Idea: "${item.ideaTitle}" (Linked to Problem ID: ${problemId.slice(0, 6)})`);
        } catch (e) {
            console.error(`❌ Failed to push idea "${item.ideaTitle}":`, e.message);
        }
    }

    console.log(`\n🎉 Best 25 Seeding Cycle Completed! ${successCount}/25 ideas and parent problems loaded.`);
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Critical seeding failure:", err);
    process.exit(1);
});
