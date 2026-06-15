"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, 
    Lightbulb, 
    Users, 
    Shield, 
    History, 
    ArrowUpRight, 
    MessageSquare, 
    Check, 
    X,
    Clock,
    Lock,
    Eye,
    ChevronRight,
    TrendingUp,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getOrCreateChat, sendMessage } from "@/lib/messaging";

interface DashboardIdea {
    id: string;
    title: string;
    category: string;
    executionStatus: string;
    likesCount: number;
    views: number;
    currentVersion: number;
}

interface InboundRequest {
    id: string;
    ideaId: string;
    ideaTitle: string;
    requesterId: string;
    requesterName: string;
    requesterUsername: string;
    type: 'join' | 'access';
    status: 'pending' | 'approved' | 'rejected';
    timestamp: any;
    message?: string;
}

interface AuditLog {
    id: string;
    type: 'view' | 'nda' | 'access';
    ideaTitle: string;
    userName: string;
    userUsername: string;
    timestamp: any;
}

export default function DashboardPage() {
    const { user, userMode } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    
    const [myIdeas, setMyIdeas] = useState<DashboardIdea[]>([]);
    const [collaborations, setCollaborations] = useState<DashboardIdea[]>([]);
    const [requests, setRequests] = useState<InboundRequest[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [pendingLikesCount, setPendingLikesCount] = useState(0);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // 1. Fetch My Ideas
                const ideasQ = query(collection(db, "ideas"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
                const ideasSnap = await getDocs(ideasQ);
                const ideasList = ideasSnap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardIdea));
                setMyIdeas(ideasList);

                // 2. Fetch Inbound Requests (Join & Access)
                const myIdeaIds = ideasList.map(i => i.id);
                
                if (myIdeaIds.length > 0) {
                    const joinQ = query(collection(db, "collaborationRequests"), where("creatorId", "==", user.uid));
                    const accessQ = query(collection(db, "access_requests"), where("ideaId", "in", myIdeaIds.slice(0, 10))); 
                    
                    const [joinSnap, accessSnap] = await Promise.all([getDocs(joinQ), getDocs(accessQ)]);
                    
                    const allReqs: InboundRequest[] = [];
                    
                    // Process Joins
                    for (const d of joinSnap.docs) {
                        const data = d.data();
                        const uSnap = await getDoc(doc(db, "users", data.requesterId));
                        const iSnap = await getDoc(doc(db, "ideas", data.ideaId));
                        allReqs.push({
                            id: d.id,
                            ideaId: data.ideaId,
                            ideaTitle: iSnap.exists() ? iSnap.data().title : "Idea",
                            requesterId: data.requesterId,
                            requesterName: uSnap.exists() ? uSnap.data().name : "Unknown",
                            requesterUsername: uSnap.exists() ? uSnap.data().username : "unknown",
                            type: 'join',
                            status: data.status,
                            timestamp: data.createdAt,
                            message: data.message
                        });
                    }
                    
                    // Process Access
                    for (const d of accessSnap.docs) {
                        const data = d.data();
                        const uSnap = await getDoc(doc(db, "users", data.userId));
                        const iSnap = await getDoc(doc(db, "ideas", data.ideaId));
                        allReqs.push({
                            id: d.id,
                            ideaId: data.ideaId,
                            ideaTitle: iSnap.exists() ? iSnap.data().title : "Idea",
                            requesterId: data.userId,
                            requesterName: uSnap.exists() ? uSnap.data().name : "Unknown",
                            requesterUsername: uSnap.exists() ? uSnap.data().username : "unknown",
                            type: 'access',
                            status: data.status,
                            timestamp: data.timestamp
                        });
                    }
                    
                    setRequests(allReqs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));

                    // 3. Fetch Audit Logs (NDA signs)
                    const ndaQ = query(collection(db, "nda_acceptance"), where("ideaId", "in", myIdeaIds.slice(0, 10)));
                    const ndaSnap = await getDocs(ndaQ);
                    const logs: AuditLog[] = [];

                    for (const d of ndaSnap.docs) {
                        const data = d.data();
                        const uSnap = await getDoc(doc(db, "users", data.userId));
                        const iSnap = await getDoc(doc(db, "ideas", data.ideaId));
                        logs.push({
                            id: d.id,
                            type: 'nda',
                            ideaTitle: iSnap.exists() ? iSnap.data().title : "Idea",
                            userName: uSnap.exists() ? uSnap.data().name : "Unknown",
                            userUsername: uSnap.exists() ? uSnap.data().username : "unknown",
                            timestamp: data.timestamp
                        });
                    }
                    setAuditLogs(logs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
                }

                // 4. Fetch Collaborations (Ideas I've joined)
                const collabsQ = query(collection(db, "collaborationRequests"), where("requesterId", "==", user.uid), where("status", "==", "approved"));
                const collabsSnap = await getDocs(collabsQ);
                const collabIdeasList: DashboardIdea[] = [];
                for (const d of collabsSnap.docs) {
                    const ideaDoc = await getDoc(doc(db, "ideas", d.data().ideaId));
                    if (ideaDoc.exists()) {
                        collabIdeasList.push({ id: ideaDoc.id, ...ideaDoc.data() } as DashboardIdea);
                    }
                }
                setCollaborations(collabIdeasList);

                // 5. Fetch Investor Likes / Connections (Matches where thinkerId == user.uid)
                if (user) {
                    const matchesQ = query(
                        collection(db, "matches"), 
                        where("thinkerId", "==", user.uid),
                        where("status", "==", "pending")
                    );
                    const matchesSnap = await getDocs(matchesQ);
                    setPendingLikesCount(matchesSnap.size);
                }


            } catch (err) {
                console.error("Dashboard fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleAction = async (req: InboundRequest, action: 'approved' | 'rejected') => {
        try {
            const table = req.type === 'join' ? "collaborationRequests" : "access_requests";
            const updateData = req.type === 'join' ? { status: action, updatedAt: serverTimestamp() } : { status: action };
            
            await updateDoc(doc(db, table, req.id), updateData);

            if (action === 'approved') {
                const chatId = await getOrCreateChat(user!.uid, req.requesterId);
                const msg = req.type === 'join' 
                    ? `I've approved your request to join "${req.ideaTitle}". Welcome to the team!`
                    : `I've granted you access to view the execution plan for "${req.ideaTitle}". Let's discuss.`;
                await sendMessage(chatId, user!.uid, msg);
            }

            setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: action } : r));
        } catch (e) {
            console.error("Action failed", e);
        }
    };



    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-black min-h-screen nothing-grid">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing Console Logs...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-black pt-24 pb-20 px-4 sm:px-6 nothing-grid">
            <div className="max-w-6xl mx-auto space-y-12 relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Architect Terminal v1.2 // LIVE</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold font-dot tracking-tight text-white">Studio.</h1>
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Manage your innovations, teams, and high-stakes access.</p>
                    </div>
                </div>

                {/* Real-time Dynamic likes notice */}
                {pendingLikesCount > 0 && (
                    <Link href="/likes">
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.05)] group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-all">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <div className="text-left font-sans">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        Inbound Investor Signals
                                        <span className="bg-red-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                                            {pendingLikesCount} New
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mt-1">Investors want to connect and discuss your innovations. Click here to manage requests.</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                        </motion.div>
                    </Link>
                )}

                <Tabs defaultValue="inbound" className="w-full space-y-8">
                    {/* Stark mechanical tabs container */}
                    <TabsList className="w-full max-w-2xl bg-card border border-border p-1.5 h-14 rounded-2xl overflow-hidden shadow-2xl flex gap-1">
                        <TabsTrigger value="inbound" className="flex-1 h-full rounded-xl text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-sans font-semibold text-xs transition-colors cursor-pointer">
                            <Clock className="w-3 h-3 mr-2" /> Inbound
                            {requests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse">
                                    {requests.filter(r => r.status === 'pending').length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="portfolio" className="flex-1 h-full rounded-xl text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-sans font-semibold text-xs transition-colors cursor-pointer">
                            <Lightbulb className="w-3 h-3 mr-2" /> Innovations
                        </TabsTrigger>
                        <TabsTrigger value="collabs" className="flex-1 h-full rounded-xl text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-sans font-semibold text-xs transition-colors cursor-pointer">
                            <Users className="w-3 h-3 mr-2" /> Team
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="flex-1 h-full rounded-xl text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-sans font-semibold text-xs transition-colors cursor-pointer">
                            <History className="w-3 h-3 mr-2" /> Logs
                        </TabsTrigger>
                    </TabsList>

                    {/* ─── Inbound Hub ─── */}
                    <TabsContent value="inbound" className="animate-in fade-in-50 duration-500 space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-[0.5em] mb-6">Pending Transmissions</h2>
                            
                            {requests.filter(r => r.status === 'pending').length === 0 ? (
                                <div className="py-20 text-center bg-black rounded-none border border-white/10 space-y-4 relative">
                                    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10 z-10 relative">
                                        <TrendingUp className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-500 font-mono tracking-widest uppercase text-[9px] z-10 relative">Your network is currently quiet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {requests.filter(r => r.status === 'pending').map(req => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        key={req.id} 
                                            className="p-6 sm:p-8 rounded-2xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden group hover:border-blue-500/40 transition-colors"
                                        >
                                            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                                            <div className="flex items-start gap-6 relative z-10 font-mono">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                                                    {req.type === 'join' ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border border-white/10 bg-black text-white">
                                                            {req.type === 'join' ? 'Team Join' : 'Access Request'}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-zinc-600 uppercase">Target: {req.ideaTitle}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white">{req.requesterName} <span className="text-zinc-500 font-medium text-xs ml-1">@{req.requesterUsername}</span></h3>
                                                    {req.message && <p className="text-xs text-zinc-500 italic mt-2">&ldquo;{req.message}&rdquo;</p>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 relative z-10">
                                                <Button 
                                                    onClick={() => handleAction(req, 'approved')}
                                                    className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-500 h-10 px-5 rounded-xl font-sans font-semibold text-xs transition-colors"
                                                >
                                                    <Check className="w-3 h-3 mr-2" /> Approve
                                                </Button>
                                                <Button 
                                                    variant="ghost"
                                                    onClick={() => handleAction(req, 'rejected')}
                                                    className="bg-transparent hover:bg-red-950/20 text-red-500 border border-red-900/30 h-10 px-3 rounded-xl font-sans font-semibold text-xs"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </TabsContent>



                    {/* ─── My Innovations ─── */}
                    <TabsContent value="portfolio" className="animate-in fade-in-50 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myIdeas.map(idea => (
                                <Link key={idea.id} href={`/idea/${idea.id}`}>
                                    <div className="p-6 rounded-2xl bg-card border border-border hover:border-blue-500/40 transition-colors cursor-pointer space-y-6 group relative">
                                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                                        
                                        <div className="flex justify-between items-start z-10 relative">
                                            <div className="px-2 py-0.5 bg-white/5 text-zinc-400 text-[8px] font-bold font-mono uppercase tracking-widest rounded-none border border-white/10">
                                                {idea.category}
                                            </div>
                                            <div className="text-[8px] font-bold font-mono text-zinc-600 uppercase tracking-widest">v{idea.currentVersion || 1}</div>
                                        </div>
                                        
                                        <div className="z-10 relative">
                                            <h3 className="text-lg font-bold font-dot tracking-tight text-white group-hover:text-blue-300 transition-colors line-clamp-1">{idea.title}</h3>
                                            <div className="mt-2 inline-flex items-center text-[8px] font-bold font-mono uppercase tracking-widest text-zinc-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.7)] mr-2" />
                                                {idea.executionStatus}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/10 z-10 relative font-mono">
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-white">{idea.views || 0}</p>
                                                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tight">Pulses</p>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ─── Collaborations ─── */}
                    <TabsContent value="collabs" className="animate-in fade-in-50 duration-500">
                        {collaborations.length === 0 ? (
                            <div className="py-20 text-center bg-black rounded-none border border-white/10 space-y-4 relative">
                                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                                <Users className="w-8 h-8 text-zinc-800 mx-auto" />
                                <p className="text-zinc-600 font-mono tracking-widest uppercase text-[9px]">No active team memberships found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {collaborations.map(idea => (
                                    <Link key={idea.id} href={`/idea/${idea.id}`}>
                                        <div className="p-8 rounded-2xl bg-card border border-border hover:border-blue-500/40 transition-colors cursor-pointer flex items-center justify-between group relative">
                                            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                                            <div className="space-y-2 z-10 relative font-mono">
                                                <p className="text-[8px] font-bold text-red-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" /> Team Operational
                                                </p>
                                                <h3 className="text-xl font-bold font-dot tracking-tight text-white group-hover:text-blue-300 transition-colors">{idea.title}</h3>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Role: Contributor • Status: {idea.executionStatus}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-white transition-colors z-10 relative" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ─── Security & Audit logs ─── */}
                    <TabsContent value="audit" className="animate-in fade-in-50 duration-500">
                        {/* Styled like a raw terminal block */}
                        <section className="p-6 sm:p-10 rounded-2xl bg-card border border-border shadow-2xl space-y-6 relative overflow-hidden">
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                            <div className="flex items-center justify-between z-10 relative">
                                <h2 className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-[0.5em]">Traceability Engine Logs</h2>
                                <div className="flex items-center gap-2 text-[8px] font-mono text-zinc-600 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
                                    SYSTEM ONLINE
                                </div>
                            </div>
                            
                            {auditLogs.length === 0 ? (
                                <p className="text-zinc-700 font-mono text-[9px] uppercase tracking-widest text-center py-10 z-10 relative">No recent security interactions recorded.</p>
                            ) : (
                                <div className="space-y-2 z-10 relative font-mono text-[10px] border border-white/5 p-4 bg-zinc-950/20 max-h-[400px] overflow-y-auto hide-scrollbar">
                                    {auditLogs.map((log, idx) => (
                                        <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/[0.03] text-zinc-400 gap-1 hover:text-white transition-colors">
                                            <div className="flex items-start gap-2">
                                                <span className="text-zinc-600">[{idx.toString().padStart(3, '0')}]</span>
                                                <div>
                                                    <span className="text-white font-bold">{log.userName}</span>
                                                    <span className="text-zinc-500"> (@{log.userUsername})</span>
                                                    <span className={log.type === 'nda' ? 'text-green-500' : 'text-zinc-400'}>
                                                        {log.type === 'nda' ? ' Accepted Soft NDA' : ' Accessed Execution Plan'}
                                                    </span>
                                                    <span className="text-zinc-600"> &ldquo;{log.ideaTitle}&rdquo;</span>
                                                </div>
                                            </div>
                                            <p className="text-[8px] text-zinc-500 uppercase shrink-0">
                                                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recent'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
