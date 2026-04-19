"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteUser } from "firebase/auth";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { User, MapPin, Heart, Lightbulb, ChevronRight, MessageSquare, ArrowLeft, Edit3, Trash2, X, Save, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
    const [saveError, setSaveError] = useState("");

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
                    setError("Builder not found.");
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
            });
            setProfile({ ...profile, name: editName.trim(), bio: editBio.trim() });
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

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#0B0B0F]">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-[#0B0B0F]">
                <h2 className="text-2xl font-bold text-white">{error || "Something went wrong"}</h2>
                <Button onClick={() => router.push("/")} className="bg-white text-black rounded-full px-6">Go Home</Button>
            </div>
        );
    }

    // Generate initials avatar
    const initials = profile.name
        ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
        : (profile.username?.[0] || "?").toUpperCase();

    return (
        <div className="flex-1 min-h-screen bg-[#0B0B0F] pt-24 pb-20 px-4 sm:px-6 relative">
            <div className="max-w-5xl mx-auto relative z-10">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 rounded-[32px] bg-[#121218] border border-white/[0.04] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent" />

                            {isOwnProfile && (
                                <button
                                    onClick={openEdit}
                                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20"
                                    title="Edit Profile"
                                >
                                    <Edit3 className="w-4 h-4 text-white" />
                                </button>
                            )}

                            <div className="relative z-10 text-center space-y-6 mt-4">
                                {/* Initials Avatar */}
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
                                    <span className="text-3xl font-black text-white">{initials}</span>
                                </div>

                                <div>
                                    <h1 className="text-2xl font-black text-white px-2 leading-tight">{profile.name}</h1>
                                    <p className="text-indigo-400 font-bold text-sm tracking-tight mt-1">@{profile.username}</p>
                                </div>

                                {profile.bio && (
                                    <p className="text-zinc-400 text-sm leading-relaxed px-4 italic">
                                        "{profile.bio}"
                                    </p>
                                )}

                                <div className="flex items-center justify-center gap-4 py-4 border-y border-white/5">
                                    <div className="w-px h-8 bg-white/5" />
                                    <div className="text-center">
                                        <p className="text-white font-black text-lg">{profile.totalLikes || 0}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Impact</p>
                                    </div>
                                    <div className="w-px h-8 bg-white/5" />
                                    <div className="text-center">
                                        <p className="text-indigo-400 font-black text-lg">{profile.trustScore || 100}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Trust</p>
                                    </div>
                                </div>

                                {/* Reputation Badges */}
                                <div className="flex flex-wrap justify-center gap-2 px-4">
                                    {(profile.trustScore || 100) >= 150 && (
                                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5 shadow-lg shadow-indigo-500/5">
                                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Verified Creator</span>
                                        </div>
                                    )}
                                    {ideas.length >= 5 && (
                                        <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5 shadow-lg shadow-purple-500/5">
                                            <Lightbulb className="w-3 h-3 text-purple-400" />
                                            <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Serial Sparker</span>
                                        </div>
                                    )}
                                    {(profile.reportsCount || 0) === 0 && (profile.trustScore || 100) >= 100 && (
                                        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1.5 shadow-lg shadow-green-500/5">
                                            <ShieldAlert className="w-3 h-3 text-green-400" />
                                            <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Clean Record</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-2">
                                    {profile.country && (
                                        <div className="flex items-center justify-center gap-2 text-zinc-500 font-medium text-xs">
                                            <MapPin className="w-3 h-3" />
                                            {profile.country}
                                        </div>
                                    )}
                                    {!isOwnProfile && (
                                        <Button
                                            onClick={handleMessage}
                                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-2xl h-12 font-bold flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Message Builder
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Ideas Portfolio */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Lightbulb className="w-6 h-6 text-yellow-500/60" />
                                Portfolio
                            </h2>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {ideas.length} Posted
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {ideas.length === 0 ? (
                                <div className="py-20 text-center bg-[#121218] border border-white/[0.04] rounded-[32px] space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        <Lightbulb className="w-6 h-6 text-zinc-700" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">No ideas posted to the community yet.</p>
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
                                                className="flex-1 block p-6 bg-[#121218] border border-white/[0.04] hover:border-white/10 rounded-[28px] transition-all hover:bg-white/[0.02] relative"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-2 flex-1 pr-6">
                                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-widest rounded-md">
                                                            {idea.category}
                                                        </span>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                                            {idea.title}
                                                        </h3>
                                                        <p className="text-sm text-zinc-500 line-clamp-1 italic font-medium">
                                                            "{idea.problem}"
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-6 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <Heart className="w-4 h-4 text-red-500/40" />
                                                            <span className="text-white/80 font-bold text-sm">{idea.likesCount}</span>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-white transition-all group-hover:translate-x-1" />
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
                                                    className="w-16 rounded-[28px] bg-[#121218] border border-white/[0.04] hover:border-white/10 text-zinc-600 hover:text-white transition-all self-stretch"
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
                            className="bg-[#121218] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl"
                        >
                            <button
                                onClick={() => setEditOpen(false)}
                                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-black text-white mb-6">Edit Profile</h2>

                            <div className="space-y-4">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        maxLength={50}
                                        placeholder="Your display name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bio</label>
                                    <textarea
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        maxLength={160}
                                        rows={3}
                                        placeholder="Tell the community about yourself..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                                    />
                                    <p className="text-[11px] text-zinc-600 text-right">{editBio.length}/160</p>
                                </div>

                                {saveError && (
                                    <p className="text-red-400 text-xs font-medium">{saveError}</p>
                                )}

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl h-12 font-bold flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>

                                {/* Danger Zone */}
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Danger Zone</p>
                                    <Button
                                        disabled={deleting}
                                        onClick={handleDeleteAccount}
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl"
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
        </div>
    );
}
