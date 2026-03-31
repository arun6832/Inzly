// Seed script: Creates 5 user profiles and 50 innovative idea cards in Firestore
// Run with: node scripts/seed-ideas.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { firebaseConfig } from "./credentials.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Seed Users ─────────────────────────────────────────────
const seedUsers = [
    {
        id: "inzly_user_zara",
        name: "Zara Innovate",
        email: "zara@inzly.io",
        country: "Estonia",
        totalLikes: 42,
        emailVerified: true,
        createdAt: Timestamp.now(),
    },
    {
        id: "inzly_user_marcus",
        name: "Marcus Fintech",
        email: "marcus@inzly.io",
        country: "United Kingdom",
        totalLikes: 128,
        emailVerified: true,
        createdAt: Timestamp.now(),
    },
    {
        id: "inzly_user_elena",
        name: "Elena Dev",
        email: "elena@inzly.io",
        country: "Canada",
        totalLikes: 89,
        emailVerified: true,
        createdAt: Timestamp.now(),
    },
    {
        id: "inzly_user_sam",
        name: "Sam Social",
        email: "sam@inzly.io",
        country: "USA",
        totalLikes: 56,
        emailVerified: true,
        createdAt: Timestamp.now(),
    },
    {
        id: "inzly_user_chloe",
        name: "Chloe Green",
        email: "chloe@inzly.io",
        country: "Germany",
        totalLikes: 73,
        emailVerified: true,
        createdAt: Timestamp.now(),
    }
];

