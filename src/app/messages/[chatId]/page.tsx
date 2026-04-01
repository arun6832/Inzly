"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    onSnapshot, 
    orderBy, 
    serverTimestamp,
    doc,
    getDoc,
    limit,
    Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, User, ShieldCheck } from "lucide-react";
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
    const { user } = useAuth();
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [otherUser, setOtherUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Chat Info & Other User
    useEffect(() => {
        if (!user || !params.chatId) return;

        const fetchChat = async () => {
            try {
                const chatRef = doc(db, "chats", params.chatId);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                    const chatData = chatSnap.data() as Chat;
                    const otherUserId = chatData.participants.find(p => p !== user.uid);
                    
                    if (otherUserId) {
                        const userRef = doc(db, "users", otherUserId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            setOtherUser({ id: userSnap.id, ...userSnap.data() });
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
    }, [user, params.chatId]);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !params.chatId) return;

        const text = newMessage;
        setNewMessage("");

        try {
            const messagesRef = collection(db, "chats", params.chatId, "messages");
            await addDoc(messagesRef, {
                text,
                senderId: user.uid,
                createdAt: serverTimestamp()
            });

            // Update chat meta
            const { updateDoc } = await import("firebase/firestore");
            const chatRef = doc(db, "chats", params.chatId);
            await updateDoc(chatRef, {
                lastMessage: text,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Message send failed", err);
        }
    };

    if (loading) {
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
                                {otherUser?.name || "Builder"}
                                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            </h3>
                            <p className="text-[10px] text-zinc-600 font-bold px-2 uppercase tracking-widest mt-0.5">
                                Verified Network Member
                            </p>
                        </div>
                    </div>
                </div>
            </header>

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
                <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-[#050507] border-t border-white/[0.04]">
                <form 
                    onSubmit={handleSendMessage}
                    className="max-w-4xl mx-auto flex gap-3"
                >
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Discuss project or investment..."
                        className="flex-1 bg-[#121218] border border-white/[0.08] rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                    />
                    <Button 
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-white text-black hover:bg-zinc-200 rounded-2xl px-6 h-14 font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
                <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-3 py-1">
                    Encrypted Industrial Communication Pipeline
                </p>
            </div>
        </div>
    );
}
