import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('C:/Users/arunp/Downloads/inzly-3518e-firebase-adminsdk-fbsvc-f126166679.json');

const adminApp = initializeApp({ credential: cert(serviceAccount) }, 'enrichmentApp');
const db = getFirestore(adminApp);

const ENRICHMENTS = {
    "u_kenji": {
        bio: "AI Research Engineer & Game Developer. Passionate about edge intelligence, interactive game trees, and dynamic, believable RPG non-player characters.",
        totalLikes: 142
    },
    "u_hans": {
        bio: "Early-stage venture partner at CleanTech Capital. Investing in industrial decarbonization, high-yield battery tech, and smart grid automation.",
        totalLikes: 210
    },
    "u_sarah": {
        bio: "Creative product designer and circular economy advocate. Sprouting ideas that change daily habits and eliminate retail single-use waste.",
        totalLikes: 95
    },
    "u_mateus": {
        bio: "Agritech systems specialist. Designing ultra-low-power off-grid sensors, phase-change cargo units, and autonomous tropical watering networks.",
        totalLikes: 78
    },
    "u_rohan": {
        bio: "Quantum compiler engineer and cryogenics researcher. Designing active superconducting metamaterials to shield qubits from thermal noise.",
        totalLikes: 119
    },
    "u_emma": {
        bio: "UX researcher and micro-mobility advocate. Analyzing urban municipal transit paths, pedestrian safety, and smart logistics.",
        totalLikes: 54
    },
    "u_pierre": {
        bio: "Aerospace engineer and orbital safety researcher. Innovating low-mass electromagnetic deflection plates and plasma shielding solutions.",
        totalLikes: 131
    },
    "u_chloe": {
        bio: "FinTech angel investor and former risk officer. Backing secure multi-chain remittance tunnels, MPC crypto-wallets, and alternative credit systems.",
        totalLikes: 180
    },
    "u_jack": {
        bio: "Marine electronics engineer and IoT developer. Creating wave-powered subsurface cooling grids and automated nutrient diffusion arrays.",
        totalLikes: 89
    },
    "u_chidi": {
        bio: "BioTech engineer. Synthesizing benign soil phages and target-delivery crop capsules to combat multi-drug resistant agricultural blight.",
        totalLikes: 104
    },
    "u_thabo": {
        bio: "Industrial materials designer. Engineering room-temperature concrete-strength bio-cement silicates from eco-friendly bacterial cultures.",
        totalLikes: 112
    },
    "u_minjun": {
        bio: "EV fleet systems developer. Coding embedded electrochemical impedance spectroscopy algorithms to double heavy-vehicle battery lifespans.",
        totalLikes: 125
    },
    "u_liwei": {
        bio: "Decentralized liquidity systems architect. Designing low-fee instant transaction pipelines matching regional instant payment methods.",
        totalLikes: 167
    },
    "u_bram": {
        bio: "Smart infrastructure engineer. Implementing decoupled, edge reinforcement learning intersections and green-wave traffic models.",
        totalLikes: 91
    },
    "u_giulia": {
        bio: "Textile engineer and circular fashion advocate. Formulating green solvents to separate polyester polymers from blended luxury fabrics.",
        totalLikes: 138
    },
    "u_ale": {
        bio: "Renewable integration consultant. Deploying solid-state solar routers redirecting agricultural peaks into modular green hydrogen production.",
        totalLikes: 74
    },
    "u_sofia": {
        bio: "Residential HVAC engineer. Auditing domestic heat pumps and neighborhood virtual fractional solar networks.",
        totalLikes: 63
    },
    "u_lucas": {
        bio: "B2B shipping platform developer. Building routing platforms to match returning freight trucks with local farm shipments.",
        totalLikes: 82
    },
    "u_astrid": {
        bio: "STEM curriculum developer. Designing tactile microfluidic kits and interactive virtual reality science labs for off-grid schools.",
        totalLikes: 115
    },
    "u_marc": {
        bio: "Industrial energy broker. Harnessing low-grade waste refinery exhaust with silicon-germanium nanostructured thermoelectric generators.",
        totalLikes: 120
    },
    "u_layla": {
        bio: "Hydroponics facilities operations director. Maximizing system water efficiency with silver-nanoparticle and UV-C purification loops.",
        totalLikes: 97
    },
    "u_wanjiku": {
        bio: "Agritech engineer and micro-finance builder. Connecting satellite-derived NDVI vegetation health indexing to lending platforms.",
        totalLikes: 154
    },
    "u_faisal": {
        bio: "Propulsion design lead. Developing high-thrust plasma ion propulsion engines using ambient carbon dioxide harvesting.",
        totalLikes: 148
    },
    "u_demir": {
        bio: "Binaural DSP engineer. Building localized neural speech translation systems for protective headsets in hazardous factories.",
        totalLikes: 101
    },
    "u_nguyen": {
        bio: "Decentralized security engineer. Developing zero-knowledge cryptographic proof ledgers to shield swarm edge-AI nodes from poison attacks.",
        totalLikes: 122
    }
};

async function enrich() {
    console.log("🌟 STARTING DATABASE ENRICHMENT PROCESS...");
    
    // 1. Enrich Users
    console.log("\n👤 Adding bios and total likes to 25 innovators...");
    let userCount = 0;
    for (const [userId, data] of Object.entries(ENRICHMENTS)) {
        try {
            await db.collection("users").doc(userId).update({
                bio: data.bio,
                totalLikes: data.totalLikes
            });
            userCount++;
            console.log(`  👤 Enriched user: ${userId} (${data.totalLikes} Likes)`);
        } catch (err) {
            console.error(`  ❌ Failed to enrich user ${userId}:`, err.message);
        }
    }

    // 2. Seed siteStats/globals
    console.log("\n📈 Initializing global site stats document (siteStats/globals)...");
    try {
        await db.collection("siteStats").doc("globals").set({
            totalVisitors: 1543
        }, { merge: true });
        console.log("  📈 Successfully set siteStats/globals to 1543 visitors.");
    } catch (err) {
        console.error("  ❌ Failed to set siteStats/globals:", err.message);
    }

    console.log(`\n🎉 Enrichment cycle complete! ${userCount}/25 users fully enriched with biographies.`);
    process.exit(0);
}

enrich().catch(err => {
    console.error("❌ Critical enrichment failure:", err);
    process.exit(1);
});
