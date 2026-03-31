// Seed v2: 10 Realistic Users, 100 Diverse Ideas (10 each)
// No GitHub links, all metrics < 100
// Run with: node scripts/seed-v2.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { firebaseConfig } from "./credentials.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedUsers = [
    { id: "u_alex", name: "Alex Rivera", email: "alex@inzly.io", country: "United States", totalLikes: 25, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_lina", name: "Lina Chen", email: "lina@inzly.io", country: "Singapore", totalLikes: 82, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_david", name: "David Muller", email: "david@inzly.io", country: "Germany", totalLikes: 54, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_sarah", name: "Sarah Jenkins", email: "sarah@inzly.io", country: "United Kingdom", totalLikes: 91, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_kenji", name: "Kenji Tanaka", email: "kenji@inzly.io", country: "Japan", totalLikes: 37, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_elena", name: "Elena Rossi", email: "elena@inzly.io", country: "Italy", totalLikes: 68, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_amara", name: "Amara Okafor", email: "amara@inzly.io", country: "Nigeria", totalLikes: 49, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_lucas", name: "Lucas Pereira", email: "lucas@inzly.io", country: "Brazil", totalLikes: 33, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_sofia", name: "Sofia Berg", email: "sofia@inzly.io", country: "Sweden", totalLikes: 76, emailVerified: true, createdAt: Timestamp.now() },
    { id: "u_rahul", name: "Rahul Sharma", email: "rahul@inzly.io", country: "India", totalLikes: 29, emailVerified: true, createdAt: Timestamp.now() }
];

