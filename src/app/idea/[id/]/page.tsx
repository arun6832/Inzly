"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { 
    ChevronLeft, Share2, BookmarkPlus, 
    Lock, Eye, ShieldCheck, Flag, MessageSquare, Sparkles 
} from "lucide-react";
import { Github } from "@/components/icons";
import { useAuth } from "@/lib/AuthContext";
import { ExecutionStatus, IdeaVersion, Problem } from "@/lib/geoUtils";
import DiscussionSection from "@/components/DiscussionSection";
import TeamManagement from "@/components/TeamManagement";
import SoftNDAModal from "@/components/SoftNDAModal";
import ReportModal from "@/components/ReportModal";
import RefineIdeaModal from "@/components/RefineIdeaModal";

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
    const { user, userMode } = useAuth();

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
    const [showRefine, setShowRefine] = useState(false);
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
        const isInvestor = userMode === 'catalyst'; 

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

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-black min-h-screen nothing-grid">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Loading Asset Details...</span>
            </div>
        );
    }

    if (error || !ideaData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-black min-h-screen nothing-grid">
                <h2 className="text-xl font-bold font-dot uppercase tracking-widest text-white italic">{error || "Asset not trackable"}</h2>
                <Button onClick={() => router.push("/")} className="bg-white text-black hover:bg-black hover:text-white border border-white rounded-none px-8 h-12 font-mono uppercase tracking-widest text-[10px] font-bold">
                    Return to Feed
                </Button>
            </div>
        );
    }

    const isOwner = user?.uid === ideaData.userId;

    return (
        <div className="flex-1 min-h-screen bg-black nothing-grid">
            <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 relative z-10">
                
                {/* ─── Superior Navigation ─── */}
                <div className="flex items-center justify-between font-mono">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-zinc-500 hover:text-white rounded-none hover:bg-white/5 -ml-4 font-bold uppercase tracking-[0.2em] text-[10px] border border-transparent hover:border-white/10 px-3 py-1 h-9"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 mr-2" />
                        Back to Stream
                    </Button>

                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleSave}
                            disabled={hasSaved}
                            className={`w-10 h-10 rounded-none bg-black border border-white/10 transition-colors ${hasSaved ? 'text-white border-white bg-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <BookmarkPlus className={`w-4 h-4 ${hasSaved ? 'fill-current' : ''}`} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Refinement link captured.");
                            }}
                            className="w-10 h-10 rounded-none bg-black border border-white/10 text-zinc-500 hover:text-white transition-colors hover:bg-white/5"
                        >
                            <Share2 className="w-4 h-4" />
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
                            className="w-10 h-10 rounded-none bg-black border border-white/10 text-zinc-400 hover:text-white transition-colors hover:bg-white/5"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setShowReport(true)}
                            className="w-10 h-10 rounded-none bg-black border border-red-950/30 text-red-500/50 hover:text-red-400 transition-colors hover:bg-red-500/5"
                        >
                            <Flag className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* ─── Refinement Hub Header ─── */}
                <div className="space-y-8 font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center px-3 py-1 rounded-none text-[9px] font-bold bg-white/5 text-zinc-400 border border-white/10 uppercase tracking-wider">
                            {ideaData.category}
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-none text-[9px] font-bold border border-white/10 bg-black text-zinc-400 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.7)] mr-2" />
                            {ideaData.executionStatus || 'Analyzing'}
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-none text-[9px] font-bold bg-black text-zinc-500 border border-white/10 uppercase tracking-wider">
                            v{ideaData.currentVersion || 1} STABLE
                        </div>
                        
                        {/* Visibility Badge */}
                        <div className="inline-flex items-center px-3 py-1 rounded-none text-[9px] font-bold border border-white/10 bg-black text-zinc-400 uppercase tracking-wider">
                            {ideaData.visibility === 'public' ? <Eye className="w-3 h-3 mr-1.5" /> : <Lock className="w-3 h-3 mr-1.5" />}
                            <span>{ideaData.visibility === 'public' ? 'Public Domain' : ideaData.visibility === 'restricted' ? 'Restricted Access' : 'Investor Verified'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl sm:text-5xl font-bold font-dot uppercase tracking-wider text-white leading-tight">
                            {ideaData.title}
                        </h1>
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => router.push(`/user/${ideaData.authorUsername}`)}
                                className="group flex items-center gap-3 font-mono text-left"
                            >
                                <div className="w-9 h-9 rounded-none bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white transition-colors">
                                    <span className="text-zinc-500 group-hover:text-white uppercase text-[10px] font-bold">
                                        {ideaData.authorUsername?.[0].toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">Architect</p>
                                    <p className="text-xs font-bold text-white group-hover:text-zinc-300 transition-colors">@{ideaData.authorUsername}</p>
                                </div>
                            </button>
                            
                            <div className="h-8 w-px bg-white/10" />
                            
                            <div className="font-mono">
                                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">Engagement</p>
                                <p className="text-xs font-bold text-white uppercase">{ideaData.views?.toLocaleString() || 0} Pulses</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── The Hybrid Layer: Problems & Standalone ─── */}
                {linkedProblem && (
                    <div className="group relative rounded-none border border-white/10 bg-black p-6 sm:p-8 space-y-4">
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                        <header className="flex items-center justify-between font-mono relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)] mr-1" />
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Parent Problem Statement</p>
                            </div>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Problem #ID-{linkedProblem.id.slice(0, 6)}</span>
                        </header>
                        <h3 className="text-lg font-bold font-dot uppercase tracking-wider text-white relative z-10">{linkedProblem.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed font-sans relative z-10">{linkedProblem.description}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 pt-4">
                    
                    {/* ─── Main Refinement Track ─── */}
                    <div className="space-y-16">
                        
                        {/* Current Execution State */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between font-mono">
                                <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Current Snapshot</h3>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">v{ideaData.currentVersion || 1} ACTIVE</span>
                            </div>
                            <div className="p-8 rounded-none bg-black border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_1px]"></div>
                                
                                {!accessGranted ? (
                                    <div className="relative z-10 flex flex-col items-center justify-center py-16 text-center space-y-6 font-mono">
                                        <div className="w-12 h-12 rounded-none bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Restricted Concept</h4>
                                            <p className="text-[10px] uppercase tracking-wide text-zinc-500 max-w-xs leading-normal">The architect has restricted access to this concept. You must request permission to view the execution plan.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                            <Button 
                                                onClick={handleRequestAccess}
                                                disabled={accessRequestStatus !== 'none' || requestingAccess}
                                                className="flex-1 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none h-11 font-mono uppercase tracking-widest text-[9px] font-bold transition-all"
                                            >
                                                {requestingAccess ? 'transmitting...' : 
                                                 accessRequestStatus === 'pending' ? 'Pending' : 
                                                 accessRequestStatus === 'rejected' ? 'Denied' : 
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
                                                className="flex-1 bg-black border border-white/10 text-white rounded-none h-11 font-mono uppercase tracking-widest text-[9px] font-bold hover:bg-white/5 transition-all"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                                                Message
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap relative z-10 font-sans font-normal">
                                        {ideaData.idea}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Evolution Timeline */}
                        <section className="space-y-8">
                            <h3 className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-[0.4em] mb-4">Evolution Timeline</h3>
                            <div className="relative pl-8 space-y-8 font-mono">
                                {/* Thin hairline vertical tree rule */}
                                <div className="absolute left-[13px] top-3 bottom-3 w-px bg-white/10"></div>
                                
                                {versions.map((v) => (
                                    <div key={v.id} className="relative group">
                                        {/* Monospace square tree node */}
                                        <div className="absolute -left-[31px] top-1.5 w-6 h-6 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-black border border-white/30 group-hover:border-white transition-colors z-10"></div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">v{v.versionNumber} snapshot</span>
                                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">
                                                    {v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString() : 'Snapshot'}
                                                </span>
                                            </div>
                                            <div className="p-4 rounded-none bg-black border border-white/5 group-hover:border-white/10 transition-colors">
                                                <h4 className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mb-1">Changelog</h4>
                                                <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">&ldquo;{v.changelog}&rdquo;</p>
                                                
                                                <div className="mt-4 pt-3 border-t border-white/5 font-sans">
                                                    <h4 className="text-white text-xs font-bold mb-1">Title: {v.titleSnapshot}</h4>
                                                    <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed">{v.descriptionSnapshot}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="relative group grayscale">
                                    <div className="absolute -left-[31px] top-1.5 w-6 h-6 flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                                    </div>
                                    <div className="p-3 bg-black border border-white/5 rounded-none flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Future Evolution Pending...</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ─── Control & Context Pane ─── */}
                    <div className="space-y-8 sticky top-20 h-fit pb-12 font-mono">
                        
                        {/* Interaction Hub */}
                        <div className="p-6 rounded-none bg-black border border-white/10 shadow-2xl space-y-6">
                            
                            {/* Execution Panel */}
                            {isOwner ? (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Architect Controls</h3>
                                        <Button 
                                            className="w-full h-12 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none font-bold uppercase tracking-widest text-[10px] transition-colors"
                                            onClick={() => setShowRefine(true)}
                                        >
                                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                                            Propose v{ (ideaData.currentVersion || 1) + 1 } (Refine)
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="w-full h-10 bg-transparent border border-white/10 text-zinc-500 rounded-none font-bold text-[9px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                                            onClick={() => alert("Execution status updating is locked in this phase.")}
                                        >
                                            Shift Status to Building
                                        </Button>
                                    </div>

                                    {/* Team Management Section */}
                                    <div className="pt-6 border-t border-white/5">
                                        <TeamManagement 
                                            ideaId={ideaId} 
                                            ideaTitle={ideaData.title} 
                                            creatorId={user.uid} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Collaboration Layer</h3>
                                    <Button 
                                        onClick={handleJoinRequest}
                                        disabled={joinStatus !== 'none' || isJoining}
                                        className={`w-full h-12 rounded-none font-bold uppercase tracking-widest text-[10px] transition-all ${
                                            joinStatus === 'approved' ? 'bg-zinc-800 text-zinc-400 border border-white/10' : 
                                            joinStatus === 'pending' ? 'bg-zinc-950 text-zinc-600 border border-white/5' : 
                                            'bg-white text-black hover:bg-black hover:text-white border border-white'
                                        }`}
                                    >
                                        {isJoining ? 'transmitting...' : 
                                         joinStatus === 'approved' ? 'Active Member' : 
                                         joinStatus === 'pending' ? 'Request Sent' : 
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
                                        className="w-full h-10 bg-black border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-widest rounded-none"
                                    >
                                        Message Architect
                                    </Button>
                                    
                                    {joinStatus === 'approved' && (
                                        <div className="p-4 bg-black border border-white/10 rounded-none font-mono">
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-red-600 animate-red-pulse rounded-full" />
                                                Status: Operational
                                            </p>
                                            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase">You have been granted architectural access. Sync with founder to begin execution.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Artifact Links */}
                            {ideaData.githubUrl && (
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Execution Artifacts</h3>
                                    <a 
                                        href={ideaData.githubUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-none bg-black border border-white/10 hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-none bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white transition-colors">
                                                <Github className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-white leading-tight uppercase tracking-wider">Base Code</p>
                                                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tight">Active Repository</p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            )}

                            {/* Sector Metadata */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Asset Intelligence</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-black border border-white/5 rounded-none text-center">
                                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Authority</p>
                                        <p className="text-[10px] font-bold text-white uppercase">{ (ideaData.views || 0) > 100 ? 'Tier 1' : 'Seed' }</p>
                                    </div>
                                    <div className="p-3 bg-black border border-white/5 rounded-none text-center">
                                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Signal</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">High</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Network Insights */}
                        <div className="p-6 rounded-none bg-black border border-white/10 font-mono">
                            <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Network Velocity</h4>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1 bg-white/5 rounded-none overflow-hidden">
                                    <div className="h-full bg-white w-[65%]"></div>
                                </div>
                                <span className="text-[8px] font-bold text-white">65% ACTIVE</span>
                            </div>
                            <p className="mt-4 text-[10px] text-zinc-500 leading-normal uppercase">This idea is currently in the top 10% of refinement velocity in the <span className="text-white font-bold">{ideaData.category}</span> sector.</p>
                        </div>
                    </div>
                </div>

                {/* ─── Global Refinement Section ─── */}
                <div id="discussion" className="pt-12 mt-16 mb-20 border-t border-white/10 relative">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <div className="text-center space-y-2 font-mono">
                            <h2 className="text-2xl sm:text-4xl font-bold font-dot uppercase tracking-wider text-white">External Validation</h2>
                            <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[9px]">Community Analysis & Stress Testing</p>
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
                
                <RefineIdeaModal 
                    isOpen={showRefine}
                    onClose={() => setShowRefine(false)}
                    ideaId={ideaId}
                    currentTitle={ideaData.title}
                    currentIdea={ideaData.idea}
                    currentStatus={ideaData.executionStatus || 'Thinking'}
                    currentGithub={ideaData.githubUrl || ''}
                    currentVersion={ideaData.currentVersion || 1}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            </div>
        </div>
    );
}
