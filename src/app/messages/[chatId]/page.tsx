"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    collection, 
    query, 
    addDoc, 
    onSnapshot, 
    orderBy, 
    serverTimestamp,
    doc,
    getDoc,
    limit,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, User, ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}

interface Chat {
    participants: string[];
    lastMessage?: string;
    updatedAt?: Timestamp;
}

export default function ChatPage() {
    const params = useParams() as { chatId: string };
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [otherUser, setOtherUser] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [isMatchedOrCollab, setIsMatchedOrCollab] = useState<boolean | null>(null);

    const isTypingLocal = useRef(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Redirect to login if unauthenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // 1. Fetch Chat Info & Other User
    useEffect(() => {
        if (authLoading || !user || !params.chatId) return;

        const fetchChat = async () => {
            try {
                const chatRef = doc(db, "chats", params.chatId);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                    const chatData = chatSnap.data() as Chat;
                    const otherUserId = chatData.participants?.find(p => p !== user.uid);
                    
                    if (otherUserId) {
                        const userRef = doc(db, "users", otherUserId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            setOtherUser({ id: userSnap.id, ...userSnap.data() });

                            // Access check rule
                            if (otherUserId === user.uid) {
                                setIsMatchedOrCollab(true);
                            } else {
                                const { getDocs, query, collection, where } = await import("firebase/firestore");
                                
                                // 1. Check approved collaborations (Builder + Thinker)
                                const collabQ = query(
                                    collection(db, "collaborationRequests"),
                                    where("status", "==", "approved")
                                );
                                const collabSnap = await getDocs(collabQ);
                                let allowed = collabSnap.docs.some(d => {
                                    const data = d.data();
                                    return (data.requesterId === user.uid && data.creatorId === otherUserId) ||
                                           (data.requesterId === otherUserId && data.creatorId === user.uid);
                                });

                                // 2. Check approved matches (Investor + Thinker)
                                if (!allowed) {
                                    const matchQ = query(
                                        collection(db, "matches"),
                                        where("status", "==", "approved")
                                    );
                                    const matchSnap = await getDocs(matchQ);
                                    allowed = matchSnap.docs.some(d => {
                                        const data = d.data();
                                        return (data.investorId === user.uid && data.thinkerId === otherUserId) ||
                                               (data.investorId === otherUserId && data.thinkerId === user.uid);
                                    });
                                }

                                setIsMatchedOrCollab(allowed);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Chat setup failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [user, authLoading, params.chatId]);

    // 2. Subscribe to Messages
    useEffect(() => {
        if (!params.chatId) return;

        const messagesRef = collection(db, "chats", params.chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach(doc => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, [params.chatId]);

    // 3. Listen for Typing Status
    useEffect(() => {
        if (!params.chatId || !otherUser) return;
        
        const chatRef = doc(db, "chats", params.chatId);
        const unsubscribe = onSnapshot(chatRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.typing && data.typing[otherUser.id as string]) {
                    setIsOtherTyping(true);
                    setTimeout(() => {
                        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                } else {
                    setIsOtherTyping(false);
                }
            }
        });
        return () => unsubscribe();
    }, [params.chatId, otherUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!user || !params.chatId) return;

        const chatRef = doc(db, "chats", params.chatId);

        if (!isTypingLocal.current) {
            isTypingLocal.current = true;
            updateDoc(chatRef, { [`typing.${user.uid}`]: true }).catch(console.error);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            isTypingLocal.current = false;
            updateDoc(chatRef, { [`typing.${user.uid}`]: false }).catch(console.error);
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !params.chatId) return;

        const text = newMessage;
        setNewMessage("");

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        isTypingLocal.current = false;

        try {
            const messagesRef = collection(db, "chats", params.chatId, "messages");
            await addDoc(messagesRef, {
                text,
                senderId: user.uid,
                createdAt: serverTimestamp()
            });

            // Update chat meta
            const chatRef = doc(db, "chats", params.chatId);
            await updateDoc(chatRef, {
                lastMessage: text,
                updatedAt: serverTimestamp(),
                [`typing.${user.uid}`]: false
            });
        } catch (err) {
            console.error("Message send failed", err);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#050507]">
                <div className="w-6 h-6 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#050507] h-[calc(100vh-64px)] relative overflow-hidden">
            {/* Thread Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-[#0B0B0F]/80 backdrop-blur-3xl border-b border-white/[0.04] z-20">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/messages')}
                        className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white px-2 leading-none flex items-center gap-1.5 uppercase tracking-wider">
                                {(otherUser?.name as string) || "Builder"}
                                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            </h3>
                            <p className="text-[10px] text-zinc-600 font-bold px-2 uppercase tracking-widest mt-0.5">
                                Verified Network Member
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {isMatchedOrCollab === false ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#050507] p-8 text-center relative z-20 overflow-hidden font-sans">
                    <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 relative z-10 shadow-2xl">
                        <Lock className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold font-dot uppercase tracking-widest text-white mb-2 relative z-10">Secure Sector Locked</h2>
                    <p className="text-xs text-zinc-500 max-w-sm mb-6 uppercase tracking-wider leading-relaxed relative z-10 font-mono">
                        Direct communications require a mutual swiped match (Investor + Thinker) or approved project collaboration (Builder + Thinker).
                    </p>
                    <Button onClick={() => router.push("/messages")} className="bg-white text-black hover:bg-zinc-200 border border-white rounded-none px-6 h-11 font-mono uppercase tracking-widest text-[10px] font-bold relative z-10 shadow-lg">
                        Return to Inbox
                    </Button>
                </div>
            ) : (
                <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[75%] px-4 py-3 rounded-[20px] text-sm font-medium leading-relaxed ${
                                        msg.senderId === user?.uid 
                                            ? "bg-white text-black rounded-tr-none shadow-xl" 
                                            : "bg-[#121218] text-zinc-300 border border-white/[0.04] rounded-tl-none"
                                    }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                            {isOtherTyping && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-[#121218] text-zinc-300 border border-white/[0.04] rounded-[20px] rounded-tl-none px-4 py-3 flex items-center gap-1.5 h-[44px]">
                                        <motion.div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                        <motion.div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                                        <motion.div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={scrollRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 bg-[#050507] border-t border-white/[0.04]">
                        <form 
                            onSubmit={handleSendMessage}
                            className="max-w-4xl mx-auto relative flex items-center"
                        >
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={handleInputChange}
                                placeholder="Discuss project or investment..."
                                className="w-full bg-[#121218] border border-white/[0.08] rounded-2xl pl-6 pr-16 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                            />
                            <AnimatePresence>
                                {newMessage.trim() && (
                                    <motion.button 
                                        initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, rotate: -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        type="submit"
                                        className="absolute right-2 bg-indigo-500 text-white hover:bg-indigo-400 rounded-xl w-10 h-10 flex items-center justify-center transition-colors shadow-xl shadow-indigo-500/20"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </form>
                        <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-3 py-1">
                            Encrypted Industrial Communication Pipeline
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