const ideas = [
    // Alex Rivera - Productivity / SaaS
    { title: "TaskSync Pro", problem: "Teams lose 20% efficiency due to fragmented project tools.", idea: "A unified workspace that syncs Jira, Trello, and Notion into a single, high-speed dashboard.", category: "Productivity", userId: "u_alex" },
    { title: "FlowWriter AI", problem: "Writers suffer from 'blank page syndrome' and inconsistent tone.", idea: "An AI writing partner that adapts to your unique voice and suggests structural changes in real-time.", category: "SaaS", userId: "u_alex" },
    { title: "FocusShield", problem: "Digital distractions reduce deep-work sessions by 40%.", idea: "A browser-level firewall that intelligently blocks non-essential notifications during high-focus tasks.", category: "Productivity", userId: "u_alex" },
    { title: "MeetingMind", problem: "60% of business meetings are forgotten within 24 hours.", idea: "Real-time AI transcription that automatically creates actionable tickets in your project tool.", category: "SaaS", userId: "u_alex" },
    { title: "InBoxZero Hub", problem: "Email overwhelm is the #1 cause of workspace anxiety.", idea: "Smart triage system that separates urgent client requests from newsletters with 99% accuracy.", category: "Productivity", userId: "u_alex" },
    { title: "RemoteTeam OS", problem: "Remote cultures struggle with organic team bonding.", idea: "A virtual watercooler that initiates spontaneous 'coffee chats' based on shared interests.", category: "SaaS", userId: "u_alex" },
    { title: "AssetLibrary", problem: "Marketing teams waste hours looking for creative assets.", idea: "Visual DAM system for small teams with lightning-fast tagging and search capabilities.", category: "Productivity", userId: "u_alex" },
    { title: "FeedbackLoop", problem: "Product managers struggle with inconsistent customer feedback.", idea: "Centralized feedback portal that aggregates Discord, Slack, and Email requests into a roadmap.", category: "SaaS", userId: "u_alex" },
    { title: "SoloBiz Dashboard", problem: "Solopreneurs find bookkeeping and project tracking overwhelming.", idea: "Integrated financial and project health dashboard specifically for one-person businesses.", category: "Productivity", userId: "u_alex" },
    { title: "PromptEngine", problem: "Developers struggle to manage complex AI prompts across apps.", idea: "Version-controlled prompt management system for engineering teams building LLM apps.", category: "SaaS", userId: "u_alex" },

    // Lina Chen - Fintech / E-commerce
    { title: "Lighthouse Payments", problem: "Cross-border payment fees eat 5% of small merchant profit.", idea: "Low-fee gateway specializing in Southeast Asian e-commerce corridors.", category: "Fintech", userId: "u_lina" },
    { title: "CartRescue", problem: "70% of e-commerce carts are abandoned at checkout.", idea: "AI-driven personalized discount engine that triggers when high-intent users hesitate.", category: "E-commerce", userId: "u_lina" },
    { title: "MicroShield Insurance", problem: "Gig workers lack affordable health and equipment insurance.", idea: "Pay-as-you-go insurance policies tailored for the modern freelance economy.", category: "Fintech", userId: "u_lina" },
    { title: "Dropship Scout", problem: "New sellers struggle to find high-margin, trending products.", idea: "Real-time analytics tool that monitors global social trends for e-commerce opportunities.", category: "E-commerce", userId: "u_lina" },
    { title: "NanoCredit", problem: "Entry-level students lack credit history for basic loans.", idea: "Alternative credit scoring based on utility payments and academic performance.", category: "Fintech", userId: "u_lina" },
    { title: "Marketplace Hub", problem: "Selling across Shopee, Lazada, and TikTok is a logistics nightmare.", idea: "Unified inventory and order sync for the top Southeast Asian marketplaces.", category: "E-commerce", userId: "u_lina" },
    { title: "SecureWallet Plus", problem: "First-time crypto users are terrified of losing their keys.", idea: "Multi-party computation (MPC) wallet with family-recovery protocols built-in.", category: "Fintech", userId: "u_lina" },
    { title: "ReviewTrust", problem: "Fake reviews are ruining e-commerce trust levels.", idea: "Blockchain-verified review system for high-ticket item marketplaces.", category: "E-commerce", userId: "u_lina" },
    { title: "BudgetFlow", problem: "Young professionals find retirement planning intimidating.", idea: "Visual finance planning tool that treats retirement like a progress-bar in a game.", category: "Fintech", userId: "u_lina" },
    { title: "LocalBoutique", problem: "Small physical shops lack the tech to sell online.", idea: "QR-code-based inventory system that sets up an online store in under 10 minutes.", category: "E-commerce", userId: "u_lina" },

    // David Muller - Sustainability / Industrials
    { title: "EcoTrack", problem: "Supply chains are opaque and hide environmental costs.", idea: "Hardware sensors for factories that provide real-time carbon footprint data.", category: "Sustainability", userId: "u_david" },
    { title: "PowerGrid AI", problem: "Renewable energy storage is inefficient and costly.", idea: "Smart algorithm that manages battery cycles to maximize grid stability.", category: "Industrials", userId: "u_david" },
    { title: "CircularPaks", problem: "Single-use packaging generates 80M tons of waste annually.", idea: "Standardized, reusable shipping containers for industrial B2B logsitics.", category: "Sustainability", userId: "u_david" },
    { title: "GreenSteel AI", problem: "Steel production is responsible for 7% of global emissions.", idea: "Predictive maintenance for electric arc furnaces to reduce energy spikes.", category: "Industrials", userId: "u_david" },
    { title: "OceanClean Bot", problem: "Harbors are saturated with plastic waste.", idea: "Autonomous water drones that clean surface debris 24/7 with zero human input.", category: "Sustainability", userId: "u_david" },
    { title: "SolarOptimize", problem: "Solar farms underperform due to undetected panel dust.", idea: "Computer-vision drones that scan panels and schedule efficient cleaning routes.", category: "Industrials", userId: "u_david" },
    { title: "SoilMonitor", problem: "Industrial farming depletes soil nutrients irreversibly.", idea: "IoT sensor network that maps soil health and suggests precise nutrient inputs.", category: "Sustainability", userId: "u_david" },
    { title: "FactoryPulse", problem: "Machine vibration issues cause billion-dollar outages.", idea: "Acoustic AI that monitors factory sounds to predict failures before they happen.", category: "Industrials", userId: "u_david" },
    { title: "WaterWise", problem: "Manufacturing plants waste 40% of their processed water.", idea: "Closed-loop filtration system specifically for chemical manufacturing plants.", category: "Sustainability", userId: "u_david" },
    { title: "MobilityFleet", problem: "Commuting accounts for 20% of an industrial team's carbon.", idea: "Inter-factory employee shuttle system optimized for zero-emission buses.", category: "Industrials", userId: "u_david" },

    // Sarah Jenkins - Healthtech / Wellness
    { title: "MentaSync", problem: "Therapy is often too expensive for early-career explorers.", idea: "Community-based mental wellness platform with moderated peer-support circles.", category: "Healthtech", userId: "u_sarah" },
    { title: "VitaminGenie", problem: "People take generic supplements that don't fit their blood work.", idea: "Customized daily nutrient packets based on quarterly blood test results.", category: "Wellness", userId: "u_sarah" },
    { title: "PostOp Guide", problem: "Patients feel abandoned once they leave the hospital.", idea: "AI recovery companion that tracks symptoms and guides physical therapy.", category: "Healthtech", userId: "u_sarah" },
    { title: "BioSync Sleep", problem: "Modern screen-time is destroying natural melatonin peaks.", idea: "Adaptive ambient lighting system for bedrooms that follows your circadian rhythm.", category: "Wellness", userId: "u_sarah" },
    { title: "CareCloud", problem: "Families struggle to manage local care for aging parents.", idea: "A coordination hub for visiting nurses, grocery drops, and doctor visits.", category: "Healthtech", userId: "u_sarah" },
    { title: "CalmMind VR", problem: "Meditation is difficult for people with high-stress jobs.", idea: "Immersive VR environments designed specifically for quick 5-minute 'reset' sessions.", category: "Wellness", userId: "u_sarah" },
    { title: "DermaScan AI", problem: "Specialist wait times for skin checks exceed 6 months.", idea: "High-accuracy AI scanner for early detection of irregular moles and spots.", category: "Healthtech", userId: "u_sarah" },
    { title: "CycleSmart", problem: "Women's health apps lack integration with physical performance data.", idea: "Hormone-aligned fitness planner that adjusts intensity based on your cycle.", category: "Wellness", userId: "u_sarah" },
    { title: "NutriLens", problem: "Calorie counting is tedious and inaccurate.", idea: "Snap a photo of your plate and get a macro-nutrient breakdown instantly.", category: "Healthtech", userId: "u_sarah" },
    { title: "PostureCheck", problem: "Remote work is causing vertical health crises in the spine.", idea: "Desktop webcam AI that gently notifies you when your posture shifts poorly.", category: "Wellness", userId: "u_sarah" },

    // Kenji Tanaka - AI / Games
    { title: "NPC Forge", problem: "Game characters feel robotic and follow predictable scripts.", idea: "LLM-driven system for game devs to create believable, dynamic RPG dialogue.", category: "AI", userId: "u_kenji" },
    { title: "StreamQuest", problem: "Twitch streamers struggle to keep audiences engaged.", idea: "Interactive overlay where viewers can directly influence the game world via chat.", category: "Games", userId: "u_kenji" },
    { title: "LogicLens", problem: "Debugging production AI models is a 'black box' nightmare.", idea: "Visual debugging engine that shows exactly why an LLM chose a specific path.", category: "AI", userId: "u_kenji" },
    { title: "RetroWorld", problem: "Nostalgic gamers lack new content for legacy hardware.", idea: "A modern dev engine that outputs specifically for GameBoy and SNES formats.", category: "Games", userId: "u_kenji" },
    { title: "TranslationAI", problem: "Context-heavy languages are poorly translated by generic bots.", idea: "Specialized translation engine for artistic exports (fiction, games, film).", category: "AI", userId: "u_kenji" },
    { title: "QuickArt Studio", problem: "Indie game devs spend 80% of budget on asset creation.", idea: "AI tool that transforms rough sketches into game-ready 3D assets.", category: "Games", userId: "u_kenji" },
    { title: "NeuralNet Chess", problem: "Chess engines have become too powerful to be 'fun'.", idea: "An engine that learns your personal playstyle and plays like your ideal rival.", category: "AI", userId: "u_kenji" },
    { title: "GameMatch", problem: "Gamers struggle to find non-toxic teammates.", idea: "Behavioral-matchmaking platform that pairs players based on teamwork scores.", category: "Games", userId: "u_kenji" },
    { title: "VideoGen", problem: "Creators need personalized background loops for content.", idea: "Infinite landscape generator that follows the mood of your background music.", category: "AI", userId: "u_kenji" },
    { title: "HapticQuest", problem: "VR games lack meaningful physical feedback.", idea: "Ultra-low-latency drivers for haptic vests designed for indie developers.", category: "Games", userId: "u_kenji" },

    // Elena Rossi - Design / Social
    { title: "StyleGraph", problem: "Influencers have no easy way to tag shoppable items in video.", idea: "Automatic video-tagging tool for fashion creators using computer vision.", category: "Design", userId: "u_elena" },
    { title: "NeighboursHub", problem: "Urban residents feel disconnected from their local streets.", idea: "Hyper-local social network focused on resource sharing and safety.", category: "Social", userId: "u_elena" },
    { title: "BrandKit Cloud", problem: "Founders struggle to keep branding consistent as they hire.", idea: "Living design system that auto-updates assets across Figma and GitHub.", category: "Design", userId: "u_elena" },
    { title: "InterestCircles", problem: "Niche hobbyists are drowned out on large social platforms.", idea: "Discord-style communities but with an emphasis on permanent archives.", category: "Social", userId: "u_elena" },
    { title: "LayoutPro", problem: "UX designers waste time building repetitive wireframes.", idea: "AI engine that generates 10 unique layouts from a simple text prompt.", category: "Design", userId: "u_elena" },
    { title: "StoryHost", problem: "Family stories are lost because nobody records them.", idea: "Guided audio-recording app for elders to build a searchable family history.", category: "Social", userId: "u_elena" },
    { title: "ColorMind", problem: "Accessibility in design is often overlooked due to complexity.", idea: "Browser extension that audits your site's color contrast in real-time.", category: "Design", userId: "u_elena" },
    { title: "TrendWire", problem: "Marketers struggle to separate true trends from noise.", idea: "A curated newsroom of cultural signals for creative professionals.", category: "Social", userId: "u_elena" },
    { title: "DraftBoard", problem: "Client feedback on design is disorganized and slow.", idea: "Multiplayer design review board focused on high-fidelity feedback.", category: "Design", userId: "u_elena" },
    { title: "VibeCheck", problem: "Social media feeds are increasingly toxic for mental health.", idea: "A 'positivity-first' social engine that ranks content based on encouragement.", category: "Social", userId: "u_elena" },

    // Amara Okafor - Edtech / Payments
    { title: "StudyBridge", problem: "African students lack access to global test prep prep.", idea: "Offline-first learning platform for high-stakes examinations.", category: "Edtech", userId: "u_amara" },
    { title: "AgriPay", problem: "Farmers wait weeks for payment from middle-men.", idea: "Immediate digital payment layer for farmers based on grain receipt verification.", category: "Payments", userId: "u_amara" },
    { title: "SkillUp Africa", problem: "University graduates lack industry-ready tech skills.", idea: "Mentorship platform connecting African talent with global tech leaders.", category: "Edtech", userId: "u_amara" },
    { title: "MarketLink", problem: "Cross-border trading is hindered by currency volatility.", idea: "Stablecoin-based settlement layer for inter-African trade.", category: "Payments", userId: "u_amara" },
    { title: "TutorConnect", problem: "Parents struggle to find quality local science tutors.", idea: "A geo-tagged marketplace for verified private tutoring in STEM.", category: "Edtech", userId: "u_amara" },
    { title: "SchoolBox", problem: "Private schools struggle with inconsistent tuition collection.", idea: "Automated billing and scholarship management for small educational institutions.", category: "Payments", userId: "u_amara" },
    { title: "LearnLocal", problem: "Indigenous knowledge systems are not documented.", idea: "Preservation app for local languages and cultural practices.", category: "Edtech", userId: "u_amara" },
    { title: "WalletStream", problem: "Utility payments involve high friction and long queues.", idea: "Simplified USSD gateway for bill payments and peer transfers.", category: "Payments", userId: "u_amara" },
    { title: "EduLoan", problem: "Student loans are predatory and lack flexible terms.", idea: "Income-share agreement platform for high-demand certification programs.", category: "Edtech", userId: "u_amara" },
    { title: "MerchantMind", problem: "Informal traders lack bookkeeping tools for growth.", idea: "Voice-driven inventory and sales tracker for market stall owners.", category: "Payments", userId: "u_amara" },

    // Lucas Pereira - SaaS / Agritech
    { title: "CropGuard AI", problem: "Disease spreads thru plantations before being seen by eye.", idea: "Satellite-driven alerts for early signs of soybean leaf rust.", category: "Agritech", userId: "u_lucas" },
    { title: "LegalLogic", problem: "Small law firms have massive document processing backlogs.", idea: "Specialized AI that summarizes legal cases in seconds.", category: "SaaS", userId: "u_lucas" },
    { title: "WaterSense", problem: "Irrigation systems waste 30% of their water supply.", idea: "Soil sensors that connect to smart valves for autonomous watering.", category: "Agritech", userId: "u_lucas" },
    { title: "HRFlow", problem: "Mid-sized teams find enterprise HR tools too complex.", idea: "A simplified, 'human-first' HR tool focused on employee growth.", category: "SaaS", userId: "u_lucas" },
    { title: "CattleTrack", problem: "Ranchers struggle with inventory tracking over large areas.", idea: "GPS-ear tags with health monitoring for large-scale livestock owners.", category: "Agritech", userId: "u_lucas" },
    { title: "SubscriptionOps", problem: "B2B SaaS companies struggle with revenue leak.", idea: "Automated audit tool to find and fix failed subscription payments.", category: "SaaS", userId: "u_lucas" },
    { title: "YieldOptim", problem: "Farmers lack data on which seeds work best for their soil.", idea: "Data-sharing network where farmers anonymously compare crop outcomes.", category: "Agritech", userId: "u_lucas" },
    { title: "CompliancePro", problem: "Industry regulations change faster than teams can track.", idea: "Real-time compliance monitor that flags changes in local trade laws.", category: "SaaS", userId: "u_lucas" },
    { title: "AgroSwap", problem: "Tractor and machinery idle time is wasted potential.", idea: "Equipment sharing marketplace for seasonal agricultural needs.", category: "Agritech", userId: "u_lucas" },
    { title: "LogiRoute", problem: "Last-mile agricultural transport is unoptimized.", idea: "Regional logistics hub that routes small deliveries onto existing trucks.", category: "SaaS", userId: "u_lucas" },

    // Sofia Berg - Clean Energy / Consumer
    { title: "HeatPulse", problem: "Home heating systems are the largest source of domestic carbon.", idea: "Smart heat pump controller that optimizes based on energy prices.", category: "Clean Energy", userId: "u_sofia" },
    { title: "EcoBasket", problem: "Grocery shoppers want to buy low-footprint but lack data.", idea: "Receipt scanner that gives you a weekly 'Earth Performance' score.", category: "Consumer", userId: "u_sofia" },
    { title: "GridShare", problem: "Apartment dwellers have no access to community solar.", idea: "Virtual fractional ownership of local renewable energy grids.", category: "Clean Energy", userId: "u_sofia" },
    { title: "RepairHero", problem: "People throw away electronics because repair is a hassle.", idea: "On-demand repair network for high-end consumer appliances.", category: "Consumer", userId: "u_sofia" },
    { title: "WindWatch", problem: "Small-scale wind turbines perform poorly in urban winds.", idea: "AI-aligned vertical axis turbines designed for residential rooftops.", category: "Clean Energy", userId: "u_sofia" },
    { title: "ShareCloset", problem: "Fast fashion is destroying the environment.", idea: "A trusted peer-to-peer clothing rental subscription for urbanites.", category: "Consumer", userId: "u_sofia" },
    { title: "BioGas Home", problem: "Organic waste ends up in landfills, producing methane.", idea: "Small-scale home composter that converts food waste into cooking gas.", category: "Clean Energy", userId: "u_sofia" },
    { title: "RideSync", problem: "Commuting alone in EVs still causes massive congestion.", idea: "Verified EV-only carpooling network for corporate headquarters.", category: "Consumer", userId: "u_sofia" },
    { title: "CarbonCredits Plus", problem: "The individual carbon offset market lacks transparency.", idea: "Verified, direct-to-project offset marketplace for conscious consumers.", category: "Clean Energy", userId: "u_sofia" },
    { title: "QuietEco", problem: "Electric mowers and tools are still too loud for city nights.", idea: "Ultra-quiet, solar-charged residential maintenance tools.", category: "Consumer", userId: "u_sofia" },

    // Rahul Sharma - Edtech / Logistics
    { title: "CodeCompass", problem: "Self-taught developers get lost in the sea of online courses.", idea: "Personalized roadmap generator that adapts based on your code commits.", category: "Edtech", userId: "u_rahul" },
    { title: "RouteMaster", problem: "Truck drivers in India lose days to inefficient state borders.", idea: "Real-time documentation and bridge-weight analyzer for long-haul trucking.", category: "Logistics", userId: "u_rahul" },
    { title: "GrammarGenie", problem: "ESL professionals struggle with formal business English.", idea: "Real-time email and presentation editor for non-native speakers.", category: "Edtech", userId: "u_rahul" },
    { title: "CargoSync", problem: "Empty backhauls increase logistics carbon by 30%.", idea: "Marketplace matching empty return-trip trucks with available cargo.", category: "Logistics", userId: "u_rahul" },
    { title: "SkillStream", problem: "Blue-collar workers lack specialized technical training.", idea: "Interactive mobile video training for specialized industrial roles.", category: "Edtech", userId: "u_rahul" },
    { title: "PortPro", problem: "Port congestion delays global trade by billions of dollars.", idea: "Predictive analyzer for ship arrival and crane availability.", category: "Logistics", userId: "u_rahul" },
    { title: "VirtualLab", problem: "Rural schools lack the budget for physical science labs.", idea: "A fully immersive VR science lab for middle-school students.", category: "Edtech", userId: "u_rahul" },
    { title: "WarehouseBot", problem: "Inventory sorting is the slowest part of e-commerce logistics.", idea: "Low-cost robotic automation kits for small-scale warehouses.", category: "Logistics", userId: "u_rahul" },
    { title: "JobKit", problem: "Fresh graduates don't know how to build a modern resume.", idea: "AI tool that builds application-specific resumes and cover letters.", category: "Edtech", userId: "u_rahul" },
    { title: "ColdChain Monitor", problem: "Perishable goods are lost due to temperature spikes.", idea: "Low-cost IoT sensors that alert drivers to refrigeration failures.", category: "Logistics", userId: "u_rahul" }
];

