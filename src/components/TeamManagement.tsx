"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { User, Check, X, MessageSquare, Clock } from "lucide-react";
import { getOrCreateChat, sendMessage } from "@/lib/messaging";

interface Request {
    id: string;
    requesterId: string;
    status: 'pending' | 'approved' | 'rejected';
    message: string;
    createdAt: any;
    requesterName?: string;
    requesterUsername?: string;
}

export default function TeamManagement({ ideaId, ideaTitle, creatorId }: { ideaId: string, ideaTitle: string, creatorId: string }) {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const q = query(collection(db, "collaborationRequests"), where("ideaId", "==", ideaId));
            const snap = await getDocs(q);
            const reqs = await Promise.all(snap.docs.map(async (d) => {
                const data = d.data();
                const userDoc = await getDoc(doc(db, "users", data.requesterId));
                let requesterName = "Unknown";
                let requesterUsername = "unknown";
                if (userDoc.exists()) {
                    const userData = userDoc.data() as any;
                    requesterName = userData.name || "Unknown";
                    requesterUsername = userData.username || "unknown";
                }
                return { id: d.id, ...data, requesterName, requesterUsername } as Request;
            }));
            setRequests(reqs);
        } catch (e) {
            console.error("Failed to fetch requests", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [ideaId]);

    const handleAction = async (requestId: string, requesterId: string, action: 'approved' | 'rejected') => {
        try {
            await updateDoc(doc(db, "collaborationRequests", requestId), {
                status: action,
                updatedAt: serverTimestamp()
            });

            if (action === 'approved') {
                const chatId = await getOrCreateChat(creatorId, requesterId);
                await sendMessage(chatId, creatorId, `Welcome to the team! I've approved your request to join "${ideaTitle}". Let's build.`);
            }

            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action } : r));
        } catch (e) {
            console.error("Action failed", e);
        }
    };

    if (loading) return <div className="animate-pulse text-zinc-500 text-[10px] uppercase font-black tracking-widest">Scanning Network...</div>;

    const pending = requests.filter(r => r.status === 'pending');
    const processed = requests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Pending Operatives ({pending.length})
                </h3>
                
                {pending.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">No pending transmission</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pending.map(req => (
                            <div key={req.id} className="p-6 rounded-3xl bg-[#0a0a0c] border border-white/[0.05] hover:border-indigo-500/20 transition-all space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <User className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{req.requesterName}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">@{req.requesterUsername}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            size="icon"
                                            onClick={() => handleAction(req.id, req.requesterId, 'approved')}
                                            className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="icon"
                                            onClick={() => handleAction(req.id, req.requesterId, 'rejected')}
                                            className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                    <p className="text-xs text-zinc-400 italic leading-relaxed font-medium">&ldquo;{req.message}&rdquo;</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {processed.length > 0 && (
                <div className="space-y-4 opacity-50">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Lifecycle Archive</h3>
                    <div className="space-y-2">
                        {processed.map(req => (
                            <div key={req.id} className="px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-zinc-400">{req.requesterName}</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${req.status === 'approved' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                        {req.status}
                                    </span>
                                </div>
                                {req.status === 'approved' && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 rounded-lg text-zinc-500 hover:text-indigo-400 px-3"
                                        onClick={async () => {
                                            const chatId = await getOrCreateChat(creatorId, req.requesterId);
                                            window.location.href = `/messages/${chatId}`;
                                        }}
                                    >
                                        <MessageSquare className="w-3 h-3 mr-2" /> <span className="text-[9px] font-bold uppercase tracking-widest">Sync</span>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