// ── 50 Innovative Ideas ───────────────────────────────────
const rawIdeas = [
    // 1-10 (User: Zara - AI/ML)
    {
        title: "DreamForge — AI Dream Journal",
        problem: "Subconscious creativity is lost upon waking.",
        idea: "An app that captures dreams and uses AI to generate actionable startup concepts from recurring patterns.",
        category: "AI/ML",
        githubUrl: "https://github.com/inzly/dreamforge-engine",
        userId: "inzly_user_zara"
    },
    {
        title: "TruthLens — AI Fact-Checker",
        problem: "Misinformation spreads 6x faster than truth.",
        idea: "A browser extension that highlights claims and overlays real-time fact-check scores from trusted databases.",
        category: "AI/ML",
        githubUrl: "https://github.com/inzly/truthlens-ext",
        userId: "inzly_user_zara"
    },
    {
        title: "PlantPal — CV Plant Doctor",
        problem: "Gardeners struggle to diagnose plant diseases.",
        idea: "Snap a photo of your plant and an AI identifies species and suggests a treatment plan.",
        category: "AI/ML",
        githubUrl: "https://github.com/inzly/plantpal-vision",
        userId: "inzly_user_zara"
    },
    {
        title: "VoiceVault — Ethical Cloning",
        problem: "Loved ones' voices are lost forever after passing.",
        idea: "Ethically clone voices to narrate family trees and read bedtime stories for future generations.",
        category: "AI/ML",
        userId: "inzly_user_zara"
    },
    {
        title: "DebateForge — Argument Analyzer",
        problem: "Lack of objective feedback on persuasive writing.",
        idea: "Paste text and AI scores logical coherence and suggests counterarguments to preemptively address.",
        category: "AI/ML",
        githubUrl: "https://github.com/inzly/debateforge-core",
        userId: "inzly_user_zara"
    },
    {
        title: "MoodMint — Generative Wellness",
        problem: "Wellness journals lack emotional reward.",
        idea: "Transform daily check-ins into evolving digital art pieces that visually represent emotional growth.",
        category: "AI/ML",
        userId: "inzly_user_zara"
    },
    {
        title: "AncestorAI — History Persona",
        problem: "Family history feels disconnected from modern life.",
        idea: "Create a conversational persona based on historical family documents and photos.",
        category: "AI/ML",
        githubUrl: "https://github.com/inzly/ancestor-ai",
        userId: "inzly_user_zara"
    },
    {
        title: "ShelfLife — Zero-Waste Recipes",
        problem: "Households waste $1,500 of food annually.",
        idea: "Scan your fridge and AI generates recipes for items closest to their expiration date.",
        category: "AI/ML",
        userId: "inzly_user_zara"
    },
    {
        title: "RetailRadar — Inventory Vision",
        problem: "Small shops lose sales due to stockouts they don't notice.",
        idea: "Low-cost camera AI that monitors shelves and alerts owners when products need restocking.",
        category: "AI/ML",
        userId: "inzly_user_zara"
    },
    {
        title: "GhostWriter — AI Screenplay Partner",
        problem: "Screenwriters struggle with consistent pacing and character voice.",
        idea: "An AI buddy that specifically tracks character arcs and alerts you when a beat feels out of character.",
        category: "AI/ML",
        userId: "inzly_user_zara"
    },

    // 11-20 (User: Marcus - Fintech)
    {
        title: "FreelanceShield — Micro-Insurance",
        problem: "Gig workers have no safety net.",
        idea: "Pay-as-you-earn micro-insurance policies that adjust coverage based on monthly earnings.",
        category: "Fintech",
        githubUrl: "https://github.com/inzly/shield-smart-contracts",
        userId: "inzly_user_marcus"
    },
    {
        title: "RentReady — Credit Builder",
        problem: "Rent payments don't count towards credit scores.",
        idea: "Verify rent payments and report them to bureaus to boost thin credit files.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },
    {
        title: "InvoiceGuard — Late Pay Protection",
        problem: "SMBs wait 60+ days for invoice payments.",
        idea: "A layer that guarantees invoice payment within 48 hours for a small fee.",
        category: "Fintech",
        githubUrl: "https://github.com/inzly/invoice-guard-api",
        userId: "inzly_user_marcus"
    },
    {
        title: "WellPay — Healthcare Installments",
        problem: "Medical bills cause personal bankruptcy.",
        idea: "Split medical bills into 0% interest micro-installments negotiated with providers.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },
    {
        title: "PayStream — Salary Streaming",
        problem: "The bi-weekly pay cycle causes debt traps.",
        idea: "Allow employees to withdraw earned salary in real-time as they earn it.",
        category: "Fintech",
        githubUrl: "https://github.com/inzly/pay-streaming-proto",
        userId: "inzly_user_marcus"
    },
    {
        title: "SplitWise for Business",
        problem: "Founders struggle to track shared expenses and equity burn.",
        idea: "An expense tracker that calculates real-time equity dilution based on capital contributions.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },
    {
        title: "CapTable VR",
        problem: "Complex cap tables are hard to visualize for early employees.",
        idea: "Visual, interactive 3D model of your company's equity structure and exit scenarios.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },
    {
        title: "KidCoin — Financial Literacy",
        problem: "Kids learn about money too late.",
        idea: "A gamified banking app for kids that uses virtual tokens backed by parent deposits.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },
    {
        title: "TaxTamer — Crypto Tax Prep",
        problem: "DeFi users struggle with thousands of complex tax events.",
        idea: "One-click CSV generator for tax compliance that supports 50+ blockchains.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },
    {
        title: "EthicalInvest — ESG Tracker",
        problem: "Retail investors don't know if their ETFs are truly green.",
        idea: "Real-time auditing of portfolio holdings against deep ESG data points.",
        category: "Fintech",
        userId: "inzly_user_marcus"
    },

    // 21-30 (User: Elena - DevTools)
    {
        title: "CodeWhisper — Legacy Guide",
        problem: "Developers spend 60% of time reading legacy code.",
        idea: "An IDE extension that acts as a conversational guide to any codebase.",
        category: "DevTools",
        githubUrl: "https://github.com/inzly/whisper-ide-plugin",
        userId: "inzly_user_elena"
    },
    {
        title: "GitFolio — Auto Portfolio",
        problem: "Developers hate building personal sites.",
        idea: "Connect GitHub and auto-generate a stunning, responsive portfolio.",
        category: "DevTools",
        githubUrl: "https://github.com/inzly/gitfolio-generator",
        userId: "inzly_user_elena"
    },
    {
        title: "BugBountyJr — Security for Teens",
        problem: "Early security education is dry and clinical.",
        idea: "Gamified cybersecurity training in a safe sandbox environment.",
        category: "DevTools",
        userId: "inzly_user_elena"
    },
    {
        title: "DeployDash — One-Click Environments",
        problem: "Setting up staging is friction-heavy for small teams.",
        idea: "Ephemeral staging links for every branch with zero configuration.",
        category: "DevTools",
        githubUrl: "https://github.com/inzly/deploy-dash-cli",
        userId: "inzly_user_elena"
    },
    {
        title: "LogLogic — AI Observability",
        problem: "Digging through logs during an outage is slow.",
        idea: "Feed logs to an AI that instantly correlates errors across microservices.",
        category: "DevTools",
        userId: "inzly_user_elena"
    },
    {
        title: "ApiBridge — Auto SDK Gen",
        problem: "Writing client SDKs for APIs is repetitive.",
        idea: "Generate type-safe SDKs for TS, Go, and Python directly from OpenAPI specs.",
        category: "DevTools",
        githubUrl: "https://github.com/inzly/api-bridge-gen",
        userId: "inzly_user_elena"
    },
    {
        title: "QueryQuest — SQL Trainer",
        problem: "Junior devs struggle with complex SQL joins.",
        idea: "An interactive RPG where you solve quests by writing increasingly complex SQL queries.",
        category: "DevTools",
        userId: "inzly_user_elena"
    },
    {
        title: "DockerDream — Visual Container Management",
        problem: "Docker CLI is intimidating for beginners.",
        idea: "A local GUI that visualizes your container network and resource usage in real-time.",
        category: "DevTools",
        userId: "inzly_user_elena"
    },
    {
        title: "RefactorRelay — Team Code Review",
        problem: "Async code reviews take hours to resolve.",
        idea: "A real-time, multiplayer code review environment and pair programming tool.",
        category: "DevTools",
        userId: "inzly_user_elena"
    },
    {
        title: "SchemaSync — DB Collab",
        problem: "Teams struggle with out-of-sync database schemas.",
        idea: "Vercel-like experience for database migrations and schema evolution.",
        category: "DevTools",
        userId: "inzly_user_elena"
    },

    // 31-40 (User: Sam - Consumer Social)
    {
        title: "CarbonPlate — Meal Footprint",
        problem: "Zero visibility into meal environmental cost.",
        idea: "Snap a photo of your meal and get an AI footprint calculation.",
        category: "Consumer Social",
        githubUrl: "https://github.com/inzly/carbon-footprint-db",
        userId: "inzly_user_sam"
    },
    {
        title: "LocalLoop — Micro-Commerce",
        problem: "Small batch sellers lack hyper-local visibility.",
        idea: "A community commerce app with a 2-km radius feed for neighborhood selling.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },
    {
        title: "NomadNest — Coliving Match",
        problem: "Nomads waste time finding compatible roommates.",
        idea: "AI matching platform specifically for digital nomads seeking shared living.",
        category: "Consumer Social",
        githubUrl: "https://github.com/inzly/nomad-match-algo",
        userId: "inzly_user_sam"
    },
    {
        title: "MealBridge — Surplus Connect",
        problem: "Restaurants waste billions of pounds of food.",
        idea: "Real-time bridge between restaurant surplus and community fridges.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },
    {
        title: "ParkByte — Spot Rental",
        problem: "Urban parking is an expensive nightmare.",
        idea: "Airbnb for private parking spots, rented by the hour via smart locks.",
        category: "Consumer Social",
        githubUrl: "https://github.com/inzly/parkbyte-lock-api",
        userId: "inzly_user_sam"
    },
    {
        title: "UrbanForest — Adopt a Tree",
        problem: "Deforestation feels abstract to urbanites.",
        idea: "Adopt a geotagged tree and monitor its growth via satellite imagery.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },
    {
        title: "QuietQuest — Digital Detox",
        problem: "Social media addiction is reachng peak levels.",
        idea: "A gamified app that rewards you with real-world perks for staying offline.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },
    {
        title: "SkillSpot — Local Mentorship",
        problem: "Gen Z lacks face-to-face mentorship in their neighborhoods.",
        idea: "Tinder for mentorship: match with local experts for 1-hour coffee chats.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },
    {
        title: "VinylVault — Record Sharing",
        problem: "Vinyl collection is expensive and lonely.",
        idea: "A trusted local network for lending and trading high-end vinyl records.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },
    {
        title: "DoggyDash — Peer Dog Walking",
        problem: "Professional dog walkers are expensive.",
        idea: "Connect with neighbors who are already walking their dogs to take yours along.",
        category: "Consumer Social",
        userId: "inzly_user_sam"
    },

    // 41-50 (User: Chloe - Healthtech/SaaS/Other)
    {
        title: "SkillSwap — Knowledge Barter",
        problem: "Founders lack cash for multi-disciplinary hiring.",
        idea: "A platform where professionals trade skills on a time-credit system.",
        category: "SaaS",
        githubUrl: "https://github.com/inzly/skillswap-ledger",
        userId: "inzly_user_chloe"
    },
    {
        title: "SoilSense — IoT Crop Health",
        problem: "Small farmers lose 40% of crops to soil issues.",
        idea: "A $15 solar sensor that sends SMS alerts in local languages.",
        category: "Healthtech",
        userId: "inzly_user_chloe"
    },
    {
        title: "QuietHours — Focus Middleware",
        problem: "Knowledge workers are interrupted every 11 mins.",
        idea: "AI middleware that holds non-urgent Slack/Email during focus blocks.",
        category: "SaaS",
        githubUrl: "https://github.com/inzly/quiet-hours-app",
        userId: "inzly_user_chloe"
    },
    {
        title: "HireBlind — Anonymous Hiring",
        problem: "Unconscious bias poisons the hiring funnel.",
        idea: "Candidates complete real exercises graded blindly by AI and reviewers.",
        category: "SaaS",
        userId: "inzly_user_chloe"
    },
    {
        title: "ContractIQ — AI Review",
        problem: "SMBs sign legal docs they don't understand.",
        idea: "Upload any contract and AI highlights risky clauses in plain English.",
        category: "SaaS",
        githubUrl: "https://github.com/inzly/contract-iq-parser",
        userId: "inzly_user_chloe"
    },
    {
        title: "FounderFit — Compatibility",
        problem: "70% of startups fail due to co-founder conflict.",
        idea: "A deep assessment of working styles for potential co-founders.",
        category: "SaaS",
        userId: "inzly_user_chloe"
    },
    {
        title: "EchoLearn — Podcast Spaced Repetition",
        problem: "Podcast listeners retain almost nothing a week later.",
        idea: "Generate flashcards and audio quizzes from the content you listen to.",
        category: "Other",
        userId: "inzly_user_chloe"
    },
    {
        title: "StageReady — VR Audience",
        problem: "Public speaking fear is the #1 fear globally.",
        idea: "A VR app that simulates audiences that react to your pacing and tone.",
        category: "Other",
        userId: "inzly_user_chloe"
    },
    {
        title: "SleepStream — Ambient AI",
        problem: "Static white noise machines don't adapt to night noise.",
        idea: "An AI that listens to your environment and generates adaptive masking sounds.",
        category: "Healthtech",
        userId: "inzly_user_chloe"
    },
    {
        title: "FitGrid — Decentralized Gyms",
        problem: "Home gyms are underutilized; public gyms are crowded.",
        idea: "Rent out your home gym equipment to verified neighbors by the hour.",
        category: "Healthtech",
        userId: "inzly_user_chloe"
    }
];

async function seed() {
    console.log("🌱 Starting Premium Inzly seed (5 Users, 50 Ideas)...\n");

    // 1. Create 5 users
    try {
        for (const user of seedUsers) {
            await setDoc(doc(db, "users", user.id), user);
            console.log(`✅ Created user: "${user.name}" (${user.id})`);
        }
    } catch (err) {
        console.error("❌ Failed to create users:", err.message);
    }

    console.log("\n🚀 Pushing 50 Innovative Ideas...");

    // 2. Push all 50 ideas
    let successCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < rawIdeas.length; i++) {
        const idea = rawIdeas[i];
        const ideaData = {
            ...idea,
            createdAt: Timestamp.fromDate(new Date(startTime - (rawIdeas.length - i) * 600000)), // stagger by 10 mins each
            likesCount: Math.floor(Math.random() * 20) + 5, // random initial likes
            views: Math.floor(Math.random() * 100) + 50,  // random initial views
        };

        try {
            const docRef = await addDoc(collection(db, "ideas"), ideaData);
            successCount++;
            console.log(`  [${successCount}/50] ✅ "${idea.title}" → ${docRef.id}`);
        } catch (err) {
            console.error(`  ❌ Failed to push "${idea.title}":`, err.message);
        }
    }

    console.log(`\n🎉 Premium Seed complete! ${successCount}/50 ideas pushed.`);
    console.log(`👥 Total Users Created: 5`);
    console.log(`📦 GitHub Repos Seeded: ${rawIdeas.filter(i => i.githubUrl).length}`);
    process.exit(0);
}

seed();
