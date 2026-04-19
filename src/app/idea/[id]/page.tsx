"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, BookmarkPlus } from "lucide-react";
import { Github } from "@/components/icons";
import { useAuth } from "@/lib/AuthContext";
import { ExecutionStatus, IdeaVersion, Problem } from "@/lib/geoUtils";
import DiscussionSection from "@/components/DiscussionSection";
import TeamManagement from "@/components/TeamManagement";
import SoftNDAModal from "@/components/SoftNDAModal";
import ReportModal from "@/components/ReportModal";
import { Lock, Eye, ShieldCheck, Flag, MessageSquare } from "lucide-react";

interface Idea {
    id: string;
    title: string;
    idea: string;
    category: string;
    userId: string;
    likesCount?: number;
    views?: number;
    githubUrl?: string;
    authorUsername?: string;
    problemId?: string | null;
    executionStatus?: ExecutionStatus;
    currentVersion?: number;
    visibility?: "public" | "restricted" | "investor";
}

export default function IdeaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [ideaData, setIdeaData] = useState<Idea | null>(null);
    const [linkedProblem, setLinkedProblem] = useState<Problem | null>(null);
    const [versions, setVersions] = useState<IdeaVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [hasSaved, setHasSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinStatus, setJoinStatus] = useState<'none' | 'pending' | 'approved'>('none');

    // Trust System State
    const [accessGranted, setAccessGranted] = useState(false);
    const [ndaAccepted, setNdaAccepted] = useState(false);
    const [accessRequestStatus, setAccessRequestStatus] = useState<'none' | 'pending' | 'rejected'>('none');
    const [showNDA, setShowNDA] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [requestingAccess, setRequestingAccess] = useState(false);

    const ideaId = params.id as string;

    useEffect(() => {
        const fetchDeepData = async () => {
            try {
                const docRef = doc(db, "ideas", ideaId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // Fetch author username
                    const authorRef = doc(db, "users", data.userId);
                    const authorSnap = await getDoc(authorRef);
                    const authorUsername = authorSnap.exists() ? authorSnap.data().username : "unknown";

                    const idea = { 
                        id: docSnap.id, 
                        ...data,
                        authorUsername,
                        views: (data.views || 0) + 1
                    } as Idea;

                    setIdeaData(idea);
                    
                    // Fetch linked problem if exists
                    if (idea.problemId) {
                        const probRef = doc(db, "problems", idea.problemId);
                        const probSnap = await getDoc(probRef);
                        if (probSnap.exists()) {
                            setLinkedProblem({ id: probSnap.id, ...probSnap.data() } as Problem);
                        }
                    }

                    // Fetch versions
                    const versionsQ = query(collection(db, "ideas", ideaId, "versions"), orderBy("versionNumber", "desc"));
                    const versionsSnap = await getDocs(versionsQ);
                    setVersions(versionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as IdeaVersion)));

                    // Audit Trail: Log View
                    if (user) {
                        addDoc(collection(db, "idea_views"), {
                            userId: user.uid,
                            ideaId,
                            timestamp: serverTimestamp()
                        }).catch(e => console.error(e));
                    }

                    // Increment views
                    updateDoc(docRef, { views: increment(1) }).catch(e => console.error(e));
                } else {
                    setError("Idea not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load refinement hub.");
            } finally {
                setLoading(false);
            }
        };

        if (ideaId) {
            fetchDeepData();
        }
    }, [ideaId]);

    // Check interaction & join status
    useEffect(() => {
        if (!user || !ideaId) return;

        const checkStatus = async () => {
            const { query, collection, where, getDocs } = await import("firebase/firestore");
            try {
                const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid), where("ideaId", "==", ideaId));
                const savedSnap = await getDocs(savedQ);
                if (!savedSnap.empty) setHasSaved(true);

                const joinQ = query(collection(db, "collaborationRequests"), where("requesterId", "==", user.uid), where("ideaId", "==", ideaId));
                const joinSnap = await getDocs(joinQ);
                if (!joinSnap.empty) {
                    setJoinStatus(joinSnap.docs[0].data().status as any);
                }

                // Trust System status checks
                const ndaQ = query(collection(db, "nda_acceptance"), where("userId", "==", user.uid), where("ideaId", "==", ideaId));
                const ndaSnap = await getDocs(ndaQ);
                if (!ndaSnap.empty) setNdaAccepted(true);

                const accessQ = query(collection(db, "access_requests"), where("userId", "==", user.uid), where("ideaId", "==", ideaId));
                const accessSnap = await getDocs(accessQ);
                if (!accessSnap.empty) {
                    const status = accessSnap.docs[0].data().status;
                    setAccessRequestStatus(status);
                    if (status === 'approved') setAccessGranted(true);
                }
            } catch (e) { console.error(e); }
        };

        checkStatus();
    }, [user, ideaId]);

    // Visibility Logic
    useEffect(() => {
        if (!ideaData) return;
        
        const isOwner = user?.uid === ideaData.userId;
        const isInvestor = user && (user as any).mode === 'catalyst'; // Cast as any because AuthContext User might not have mode directly if not synced

        if (ideaData.visibility === 'public' || isOwner) {
            setAccessGranted(true);
        } else if (ideaData.visibility === 'investor' && isInvestor) {
            setAccessGranted(true);
        }
        
        // Soft NDA logic
        if (ideaData.visibility !== 'public' && !ndaAccepted && !isOwner) {
            // We only show NDA if access is already granted (approved or investor)
            const canSeeNDA = (ideaData.visibility === 'investor' && isInvestor) || accessGranted;
            if (canSeeNDA) {
                setShowNDA(true);
            }
        }
    }, [ideaData, user, ndaAccepted, accessGranted]);

    const handleAcceptNDA = async () => {
        if (!user || !ideaId) return;
        try {
            await addDoc(collection(db, "nda_acceptance"), {
                userId: user.uid,
                ideaId,
                timestamp: serverTimestamp()
            });
            setNdaAccepted(true);
            setShowNDA(false);
        } catch (e) { console.error(e); }
    };

    const handleRequestAccess = async () => {
        if (!user || !ideaId || requestingAccess) return;
        setRequestingAccess(true);
        try {
            await addDoc(collection(db, "access_requests"), {
                userId: user.uid,
                ideaId,
                status: 'pending',
                timestamp: serverTimestamp()
            });
            setAccessRequestStatus('pending');
        } catch (e) { console.error(e); } finally {
            setRequestingAccess(false);
        }
    };

    const handleReport = async (reason: string, description: string) => {
        if (!user || !ideaId) return;
        try {
            await addDoc(collection(db, "reports"), {
                reporterId: user.uid,
                reportedUserId: ideaData?.userId,
                ideaId,
                reason,
                description,
                timestamp: serverTimestamp()
            });
            alert("Security team notified. Thank you.");
        } catch (e) { console.error(e); }
    };

    const handleJoinRequest = async () => {
        if (!user || !ideaData || isJoining || joinStatus !== 'none') return;
        setIsJoining(true);
        try {
            await addDoc(collection(db, "collaborationRequests"), {
                ideaId,
                requesterId: user.uid,
                creatorId: ideaData.userId,
                status: 'pending',
                message: "I want to collaborate on this idea.",
                createdAt: serverTimestamp()
            });
            setJoinStatus('pending');
        } catch (e) {
            console.error(e);
        } finally {
            setIsJoining(false);
        }
    };

    const handleSave = async () => {
        if (!user || hasSaved || saving) return;
        setSaving(true);
        setHasSaved(true);
        try {
            await addDoc(collection(db, "savedIdeas"), {
                userId: user.uid,
                ideaId,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error(err);
            setHasSaved(false);
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status?: ExecutionStatus) => {
        switch(status) {
            case 'Thinking': return 'text-zinc-500 bg-white/5 border-white/5';
            case 'Refining': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'Building': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'Launched': return 'text-green-400 bg-green-500/10 border-green-500/20';
            default: return 'text-zinc-500 bg-white/5';
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#0B0B0F]">
                <div className="w-10 h-10 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    if (error || !ideaData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-[#050507]">
                <h2 className="text-2xl font-light text-white italic">{error || "Asset not trackable"}</h2>
                <Button onClick={() => router.push("/")} className="bg-white text-black rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-[10px]">
                    Return to Feed
                </Button>
            </div>
        );
    }

    const isOwner = user?.uid === ideaData.userId;

    return (
        <div className="flex-1 min-h-screen bg-[#050507]">
            <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
                
                {/* ─── Superior Navigation ─── */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-zinc-500 hover:text-white rounded-full hover:bg-white/5 -ml-4 font-black uppercase tracking-[0.2em] text-[10px]"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Stream
                    </Button>

                    <div className="flex items-center space-x-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleSave}
                            disabled={hasSaved}
                            className={`w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] transition-all ${hasSaved ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                        >
                            <BookmarkPlus className={`w-5 h-5 ${hasSaved ? 'fill-indigo-400' : ''}`} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Refinement link captured.");
                            }}
                            className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-zinc-500 hover:text-white transition-all hover:bg-white/10"
                        >
                            <Share2 className="w-5 h-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={async () => {
                                if (!user) { router.push('/login'); return; }
                                const { getOrCreateChat } = await import("@/lib/messaging");
                                const chatId = await getOrCreateChat(user.uid, ideaData.userId);
                                router.push(`/messages/${chatId}`);
                            }}
                            className="w-12 h-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/50 hover:text-indigo-400 transition-all hover:bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setShowReport(true)}
                            className="w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/50 hover:text-red-400 transition-all hover:bg-red-500/10"
                        >
                            <Flag className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* ─── Refinement Hub Header ─── */}
                <div className="space-y-8">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-[0.2em]">
                            {ideaData.category}
                        </div>
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-[0.2em] transition-all shadow-lg shadow-black/20 ${getStatusColor(ideaData.executionStatus)}`}>
                            <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
                            {ideaData.executionStatus || 'Analyzing'}
                        </div>
                        <div className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black bg-white/[0.02] text-zinc-500 border border-white/[0.05] uppercase tracking-[0.2em]">
                            Version v{ideaData.currentVersion || 1}
                        </div>
                        
                        {/* Visibility Badge */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-[0.2em] shadow-lg shadow-black/20 ${
                            ideaData.visibility === 'public' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                            ideaData.visibility === 'restricted' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                        }`}>
                            {ideaData.visibility === 'public' ? <Eye className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}
                            {ideaData.visibility === 'public' ? 'Public Domain' : ideaData.visibility === 'restricted' ? 'Restricted Access' : 'Investor Verified'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-light text-white tracking-tight leading-[1.05]">
                            {ideaData.title}
                        </h1>
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => router.push(`/user/${ideaData.authorUsername}`)}
                                className="group flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-all shadow-xl">
                                    <span className="text-zinc-500 group-hover:text-indigo-400 uppercase text-[10px] font-black">
                                        {ideaData.authorUsername?.[0].toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Architect</p>
                                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">@{ideaData.authorUsername}</p>
                                </div>
                            </button>
                            
                            <div className="h-8 w-px bg-white/10 mx-2" />
                            
                            <div>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Engagement</p>
                                <p className="text-sm font-bold text-white capitalize">{ideaData.views?.toLocaleString() || 0} Pulses</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── The Hybrid Layer: Problems & Standalone ─── */}
                {linkedProblem && (
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative p-8 rounded-[32px] bg-purple-500/[0.03] border border-purple-500/10 backdrop-blur-3xl space-y-4">
                            <header className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                        <span className="text-purple-400 text-xs text-center font-black leading-none uppercase">!</span>
                                    </div>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Parent Problem Statement</p>
                                </div>
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Problem #ID-{linkedProblem.id.slice(0, 6)}</span>
                            </header>
                            <h3 className="text-xl font-bold text-white tracking-tight leading-relaxed">{linkedProblem.title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed font-medium">{linkedProblem.description}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 pt-8">
                    
                    {/* ─── Main Refinement Track ─── */}
                    <div className="space-y-16">
                        
                        {/* Current Execution State */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Current Snapshot</h3>
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">v{ideaData.currentVersion || 1} ACTIVE</span>
                            </div>
                            <div className="p-8 sm:p-12 rounded-[40px] bg-[#0a0a0c] border border-white/[0.04] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                                
                                {!accessGranted ? (
                                    <div className="relative z-10 flex flex-col items-center justify-center py-20 text-center space-y-6">
                                        <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                            <Lock className="w-8 h-8 text-orange-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold text-white">Restricted Concept</h4>
                                            <p className="text-sm text-zinc-500 max-w-sm">The architect has restricted access to this concept. You must request permission to view the execution plan.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                                            <Button 
                                                onClick={handleRequestAccess}
                                                disabled={accessRequestStatus !== 'none' || requestingAccess}
                                                className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
                                            >
                                                {requestingAccess ? 'transmitting...' : 
                                                 accessRequestStatus === 'pending' ? 'Request Pending' : 
                                                 accessRequestStatus === 'rejected' ? 'Access Denied' : 
                                                 'Request Access'}
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                onClick={async () => {
                                                    if (!user) { router.push('/login'); return; }
                                                    const { getOrCreateChat } = await import("@/lib/messaging");
                                                    const chatId = await getOrCreateChat(user.uid, ideaData.userId);
                                                    router.push(`/messages/${chatId}`);
                                                }}
                                                className="flex-1 bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                                                Message
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-lg sm:text-2xl text-zinc-300 leading-relaxed sm:leading-[1.8] whitespace-pre-wrap relative z-10 font-normal tracking-tight">
                                        {ideaData.idea}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Evolution Timeline */}
                        <section className="space-y-10">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-8">Evolution Timeline</h3>
                            <div className="relative pl-12 space-y-12">
                                {/* Vertical Line */}
                                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent"></div>
                                
                                {versions.map((v, idx) => (
                                    <div key={v.id} className="relative group">
                                        {/* Timeline Node */}
                                        <div className="absolute -left-[45px] top-1.5 w-12 h-12 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border-[3px] border-zinc-600 group-hover:border-indigo-500 transition-colors z-10"></div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Version v{v.versionNumber}</span>
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    {v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString() : 'Snapshot'}
                                                </span>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] group-hover:border-white/10 transition-all">
                                                <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Changelog</h4>
                                                <p className="text-sm text-zinc-400 font-medium leading-relaxed italic">&ldquo;{v.changelog}&rdquo;</p>
                                                
                                                <div className="mt-6 pt-4 border-t border-white/[0.03]">
                                                    <h4 className="text-white text-sm font-bold mb-2">Title: {v.titleSnapshot}</h4>
                                                    <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">{v.descriptionSnapshot}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="relative group grayscale">
                                    <div className="absolute -left-[45px] top-1.5 w-12 h-12 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
                                    </div>
                                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Future Evolution Pending...</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ─── Control & Context Pane ─── */}
                    <div className="space-y-8 sticky top-24 h-fit pb-12">
                        
                        {/* Interaction Hub */}
                        <div className="p-8 rounded-[40px] bg-[#0a0a0c] border border-white/[0.04] shadow-2xl space-y-8">
                            
                            {/* Execution Panel */}
                            {isOwner ? (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Architect Controls</h3>
                                        <Button 
                                            className="w-full h-14 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                                            onClick={() => alert("Refinement Portal is expanding. vNext creation coming in next update.")}
                                        >
                                            Propose v{ (ideaData.currentVersion || 1) + 1 } (Refine)
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="w-full h-12 bg-white/[0.03] border-white/10 text-zinc-400 rounded-2xl font-bold text-xs hover:text-white"
                                            onClick={() => alert("Execution status updating is locked in this phase.")}
                                        >
                                            Shift Status to Building
                                        </Button>
                                    </div>

                                    {/* Team Management Section */}
                                    <div className="pt-8 border-t border-white/[0.04]">
                                        <TeamManagement 
                                            ideaId={ideaId} 
                                            ideaTitle={ideaData.title} 
                                            creatorId={user.uid} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Collaboration Layer</h3>
                                    <Button 
                                        onClick={handleJoinRequest}
                                        disabled={joinStatus !== 'none' || isJoining}
                                        className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl transition-transform hover:scale-[1.02] ${
                                            joinStatus === 'approved' ? 'bg-green-500 text-white' : 
                                            joinStatus === 'pending' ? 'bg-zinc-800 text-zinc-500' : 
                                            'bg-white text-black hover:bg-zinc-200'
                                        }`}
                                    >
                                        {isJoining ? 'transmitting...' : 
                                         joinStatus === 'approved' ? 'Active Member' : 
                                         joinStatus === 'pending' ? 'Request Transmitted' : 
                                         'Request to join team'}
                                    </Button>
                                    
                                    <Button 
                                        onClick={async () => {
                                            if (!user) { router.push('/login'); return; }
                                            const { getOrCreateChat } = await import("@/lib/messaging");
                                            const chatId = await getOrCreateChat(user.uid, ideaData.userId);
                                            router.push(`/messages/${chatId}`);
                                        }}
                                        variant="ghost" 
                                        className="w-full h-12 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 font-bold text-xs rounded-2xl"
                                    >
                                        Message Architect
                                    </Button>
                                    
                                    {joinStatus === 'approved' && (
                                        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
                                            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Status: Operational</p>
                                            <p className="text-xs text-zinc-500 leading-relaxed font-medium">You have been granted architectural access. Sync with the founder to begin execution.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Artifact Links */}
                            {ideaData.githubUrl && (
                                <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Execution Artifacts</h3>
                                    <a 
                                        href={ideaData.githubUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] transition-all group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.05] group-hover:border-indigo-400/30 transition-colors">
                                                <Github className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white leading-tight uppercase tracking-widest">Base Code</p>
                                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tight">Active Repository</p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            )}

                            {/* Sector Metadata */}
                            <div className="pt-4 border-t border-white/[0.04] space-y-4">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Asset Intelligence</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-center">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Authority</p>
                                        <p className="text-xs font-bold text-white">{ (ideaData.views || 0) > 100 ? 'Tier 1' : 'Seed' }</p>
                                    </div>
                                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-center">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Signal</p>
                                        <p className="text-xs font-bold text-indigo-400">High</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Network Insights */}
                        <div className="p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Network Activity</h4>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                </div>
                                <span className="text-[9px] font-black text-white">65% Active</span>
                            </div>
                            <p className="mt-4 text-[10px] text-zinc-500 font-medium leading-relaxed">This idea is currently in the top 10% of refinement velocity in the <span className="text-indigo-300 font-bold">{ideaData.category}</span> sector.</p>
                        </div>
                    </div>
                </div>

                {/* ─── Global Refinement Section ─── */}
                <div id="discussion" className="pt-16 mt-24 mb-24 border-t border-white/[0.05] relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                    <div className="max-w-3xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">External Validation</h2>
                            <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-[10px]">Community Analysis & Stress Testing</p>
                        </div>
                        <DiscussionSection ideaId={ideaId} />
                    </div>
                </div>

                {/* Trust System Modals */}
                <SoftNDAModal 
                    isOpen={showNDA} 
                    onAccept={handleAcceptNDA} 
                    ideaTitle={ideaData.title} 
                />
                <ReportModal 
                    isOpen={showReport} 
                    onClose={() => setShowReport(false)} 
                    onSubmit={handleReport} 
                    ideaTitle={ideaData.title} 
                />
            </div>
        </div>
    );
}
