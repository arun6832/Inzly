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
    TrendingUp
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
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    
    const [myIdeas, setMyIdeas] = useState<DashboardIdea[]>([]);
    const [collaborations, setCollaborations] = useState<DashboardIdea[]>([]);
    const [requests, setRequests] = useState<InboundRequest[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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
                    // We split access requests because Firestore 'in' has limits or we can query by creatorId if we had it there
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
            <div className="flex-1 flex justify-center items-center bg-[#0B0B0F] min-h-screen">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-[#0B0B0F] pt-28 pb-20 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-indigo-400">
                            <Shield className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Architect Terminal v1.2</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">Studio.</h1>
                        <p className="text-zinc-500 font-medium italic">Manage your innovations, teams, and high-stakes access.</p>
                    </div>
                </div>

                <Tabs defaultValue="inbound" className="w-full space-y-10">
                    <TabsList className="w-full max-w-2xl bg-[#121218] border border-white/[0.04] p-1 h-14 rounded-2xl overflow-hidden shadow-2xl">
                        <TabsTrigger value="inbound" className="flex-1 h-full rounded-xl text-zinc-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                            <Clock className="w-3.5 h-3.5 mr-2" /> Inbound Hub
                        </TabsTrigger>
                        <TabsTrigger value="portfolio" className="flex-1 h-full rounded-xl text-zinc-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                            <Lightbulb className="w-3.5 h-3.5 mr-2" /> My Innovations
                        </TabsTrigger>
                        <TabsTrigger value="collabs" className="flex-1 h-full rounded-xl text-zinc-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                            <Users className="w-3.5 h-3.5 mr-2" /> Collaborations
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="flex-1 h-full rounded-xl text-zinc-500 data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] transition-all">
                            <History className="w-3.5 h-3.5 mr-2" /> Security Log
                        </TabsTrigger>
                    </TabsList>

                    {/* ─── Inbound Hub ─── */}
                    <TabsContent value="inbound" className="animate-in fade-in-50 duration-500 space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-6">Pending Transmissions</h2>
                            
                            {requests.filter(r => r.status === 'pending').length === 0 ? (
                                <div className="py-20 text-center bg-[#121218] rounded-[40px] border border-white/[0.02] space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        <TrendingUp className="w-8 h-8 text-zinc-800" />
                                    </div>
                                    <p className="text-zinc-600 font-medium tracking-widest uppercase text-[10px]">Your network is currently quiet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {requests.filter(r => r.status === 'pending').map(req => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={req.id} 
                                            className="p-8 rounded-[32px] bg-[#121218] border border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden group"
                                        >
                                            <div className="flex items-start gap-6 relative z-10">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${req.type === 'join' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                    {req.type === 'join' ? <Users className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${req.type === 'join' ? 'text-indigo-400 bg-indigo-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                                                            {req.type === 'join' ? 'Team Join' : 'Access Request'}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-zinc-600 uppercase">Target: {req.ideaTitle}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white">{req.requesterName} <span className="text-zinc-500 font-medium text-sm ml-1">@{req.requesterUsername}</span></h3>
                                                    {req.message && <p className="text-sm text-zinc-500 italic mt-2">&ldquo;{req.message}&rdquo;</p>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 relative z-10">
                                                <Button 
                                                    onClick={() => handleAction(req, 'approved')}
                                                    className="bg-white text-black hover:bg-zinc-200 h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-2" /> Approve
                                                </Button>
                                                <Button 
                                                    variant="ghost"
                                                    onClick={() => handleAction(req, 'rejected')}
                                                    className="bg-red-500/5 hover:bg-red-500/10 text-red-500 h-12 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                                >
                                                    <X className="w-3.5 h-3.5" />
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
                                    <div className="p-6 rounded-[32px] bg-[#121218] border border-white/[0.04] hover:border-indigo-500/50 transition-all cursor-pointer space-y-6 group">
                                        <div className="flex justify-between items-start">
                                            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20">
                                                {idea.category}
                                            </div>
                                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">v{idea.currentVersion || 1}</div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{idea.title}</h3>
                                            <div className={`mt-2 inline-flex items-center text-[9px] font-black uppercase tracking-widest ${
                                                idea.executionStatus === 'Launched' ? 'text-green-400' : 'text-indigo-400'
                                            }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                                                {idea.executionStatus}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-white">{idea.views || 0}</p>
                                                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tight">Pulses</p>
                                            </div>
                                            <ArrowUpRight className="w-5 h-5 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1 text-zinc-700" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ─── Collaborations ─── */}
                    <TabsContent value="collabs" className="animate-in fade-in-50 duration-500">
                        {collaborations.length === 0 ? (
                            <div className="py-20 text-center bg-[#121218] rounded-[40px] border border-white/[0.02] space-y-4">
                                <Users className="w-10 h-10 text-zinc-800 mx-auto" />
                                <p className="text-zinc-600 font-medium tracking-widest uppercase text-[10px]">No active team memberships found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {collaborations.map(idea => (
                                    <Link key={idea.id} href={`/idea/${idea.id}`}>
                                        <div className="p-8 rounded-[36px] bg-[#121218] border border-white/[0.04] hover:border-green-500/50 transition-all cursor-pointer flex items-center justify-between group">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-green-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Team Operational
                                                </p>
                                                <h3 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">{idea.title}</h3>
                                                <p className="text-xs text-zinc-500">Role: Contributor • Status: {idea.executionStatus}</p>
                                            </div>
                                            <ChevronRight className="w-6 h-6 text-zinc-800 group-hover:text-white transition-all" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ─── Security & Audit ─── */}
                    <TabsContent value="audit" className="animate-in fade-in-50 duration-500">
                        <section className="p-10 rounded-[40px] bg-[#121218] border border-white/[0.04] shadow-2xl space-y-8">
                            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-6">Traceability Engine Logs</h2>
                            
                            {auditLogs.length === 0 ? (
                                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest text-center py-10">No recent security interactions recorded.</p>
                            ) : (
                                <div className="space-y-4">
                                    {auditLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between py-4 border-b border-white/[0.03]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/5 text-indigo-400">
                                                    {log.type === 'nda' ? <Shield className="w-4 h-4 text-green-400" /> : <Eye className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{log.userName} <span className="text-zinc-600 font-medium">@{log.userUsername}</span></p>
                                                    <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-tighter">
                                                        {log.type === 'nda' ? 'Accepted Soft NDA' : 'Viewed Execution Plan'} • {log.ideaTitle}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[9px] font-black text-zinc-700 uppercase">
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
