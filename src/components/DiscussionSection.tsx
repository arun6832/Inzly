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

const QUESTION_CATEGORIES = [
    "Problem Clarity",
    "Solution Depth",
    "Market & Users",
    "Execution Feasibility",
    "Business Model",
    "Risks"
];

interface Comment {
    id: string;
    text: string;
    userId: string;
    createdAt: any;
}

interface Question {
    id: string;
    question: string;
    category: string;
    userId: string;
    createdAt: any;
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
                <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-[#121218] border border-white/[0.04] mb-8 rounded-full p-1.5 h-14 shadow-lg shadow-black/20">
                    <TabsTrigger value="questions" className="rounded-full text-zinc-400 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Questions ({questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-full text-zinc-400 font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Comments ({comments.length})
                    </TabsTrigger>
                </TabsList>

                {/* QUESTIONS TAB */}
                <TabsContent value="questions" className="space-y-8 animate-in fade-in-50 duration-500">
                    {user ? (
                        <div className="bg-[#121218] p-8 rounded-[32px] border border-white/[0.04] shadow-xl space-y-5">
                            <h3 className="text-xl font-bold text-white">Ask a Meaningful Question</h3>
                            <p className="text-zinc-400">Help the founder by asking questions that challenge their assumptions.</p>

                            <div className="space-y-4">
                                <Select value={questionCategory} onValueChange={(val) => setQuestionCategory(val || "")}>
                                    <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-white">
                                        <SelectValue placeholder="Select a question category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        {QUESTION_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat} className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Textarea
                                    placeholder="What is your biggest assumption regarding user acquisition?"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    className="min-h-[120px] bg-white/[0.03] border-white/5 text-white focus-visible:ring-purple-500 rounded-2xl p-4 text-base resize-none"
                                />

                                <div className="flex justify-end pt-2">
                                    <Button onClick={handlePostQuestion} disabled={!newQuestion.trim() || !questionCategory || submitting} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-full px-8 h-12 font-bold transition-all shadow-lg">
                                        {submitting ? "Posting..." : "Post Question"}
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
                        {questions.map(q => (
                            <div key={q.id} className="p-8 bg-[#121218] border border-white/[0.04] shadow-xl rounded-[32px]">
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4 inline-block">
                                    {q.category}
                                </span>
                                <p className="text-white text-lg font-medium leading-relaxed">{q.question}</p>
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">No questions yet. Be the first to ask!</div>
                        )}
                    </div>
                </TabsContent>

                {/* COMMENTS TAB */}
                <TabsContent value="comments" className="space-y-8 animate-in fade-in-50 duration-500">
                    {user ? (
                        <div className="bg-[#121218] p-8 rounded-[32px] border border-white/[0.04] shadow-xl space-y-5">
                            <h3 className="text-xl font-bold text-white">Leave a Comment</h3>

                            <div className="space-y-4">
                                <Textarea
                                    placeholder="Share your thoughts or feedback..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[120px] bg-white/[0.03] border-white/5 text-white focus-visible:ring-zinc-500 rounded-2xl p-4 text-base resize-none"
                                />

                                <div className="flex justify-end pt-2">
                                    <Button onClick={handlePostComment} disabled={!newComment.trim() || submitting} className="bg-white hover:bg-zinc-200 text-black rounded-full px-8 h-12 font-bold transition-all shadow-lg">
                                        {submitting ? "Posting..." : "Post Comment"}
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
                        {comments.map(c => (
                            <div key={c.id} className="p-8 bg-[#121218] border border-white/[0.04] shadow-xl rounded-[32px]">
                                <p className="text-zinc-300 leading-relaxed text-lg">{c.text}</p>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">No comments yet. Start the discussion!</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
