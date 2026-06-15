"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteUser } from "firebase/auth";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Lightbulb, ChevronRight, MessageSquare, ArrowLeft, Edit3, Trash2, X, Save, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getLaymanRole, PREDEFINED_TAGS } from "@/lib/constants";

interface UserProfile {
    id: string;
    name: string;
    username: string;
    bio?: string;
    country: string;
    totalLikes: number;
    photoURL?: string;
    trustScore?: number;
    reportsCount?: number;
    contributionActivity?: number;
    mode?: "explorer" | "sparker" | "builder" | "catalyst";
    interests?: string[];
    kycStatus?: "unverified" | "pending" | "verified";
    kycApplication?: {
        linkedin: string;
        website: string;
        score: number;
        timestamp?: any;
    };
}

interface Idea {
    id: string;
    title: string;
    category: string;
    problem: string;
    likesCount: number;
    views: number;
}

export default function ProfilePage() {
    const params = useParams() as { username: string };
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editMode, setEditMode] = useState<"explorer" | "sparker" | "builder" | "catalyst">("builder");
    const [editInterests, setEditInterests] = useState<string[]>([]);
    const [saveError, setSaveError] = useState("");

    // KYC Verification Wizard States
    const [kycOpen, setKycOpen] = useState(false);
    const [kycStep, setKycStep] = useState(1);
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [kycAnswers, setKycAnswers] = useState<number[]>([-1, -1, -1]);
    const [kycSigned, setKycSigned] = useState(false);
    const [submittingKyc, setSubmittingKyc] = useState(false);
    const [kycError, setKycError] = useState("");

    const isOwnProfile = currentUser?.uid === profile?.id;

    useEffect(() => {
        const fetchProfileAndIdeas = async () => {
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", params.username.toLowerCase()));
                const snap = await getDocs(q);

                let userData: UserProfile | null = null;
                if (!snap.empty) {
                    userData = snap.docs[0].data() as UserProfile;
                    userData.id = snap.docs[0].id;
                } else {
                    // Fallback: query by document ID (for old users without username field)
                    const { getDoc, doc } = await import("firebase/firestore");
                    const docSnap = await getDoc(doc(db, "users", params.username));
                    if (docSnap.exists()) {
                        userData = docSnap.data() as UserProfile;
                        userData.id = docSnap.id;
                    }
                }

                if (!userData) {
                    setError("Profile not found.");
                    setLoading(false);
                    return;
                }

                setProfile(userData);

                const ideasRef = collection(db, "ideas");
                const ideasQ = query(
                    ideasRef,
                    where("userId", "==", userData.id),
                    orderBy("createdAt", "desc")
                );
                const ideasSnap = await getDocs(ideasQ);
                const ideasList: Idea[] = [];
                ideasSnap.forEach(document => {
                    const data = document.data();
                    ideasList.push({
                        id: document.id,
                        title: data.title,
                        category: data.category,
                        problem: data.problem,
                        likesCount: data.likesCount || 0,
                        views: data.views || 0
                    });
                });
                setIdeas(ideasList);
            } catch (err) {
                console.error("Profile fetch failed", err);
                setError("Failed to load profile details.");
            } finally {
                setLoading(false);
            }
        };

        if (params.username) fetchProfileAndIdeas();
    }, [params.username]);

    const openEdit = () => {
        setEditName(profile?.name || "");
        setEditBio(profile?.bio || "");
        setEditMode(profile?.mode || "builder");
        setEditInterests(profile?.interests || []);
        setSaveError("");
        setEditOpen(true);
    };

    const handleSave = async () => {
        if (!currentUser || !profile) return;
        if (!editName.trim()) {
            setSaveError("Name cannot be empty.");
            return;
        }
        setSaving(true);
        setSaveError("");
        try {
            await updateDoc(doc(db, "users", profile.id), {
                name: editName.trim(),
                bio: editBio.trim(),
                mode: editMode,
                interests: editInterests,
            });
            setProfile({ ...profile, name: editName.trim(), bio: editBio.trim(), mode: editMode, interests: editInterests });
            setEditOpen(false);
        } catch (err) {
            console.error("Save failed", err);
            setSaveError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleMessage = async () => {
        if (!currentUser) { router.push('/login'); return; }
        if (currentUser.uid === profile?.id) return;
        const { getOrCreateChat } = await import("@/lib/messaging");
        const chatId = await getOrCreateChat(currentUser.uid, profile!.id);
        router.push(`/messages/${chatId}`);
    };

    const handleDeleteAccount = async () => {
        if (!currentUser || !profile) return;
        const confirmDelete = confirm("Are you sure you want to permanently delete your account and all your ideas? This cannot be undone.");
        if (!confirmDelete) return;
        const confirmTwice = confirm("Final warning: This will wipe your account completely. Your email and username can be reused after deletion. Proceed?");
        if (!confirmTwice) return;

        setDeleting(true);
        try {
            for (const idea of ideas) {
                await deleteDoc(doc(db, "ideas", idea.id));
            }
            await deleteDoc(doc(db, "users", profile.id));
            await deleteUser(currentUser);
            router.push("/");
        } catch (err: any) {
            console.error("Deletion failed", err);
            if (err.code === "auth/requires-recent-login") {
                alert("For security, please log out and log back in before deleting your account.");
            } else {
                alert("Failed to delete account. Please try again.");
            }
        } finally {
            setDeleting(false);
        }
    };

    // Custom KYC Question database mapped by target Role
    const KYC_QUESTIONS = {
        builder: [
            {
                q: "Which of the following describes the purpose of garbage collection in managed runtimes?",
                o: ["Dynamic heap allocation cleanup", "High-speed stack trace execution", "Static type compilation"],
                a: 0
            },
            {
                q: "Which protocol is best suited for real-time bi-directional low-latency chat sessions?",
                o: ["HTTP/1.1 Long Polling", "WebSockets (TCP duplex tunnel)", "SMTP payloads"],
                a: 1
            },
            {
                q: "In relational databases, which keyword is utilized to maintain data isolation during concurrent transactions?",
                o: ["INDEX optimization", "FOREIGN KEY relations", "ACID Transactions / Lock"],
                a: 2
            }
        ],
        sparker: [
            {
                q: "What is the primary objective of building a Minimum Viable Product (MVP)?",
                o: ["Launching a feature-complete product", "Testing assumptions and gathering user validation", "Hiring executive team leads"],
                a: 1
            },
            {
                q: "Which term describes the process of systematically shifting a product direction without losing sight of the core vision?",
                o: ["Scaling", "Pivoting", "Liquidation"],
                a: 1
            },
            {
                q: "In canvas modeling, which segment maps the distinct groups of people a business aims to serve?",
                o: ["Value Propositions", "Customer Segments", "Key Partnerships"],
                a: 1
            }
        ],
        catalyst: [
            {
                q: "What does the term 'Dry Powder' refer to in private equity and venture capital?",
                o: ["Uninvested capital reserves ready for deployment", "High-velocity burn rate indicators", "Pre-seed convertible loan clauses"],
                a: 0
            },
            {
                q: "Which financial instrument grants investors the right to convert debt into equity at a future valuation event?",
                o: ["Common stock option", "SAFE (Simple Agreement for Future Equity)", "High-yield municipal bond"],
                a: 1
            },
            {
                q: "What is a 'Cap Table' used for in early-stage startups?",
                o: ["Tracking office equipment capitalization", "Auditing equity ownership distribution among stakeholders", "Projecting global currency exchange conversions"],
                a: 1
            }
        ],
        explorer: [
            {
                q: "What is the purpose of curation and discovery indexing in product hubs?",
                o: ["Restricting user access permissions", "High-signal catalog searchability", "Archiving database seeds"],
                a: 1
            },
            {
                q: "Which design element is most critical for accessible reading contrast ratios?",
                o: ["Dynamic drop shadows", "WCAG compliant text-to-background contrast", "Heavy parallax animations"],
                a: 1
            },
            {
                q: "What does SEO stand for in web visibility optimizations?",
                o: ["Structured Ecosystem Operations", "Search Engine Optimization", "Secure Encryption Overlay"],
                a: 1
            }
        ]
    };

    const handleKycSubmission = async () => {
        if (!currentUser || !profile) return;
        setSubmittingKyc(true);
        setKycError("");

        // Basic validations
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
        if (!urlRegex.test(linkedinUrl)) {
            setKycError("Please enter a valid LinkedIn URL.");
            setSubmittingKyc(false);
            return;
        }
        if (websiteUrl && !urlRegex.test(websiteUrl)) {
            setKycError("Please enter a valid Portfolio or Website URL.");
            setSubmittingKyc(false);
            return;
        }

        const roleKey = profile.mode || "builder";
        const questions = KYC_QUESTIONS[roleKey as keyof typeof KYC_QUESTIONS] || KYC_QUESTIONS.builder;
        
        // Calculate score
        let score = 0;
        questions.forEach((q, idx) => {
            if (kycAnswers[idx] === q.a) {
                score++;
            }
        });

        if (score < 2) {
            setKycError("Sector challenge not passed. Review your answers and try again (min 2/3 required).");
            setSubmittingKyc(false);
            return;
        }

        try {
            const userDocRef = doc(db, "users", profile.id);
            await updateDoc(userDocRef, {
                kycStatus: "pending",
                kycApplication: {
                    linkedin: linkedinUrl,
                    website: websiteUrl || "None",
                    score,
                    role: roleKey,
                    timestamp: new Date()
                }
            });

            // Update local state
            setProfile(prev => prev ? { 
                ...prev, 
                kycStatus: "pending",
                kycApplication: {
                    linkedin: linkedinUrl,
                    website: websiteUrl || "None",
                    score
                }
            } : null);

            // Reset wizard states
            setKycOpen(false);
            setKycStep(1);
            setKycAnswers([-1, -1, -1]);
            setKycSigned(false);
            alert("Verification application submitted successfully! Our administrators are reviewing it.");
        } catch (e: any) {
            setKycError(e.message || "Failed to submit verification request. Network transmission failed.");
        } finally {
            setSubmittingKyc(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-background">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-background">
                <h2 className="text-2xl font-bold text-foreground">{error || "Something went wrong"}</h2>
                <Button onClick={() => router.push("/")} className="bg-primary text-primary-foreground rounded-full px-6">Go Home</Button>
            </div>
        );
    }

    // Generate initials avatar
    const initials = profile.name
        ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
        : (profile.username?.[0] || "?").toUpperCase();

    return (
        <div className="flex-1 min-h-screen bg-background pt-24 pb-20 px-4 sm:px-6 relative nothing-grid">
            <div className="max-w-5xl mx-auto relative z-10">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors group font-semibold"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent" />

                            {isOwnProfile && (
                                <button
                                    onClick={openEdit}
                                    className="absolute top-4 right-4 p-2 bg-muted hover:bg-accent rounded-full transition-colors z-20 border border-border"
                                    title="Edit Profile"
                                >
                                    <Edit3 className="w-4 h-4 text-foreground" />
                                </button>
                            )}

                            <div className="relative z-10 text-center space-y-6 mt-4">
                                {/* Initials Avatar */}
                                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center mx-auto shadow-xl">
                                    <span className="text-3xl font-black text-foreground">{initials}</span>
                                </div>

                                <div>
                                    <h1 className="text-2xl font-black text-foreground px-2 leading-tight flex items-center justify-center gap-1.5">
                                        {profile.name}
                                        {profile.kycStatus === "verified" && (
                                            <span 
                                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/35 text-indigo-500 dark:text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                                                title="KYC Verified Innovator"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-[3.5]" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                        )}
                                    </h1>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <p className="text-muted-foreground font-bold text-sm tracking-tight">@{profile.username}</p>
                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            (profile.mode || 'builder') === 'explorer' ? 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5' :
                                            (profile.mode || 'builder') === 'sparker' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-500/20 bg-yellow-500/5' :
                                            (profile.mode || 'builder') === 'builder' ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/5' :
                                            'text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/5'
                                        }`}>
                                            {getLaymanRole(profile.mode || 'builder')}
                                        </div>
                                    </div>
                                </div>

                                {profile.bio && (
                                    <p className="text-muted-foreground text-sm leading-relaxed px-4 italic">
                                        &ldquo;{profile.bio}&rdquo;
                                    </p>
                                )}

                                <div className="flex items-center justify-center gap-4 py-4 border-y border-border">
                                    <div className="w-px h-8 bg-border" />
                                    <div className="text-center">
                                        <p className="text-foreground font-black text-lg">{profile.totalLikes || 0}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Impact</p>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div className="text-center">
                                        <p className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{profile.trustScore || 100}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Trust</p>
                                    </div>
                                </div>

                                {/* Reputation Badges */}
                                <div className="flex flex-wrap justify-center gap-2 px-4">
                                    {profile.kycStatus === "verified" && (
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 shadow-lg shadow-emerald-500/5">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                                            <span className="text-[8px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Verified Node</span>
                                        </div>
                                    )}
                                    {(profile.trustScore || 100) >= 150 && (
                                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5 shadow-lg shadow-indigo-500/5">
                                            <ShieldCheck className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                                            <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Verified Creator</span>
                                        </div>
                                    )}
                                    {ideas.length >= 5 && (
                                        <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5 shadow-lg shadow-purple-500/5">
                                            <Lightbulb className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                            <span className="text-[8px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest">Serial Sparker</span>
                                        </div>
                                    )}
                                    {(profile.reportsCount || 0) === 0 && (profile.trustScore || 100) >= 100 && (
                                        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1.5 shadow-lg shadow-green-500/5">
                                            <ShieldAlert className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Clean Record</span>
                                        </div>
                                    )}
                                </div>

                                {/* Sector Interests tags */}
                                {profile.interests && profile.interests.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1.5 px-4 pt-2">
                                        {profile.interests.map(interest => (
                                            <span key={interest} className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
                                                #{interest}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    {profile.country && (
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium text-xs">
                                            <MapPin className="w-3 h-3" />
                                            {profile.country}
                                        </div>
                                    )}
                                    {/* KYC Gateway Card for profile owners */}
                                    {isOwnProfile && profile.kycStatus !== "verified" && (
                                        <div className="p-4 bg-muted/40 border border-border/60 rounded-xl text-center space-y-3 font-sans relative overflow-hidden mt-2">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                                            {profile.kycStatus === "pending" ? (
                                                <div className="space-y-2 relative z-10">
                                                    <div className="flex items-center justify-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-mono text-[9px] font-bold uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                                        Verification in Review
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                        Administrators are currently reviewing your sector challenge and professional credentials. Expected time: under 24 hours.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 relative z-10">
                                                    <div className="text-[9px] text-muted-foreground font-mono font-bold uppercase tracking-widest">
                                                        🛡️ Profile Trust Verification
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                        Verify your node credentials to boost your Trust Score, unlock structural reputation badges, and secure direct collaboration request lines.
                                                    </p>
                                                    <Button
                                                        onClick={() => {
                                                            setKycStep(1);
                                                            setKycAnswers([-1, -1, -1]);
                                                            setLinkedinUrl("");
                                                            setWebsiteUrl("");
                                                            setKycSigned(false);
                                                            setKycError("");
                                                            setKycOpen(true);
                                                        }}
                                                        className="w-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-mono text-[9px] font-bold uppercase tracking-widest py-1.5 h-8 rounded-lg cursor-pointer transition-all"
                                                    >
                                                        Get Verified
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isOwnProfile && (
                                        <Button
                                            onClick={handleMessage}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl h-12 font-bold flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Message {getLaymanRole(profile.mode || 'builder')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Ideas Portfolio */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between border-b border-border pb-6">
                            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                                <Lightbulb className="w-6 h-6 text-yellow-500/60" />
                                Portfolio
                            </h2>
                            <span className="px-3 py-1 bg-muted border border-border rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {ideas.length} Posted
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {ideas.length === 0 ? (
                                <div className="py-20 text-center bg-card border border-border rounded-2xl space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto border border-border">
                                        <Lightbulb className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No ideas posted to the community yet.</p>
                                </div>
                            ) : (
                                ideas.map((idea, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idea.id}
                                    >
                                        <div className="flex gap-4 items-stretch group">
                                            <Link
                                                href={`/idea/${idea.id}`}
                                                className="flex-1 block p-6 bg-card border border-border hover:border-indigo-500/30 rounded-2xl transition-all hover:bg-muted/40 relative shadow-sm"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-2 flex-1 pr-6">
                                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-widest rounded-md border border-indigo-500/20">
                                                            {idea.category}
                                                        </span>
                                                        <h3 className="text-xl font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {idea.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-1 italic font-medium">
                                                            &ldquo;{idea.problem}&rdquo;
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-6 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <Heart className="w-4 h-4 text-red-500/40" />
                                                            <span className="text-foreground/80 font-bold text-sm">{idea.likesCount}</span>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-1" />
                                                    </div>
                                                </div>
                                            </Link>
                                            {!isOwnProfile && (
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleMessage();
                                                    }}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-16 rounded-2xl bg-card border border-border hover:border-indigo-500/30 text-muted-foreground hover:text-foreground transition-all self-stretch"
                                                    title="Message Architect"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {editOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-8 max-w-2xl w-full relative shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <button
                                onClick={() => setEditOpen(false)}
                                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-black text-foreground mb-6">Edit Profile</h2>

                            <div className="space-y-6">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        maxLength={50}
                                        placeholder="Your display name"
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Bio</label>
                                    <textarea
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        maxLength={160}
                                        rows={3}
                                        placeholder="Tell the community about yourself..."
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    />
                                    <p className="text-[11px] text-muted-foreground text-right">{editBio.length}/160</p>
                                </div>

                                {/* Mode Select 2x2 Rich Card Grid */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Platform Role</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Explorer/Viewer Card */}
                                        <button
                                            type="button"
                                            onClick={() => setEditMode("explorer")}
                                            className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-full group/card ${
                                                editMode === 'explorer' 
                                                ? 'bg-zinc-500/5 border-zinc-500 text-foreground shadow-[0_0_20px_rgba(120,120,120,0.15)] ring-1 ring-zinc-500/30' 
                                                : 'bg-muted/50 border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${editMode === 'explorer' ? 'text-zinc-500' : 'text-muted-foreground'}`}>Viewer</span>
                                                    <span className={`w-2 h-2 rounded-full ${editMode === 'explorer' ? 'bg-zinc-500 animate-pulse' : 'bg-transparent'}`} />
                                                </div>
                                                <p className="text-[11px] leading-relaxed font-sans font-medium text-muted-foreground group-hover/card:text-foreground/80 transition-colors">
                                                    Silent tracking, learning, and analyzing stream flow. Hides creation features to maintain quiet discovery.
                                                </p>
                                            </div>
                                        </button>

                                        {/* Sparker/Thinker Card */}
                                        <button
                                            type="button"
                                            onClick={() => setEditMode("sparker")}
                                            className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-full group/card ${
                                                editMode === 'sparker' 
                                                ? 'bg-yellow-500/5 border-yellow-500 text-foreground shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30' 
                                                : 'bg-muted/50 border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${editMode === 'sparker' ? 'text-yellow-600 dark:text-yellow-400 font-bold' : 'text-muted-foreground'}`}>Thinker</span>
                                                    <span className={`w-2 h-2 rounded-full ${editMode === 'sparker' ? 'bg-yellow-500 animate-pulse' : 'bg-transparent'}`} />
                                                </div>
                                                <p className="text-[11px] leading-relaxed font-sans font-medium text-muted-foreground group-hover/card:text-foreground/80 transition-colors">
                                                    Conceptual seeds and high-level ideation. Write problem statements and receive bidirectional matches.
                                                </p>
                                            </div>
                                        </button>

                                        {/* Builder Card */}
                                        <button
                                            type="button"
                                            onClick={() => setEditMode("builder")}
                                            className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-full group/card ${
                                                editMode === 'builder' 
                                                ? 'bg-indigo-500/5 border-indigo-500 text-foreground shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' 
                                                : 'bg-muted/50 border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${editMode === 'builder' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-muted-foreground'}`}>Builder</span>
                                                    <span className={`w-2 h-2 rounded-full ${editMode === 'builder' ? 'bg-indigo-500 animate-pulse' : 'bg-transparent'}`} />
                                                </div>
                                                <p className="text-[11px] leading-relaxed font-sans font-medium text-muted-foreground group-hover/card:text-foreground/80 transition-colors">
                                                    Project architecture, repository links, and team orchestration. Join teams and lead development.
                                                </p>
                                            </div>
                                        </button>

                                        {/* Catalyst/Investor Card */}
                                        <button
                                            type="button"
                                            onClick={() => setEditMode("catalyst")}
                                            className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-full group/card ${
                                                editMode === 'catalyst' 
                                                ? 'bg-purple-500/5 border-purple-500 text-foreground shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30' 
                                                : 'bg-muted/50 border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${editMode === 'catalyst' ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-muted-foreground'}`}>Investor</span>
                                                    <span className={`w-2 h-2 rounded-full ${editMode === 'catalyst' ? 'bg-purple-500 animate-pulse' : 'bg-transparent'}`} />
                                                </div>
                                                <p className="text-[11px] leading-relaxed font-sans font-medium text-muted-foreground group-hover/card:text-foreground/80 transition-colors">
                                                    Track emerging sectors, request matches instantly, and discover restricted high-signal concepts.
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {editMode === 'catalyst' && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block">
                                            Investment Interests
                                        </label>
                                        <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto p-2 bg-muted border border-border rounded-xl custom-scrollbar">
                                            {PREDEFINED_TAGS.map(tag => {
                                                const isSelected = editInterests.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            setEditInterests(prev => 
                                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                                            );
                                                        }}
                                                        className={`px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase transition-all border ${
                                                            isSelected 
                                                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                                                            : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30'
                                                        }`}
                                                    >
                                                        #{tag}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {saveError && (
                                    <p className="text-red-400 text-xs font-medium">{saveError}</p>
                                )}

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl h-12 font-bold flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>

                                {/* Danger Zone */}
                                <div className="pt-4 border-t border-border space-y-3">
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Danger Zone</p>
                                    <Button
                                        disabled={deleting}
                                        onClick={handleDeleteAccount}
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl h-11"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {deleting ? "Deleting..." : "Delete Account"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KYC VERIFICATION WIZARD MODAL (Inzly v1.3.0) */}
            <AnimatePresence>
                {kycOpen && profile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-card w-full max-w-lg border border-border shadow-2xl rounded-2xl relative overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            {/* Glow */}
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border/60 pb-4 relative z-10">
                                <div>
                                    <h3 className="text-base font-black font-dot uppercase tracking-wider text-foreground">
                                        Ecosystem Verification Gate
                                    </h3>
                                    <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
                                        Step {kycStep} of 3: {kycStep === 1 ? "Professional Proof" : kycStep === 2 ? "Sector Expert Challenge" : "Community Charter"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setKycOpen(false)}
                                    className="p-1 bg-muted hover:bg-accent rounded-full transition-colors border border-border cursor-pointer"
                                >
                                    <X className="w-4 h-4 text-foreground" />
                                </button>
                            </div>

                            {/* KYC Step Forms */}
                            <div className="relative z-10 py-1">
                                {kycError && (
                                    <p className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-wider rounded-xl mb-4">
                                        {kycError}
                                    </p>
                                )}

                                {/* Step 1: Professional Links */}
                                {kycStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-muted-foreground font-mono font-bold text-[9px] uppercase tracking-widest block ml-1">
                                                LinkedIn Profile URL *
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://linkedin.com/in/username"
                                                value={linkedinUrl}
                                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                                className="w-full h-11 px-3.5 bg-muted border border-border text-foreground rounded-xl focus:ring-1 focus:ring-indigo-500 font-sans text-xs placeholder:text-muted-foreground/60 focus:outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-muted-foreground font-mono font-bold text-[9px] uppercase tracking-widest block ml-1">
                                                Portfolio / Website / GitHub URL
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://github.com/username or yourwebsite.com"
                                                value={websiteUrl}
                                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                                className="w-full h-11 px-3.5 bg-muted border border-border text-foreground rounded-xl focus:ring-1 focus:ring-indigo-500 font-sans text-xs placeholder:text-muted-foreground/60 focus:outline-none"
                                            />
                                        </div>

                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                            Verification requires active professional credentials. Your links will be reviewed manually by admins to verify your identity.
                                        </p>
                                    </div>
                                )}

                                {/* Step 2: Role-based Sector Challenge */}
                                {kycStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl font-mono text-[9px] uppercase tracking-wider text-indigo-400">
                                            Challenge Mode: Sector expert challenge for a {getLaymanRole(profile.mode || "builder")}
                                        </div>

                                        {(() => {
                                            const roleKey = profile.mode || "builder";
                                            const questions = KYC_QUESTIONS[roleKey as keyof typeof KYC_QUESTIONS] || KYC_QUESTIONS.builder;
                                            return questions.map((q, qIdx) => (
                                                <div key={qIdx} className="space-y-2 border-b border-border/20 pb-4 last:border-0 last:pb-0">
                                                    <span className="text-[10px] font-black text-foreground block">
                                                        Q{qIdx + 1}: {q.q}
                                                    </span>
                                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                                        {q.o.map((option, oIdx) => {
                                                            const isSelected = kycAnswers[qIdx] === oIdx;
                                                            return (
                                                                <button
                                                                    key={oIdx}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setKycAnswers(prev => {
                                                                            const updated = [...prev];
                                                                            updated[qIdx] = oIdx;
                                                                            return updated;
                                                                        });
                                                                    }}
                                                                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-[10px] transition-all font-medium flex items-center justify-between cursor-pointer ${
                                                                        isSelected 
                                                                        ? "bg-indigo-500/10 border-indigo-500 text-foreground"
                                                                        : "bg-muted border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                                                                    }`}
                                                                >
                                                                    <span>{option}</span>
                                                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                )}

                                {/* Step 3: Platform NDA and Charter signing */}
                                {kycStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted border border-border rounded-xl space-y-3 font-mono text-[9px] text-muted-foreground leading-relaxed uppercase tracking-wider overflow-y-auto max-h-[140px] custom-scrollbar">
                                            <p className="font-bold text-foreground">Inzly Ecosystem Charter Agreements:</p>
                                            <p>1. Anti-Spam Code of Conduct: Any user distributing automated promotional spam or malicious outbound links will face immediate account liquidation.</p>
                                            <p>2. Intellectual Property NDA: All ideas shared within maturation threads are subject to automatic NDAs unless designated as public open-source nodes.</p>
                                            <p>3. Information Authenticity: You swear that all supplied professional links and identities are genuine and represent your real professional self.</p>
                                        </div>

                                        <label className="flex items-start gap-2.5 p-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={kycSigned}
                                                onChange={(e) => setKycSigned(e.target.checked)}
                                                className="mt-0.5 rounded border-border text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-muted-foreground select-none">
                                                I accept the Platform Charter & NDA conditions.
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Wizard Footer Controls */}
                            <div className="flex items-center justify-between border-t border-border/60 pt-4 relative z-10">
                                {kycStep > 1 ? (
                                    <Button
                                        onClick={() => setKycStep(prev => prev - 1)}
                                        className="bg-card hover:bg-muted text-foreground border border-border font-mono text-[9px] font-bold uppercase tracking-widest px-4 h-9 rounded-xl cursor-pointer"
                                    >
                                        Back
                                    </Button>
                                ) : (
                                    <div />
                                )}

                                {kycStep < 3 ? (
                                    <Button
                                        onClick={() => {
                                            if (kycStep === 1 && !linkedinUrl) {
                                                setKycError("Please enter your LinkedIn Profile URL.");
                                                return;
                                            }
                                            if (kycStep === 2 && kycAnswers.includes(-1)) {
                                                setKycError("Please complete all Sector MCQ challenge questions.");
                                                return;
                                            }
                                            setKycError("");
                                            setKycStep(prev => prev + 1);
                                        }}
                                        className="bg-primary text-primary-foreground hover:bg-primary/95 font-mono text-[9px] font-bold uppercase tracking-widest px-4 h-9 rounded-xl cursor-pointer"
                                    >
                                        Continue
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleKycSubmission}
                                        disabled={submittingKyc || !kycSigned}
                                        className="bg-green-600 hover:bg-green-700 text-white font-mono text-[9px] font-bold uppercase tracking-widest px-4 h-9 rounded-xl cursor-pointer disabled:opacity-50"
                                    >
                                        {submittingKyc ? "Submitting..." : "Submit Application"}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

