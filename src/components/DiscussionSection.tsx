"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, HelpCircle } from "lucide-react";
import { containsSpam } from "@/lib/filter";
import QuestionItem from "./QuestionItem";
import { motion, AnimatePresence } from "framer-motion";

const QUESTION_CATEGORIES = [
    "Problem Clarity",
    "Solution Mechanics",
    "Market Dynamics",
    "Execution Feasibility",
    "Structural Risks"
];

const generateAvatarGradient = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c1 = `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
    const c2 = `hsl(${(Math.abs(hash) + 40) % 360}, 70%, 40%)`;
    return `linear-gradient(135deg, ${c1}, ${c2})`;
};

const formatTimeAgo = (timestamp: { toDate?: () => Date } | Date | string | number | null | undefined) => {
    if (!timestamp) return 'Just now';
    let date: Date;
    if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp as string | number | Date);
    }
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

interface Comment {
    id: string;
    text: string;
    userId: string;
    createdAt: { toDate?: () => Date } | Date | number;
}

interface Question {
    id: string;
    question: string;
    category: string;
    userId: string;
    createdAt: { toDate?: () => Date } | Date | number;
}

export default function DiscussionSection({ ideaId }: { ideaId: string }) {
    const { user } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);

    const [newComment, setNewComment] = useState("");
    const [newQuestion, setNewQuestion] = useState("");
    const [questionCategory, setQuestionCategory] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Real-time listener for comments
    useEffect(() => {
        const q = query(collection(db, "comments"), where("ideaId", "==", ideaId), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Comment[] = [];
            snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() } as Comment));
            setComments(fetched);
        });
        return () => unsubscribe();
    }, [ideaId]);

    // Real-time listener for questions
    useEffect(() => {
        const q = query(collection(db, "questions"), where("ideaId", "==", ideaId), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Question[] = [];
            snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() } as Question));
            setQuestions(fetched);
        });
        return () => unsubscribe();
    }, [ideaId]);

    const handlePostComment = async () => {
        if (!newComment.trim() || !user) return;
        if (containsSpam(newComment)) {
            alert("Comment blocked by spam filter.");
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, "comments"), {
                ideaId,
                userId: user.uid,
                text: newComment.trim(),
                createdAt: serverTimestamp()
            });
            setNewComment("");
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestion.trim() || !questionCategory || !user) return;
        if (containsSpam(newQuestion)) {
            alert("Question blocked by spam filter.");
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, "questions"), {
                ideaId,
                userId: user.uid,
                question: newQuestion.trim(),
                category: questionCategory,
                createdAt: serverTimestamp()
            });
            setNewQuestion("");
            setQuestionCategory("");
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="questions" className="w-full">
                <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-[#0a0a0c] border border-white/[0.04] mb-8 rounded-xl p-1.5 h-12 shadow-md">
                    <TabsTrigger value="questions" className="rounded-lg text-zinc-400 font-medium data-[state=active]:bg-white/[0.05] data-[state=active]:text-white">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Objections ({questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-lg text-zinc-400 font-medium data-[state=active]:bg-white/[0.05] data-[state=active]:text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Feedback ({comments.length})
                    </TabsTrigger>
                </TabsList>

                {/* QUESTIONS TAB */}
                <TabsContent value="questions" className="space-y-8 animate-in fade-in-50 duration-500">
                    {user ? (
                        <div className="bg-[#0a0a0c] p-6 sm:p-8 rounded-[24px] border border-white/[0.04] shadow-xl space-y-5">
                            <h3 className="text-lg font-medium text-white">Challenge the Execution</h3>
                            <p className="text-xs text-zinc-500">Provide critical friction points regarding the model.</p>

                            <div className="space-y-4">
                                <Select value={questionCategory} onValueChange={(val) => setQuestionCategory(val || "")}>
                                    <SelectTrigger className="w-full bg-white/[0.02] border-white/5 text-zinc-300 rounded-xl h-12">
                                        <SelectValue placeholder="Select a risk category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0c] border-white/5 text-white">
                                        {QUESTION_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat} className="focus:bg-white/5 focus:text-white cursor-pointer rounded-lg">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Textarea
                                    placeholder="Outline the critical blocker in this execution path..."
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    className="min-h-[120px] bg-white/[0.02] border border-white/[0.05] text-zinc-200 focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl p-4 text-sm resize-none"
                                />

                                <div className="flex justify-end pt-2">
                                    <Button onClick={handlePostQuestion} disabled={!newQuestion.trim() || !questionCategory || submitting} className="bg-white hover:bg-zinc-200 text-black rounded-lg px-8 h-10 font-bold transition-all shadow-md">
                                        {submitting ? "Submitting..." : "Submit Objection"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-[#121218] rounded-[32px] border border-white/[0.04]">
                            <p className="text-zinc-400">Log in to ask questions.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <AnimatePresence>
                        {questions.map((q, i) => (
                            <motion.div 
                                key={q.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.1, 0.5) }}
                            >
                                <QuestionItem question={q} />
                            </motion.div>
                        ))}
                        </AnimatePresence>
                        {questions.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">No questions yet. Be the first to ask!</div>
                        )}
                    </div>
                </TabsContent>

                {/* COMMENTS TAB */}
                <TabsContent value="comments" className="space-y-8 animate-in fade-in-50 duration-500">
                    {user ? (
                        <div className="bg-[#0a0a0c] p-6 sm:p-8 rounded-[24px] border border-white/[0.04] shadow-xl space-y-5">
                            <h3 className="text-lg font-medium text-white">Provide Input</h3>

                            <div className="space-y-4">
                                <Textarea
                                    placeholder="Share structured feedback on the model..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[120px] bg-white/[0.02] border border-white/[0.05] text-zinc-200 focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl p-4 text-sm resize-none"
                                />

                                <div className="flex justify-end pt-2">
                                    <Button onClick={handlePostComment} disabled={!newComment.trim() || submitting} className="bg-white hover:bg-zinc-200 text-black rounded-lg px-8 h-10 font-bold transition-all shadow-md">
                                        {submitting ? "Submitting..." : "Submit Input"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-[#121218] rounded-[32px] border border-white/[0.04]">
                            <p className="text-zinc-400">Log in to leave comments.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <AnimatePresence>
                        {comments.map((c, i) => (
                            <motion.div 
                                key={c.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.1, 0.5) }}
                            >
                                <div className="p-6 sm:p-8 bg-[#0a0a0c] border border-white/[0.04] shadow-xl rounded-[24px] hover:border-white/10 transition-colors">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-8 h-8 rounded-full shadow-inner" style={{ background: generateAvatarGradient(c.userId) }} />
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                                <span>Member {c.userId.substring(0,4)}</span>
                                                <span>•</span>
                                                <span>{formatTimeAgo(c.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed text-sm font-light">{c.text}</p>
                                </div>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                        {comments.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">No comments yet. Start the discussion!</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