async function seed() {
    console.log("🌱 Starting Premium Inzly v2 seed (10 Users, 100 Ideas)...\n");

    // 1. Create 10 users
    try {
        for (const user of seedUsers) {
            await setDoc(doc(db, "users", user.id), user);
            console.log(`✅ User: "${user.name}"`);
        }
    } catch (err) {
        console.error("❌ Failed to create users:", err.message);
    }

    console.log("\n🚀 Pushing 100 Realistic Ideas...");

    let successCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        const ideaData = {
            ...idea,
            createdAt: Timestamp.fromDate(new Date(startTime - (ideas.length - i) * 1200000)), // stagger over ~8 days
            likesCount: Math.floor(Math.random() * 90) + 5, // random < 100
            views: Math.floor(Math.random() * 90) + 5,      // random < 100
        };

        try {
            const docRef = await addDoc(collection(db, "ideas"), ideaData);
            successCount++;
            if (successCount % 10 === 0) {
                console.log(`  [${successCount}/100] ✅ Pushed...`);
            }
        } catch (err) {
            console.error(`  ❌ Failed to push "${idea.title}":`, err.message);
        }
    }

    console.log(`\n🎉 Seed v2 complete! ${successCount}/100 ideas pushed.`);
    process.exit(0);
}

seed();
