"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Image as ImageIcon, X, ThumbsUp } from "lucide-react";
import { containsSpam } from "@/lib/filter";
import { v4 as uuidv4 } from 'uuid'; // Standard practice for unique file names
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, increment } from "firebase/firestore";

interface Answer {
    id: string;
    questionId: string;
    userId: string;
    text: string;
    imageUrl?: string;
    createdAt: { toDate?: () => Date } | Date | number;
    upvotes?: number;
}

interface Question {
    id: string;
    question: string;
    category: string;
    userId: string;
    createdAt: { toDate?: () => Date } | Date | number;
    upvotes?: number;
}

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

export default function QuestionItem({ question }: { question: Question }) {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isReplying, setIsReplying] = useState(false);

    // Form state
    const [newAnswer, setNewAnswer] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Real-time listener for answers
    useEffect(() => {
        const q = query(
            collection(db, "answers"),
            where("questionId", "==", question.id),
            orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Answer[] = [];
            snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() } as Answer));
            setAnswers(fetched);
        });
        return () => unsubscribe();
    }, [question.id]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation max 2MB
        if (file.size > 2 * 1024 * 1024) {
            setError("Image size must be less than 2MB.");
            return;
        }

        setError("");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setError("");
    };

    const handlePostAnswer = async () => {
        if (!newAnswer.trim() && !imageFile) return;
        if (!user) return;

        if (containsSpam(newAnswer)) {
            setError("Answer contains inappropriate language.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            let downloadUrl = "";

            if (imageFile) {
                const uniqueFilename = `${uuidv4()}_${imageFile.name}`;
                const storageRef = ref(storage, `answers/${question.id}/${uniqueFilename}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                downloadUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, "answers"), {
                questionId: question.id,
                userId: user.uid,
                text: newAnswer.trim(),
                imageUrl: downloadUrl || null,
                createdAt: serverTimestamp()
            });

            // Reset
            setNewAnswer("");
            clearImage();
            setIsReplying(false);
        } catch (err) {
            const error = err as Error;
            console.error("Failed to post answer", error);
            setError(error.message || "Failed to post answer.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpvoteQuestion = async () => {
        if (!user) return;
        try {
            const qRef = doc(db, "questions", question.id);
            await updateDoc(qRef, { upvotes: increment(1) });
        } catch (err) {
            console.error("Failed to upvote", err);
        }
    };

    const handleUpvoteAnswer = async (answerId: string) => {
        if (!user) return;
        try {
            const aRef = doc(db, "answers", answerId);
            await updateDoc(aRef, { upvotes: increment(1) });
        } catch (err) {
            console.error("Failed to upvote answer", err);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 bg-[#0a0a0c] border border-white/[0.04] shadow-xl rounded-[24px] space-y-6 hover:border-white/10 transition-colors"
        >
            <div className="flex flex-col space-y-4">
                {/* Header: Avatar, Name, Time */}
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-full shadow-inner" style={{ background: generateAvatarGradient(question.userId) }} />
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="text-zinc-200 font-bold text-sm">Builder {question.userId.substring(0,4)}</span>
                            <span className="text-zinc-600 text-xs">•</span>
                            <span className="text-zinc-500 text-xs font-medium">{formatTimeAgo(question.createdAt)}</span>
                        </div>
                        <span className="self-start px-2 py-0.5 mt-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/[0.04] text-zinc-400 border border-white/[0.05]">
                            {question.category}
                        </span>
                    </div>
                </div>

                <p className="text-white text-xl font-bold leading-relaxed">{question.question}</p>

                <div className="flex items-center space-x-4 pt-2">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleUpvoteQuestion}
                        className="flex items-center text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] px-4 h-10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                    >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        <span className="font-semibold">{question.upvotes || 0}</span>
                    </motion.button>
                    <Button
                        onClick={() => setIsReplying(!isReplying)}
                        variant="ghost"
                        className={`text-zinc-400 hover:text-white rounded-lg h-10 px-5 transition-colors ${isReplying ? 'bg-white/10 text-white' : 'bg-white/[0.02] hover:bg-white/[0.08]'}`}
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                    </Button>
                </div>
            </div>

            {/* Answers Thread with Vertical Thread Line */}
            {answers.length > 0 && (
                <div className="pt-2 mt-2 space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] sm:before:left-[19px] before:-top-6 before:w-[2px] before:bg-white/[0.05]">
                    <AnimatePresence>
                    {answers.map(ans => (
                        <motion.div 
                            key={ans.id} 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex space-x-3 relative z-10"
                        >
                            {/* Answer Avatar */}
                            <div className="w-10 h-10 rounded-full shrink-0 shadow-inner border-[4px] border-[#0a0a0c]" style={{ background: generateAvatarGradient(ans.userId) }} />
                            
                            <div className="space-y-2 w-full pt-1 bg-white/[0.02] p-5 rounded-2xl rounded-tl-lg border border-white/[0.02]">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-zinc-300 font-bold text-sm">Builder {ans.userId.substring(0,4)}</span>
                                    <span className="text-zinc-600 text-xs">•</span>
                                    <span className="text-zinc-500 text-xs font-medium">{formatTimeAgo(ans.createdAt)}</span>
                                </div>
                                
                                {ans.text && <p className="text-zinc-300 text-base leading-relaxed">{ans.text}</p>}
                                {ans.imageUrl && (
                                    <div className="mt-3 rounded-2xl overflow-hidden border border-white/[0.08] inline-block max-w-full shadow-lg">
                                        <img src={ans.imageUrl} alt="Answer attachment" className="max-h-[300px] object-contain bg-black/50" />
                                    </div>
                                )}
                                <div className="pt-3">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleUpvoteAnswer(ans.id)}
                                        className="flex items-center text-xs text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                                        <span className="font-semibold">{ans.upvotes || 0}</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Reply Composer */}
            {isReplying && user && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t border-white/[0.04] space-y-4"
                >
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full shrink-0 shadow-inner" style={{ background: generateAvatarGradient(user.uid) }} />
                        <div className="w-full space-y-4">
                            <Textarea
                                placeholder="Post your answer..."
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                className="min-h-[100px] bg-white/[0.02] border border-white/[0.05] text-zinc-200 focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl p-4 text-sm resize-none"
                            />

                            {imagePreview && (
                                <div className="relative inline-block mt-3">
                                    <img src={imagePreview} alt="Preview" className="max-h-40 rounded-xl border border-white/10 shadow-lg" />
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-3 -right-3 w-8 h-8 rounded-full shadow-lg border-2 border-[#0a0a0c]"
                                        onClick={clearImage}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {error && <p className="text-red-400 text-sm font-medium bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    <input
                                        type="file"
                                        id={`file-${question.id}`}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <Button
                                        variant="outline"
                                        className="bg-white/[0.03] border-white/10 text-zinc-300 hover:text-white rounded-full hover:bg-white/[0.08]"
                                        onClick={() => document.getElementById(`file-${question.id}`)?.click()}
                                    >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Attach Image
                                    </Button>
                                </div>

                                <div className="flex space-x-3">
                                    <Button onClick={() => setIsReplying(false)} variant="ghost" className="text-zinc-400 hover:text-white rounded-lg">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handlePostAnswer}
                                        disabled={submitting || (!newAnswer.trim() && !imageFile)}
                                        className="bg-white hover:bg-zinc-200 text-black rounded-lg px-8 font-bold shadow-md"
                                    >
                                        {submitting ? "Posting..." : "Post"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {isReplying && !user && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/[0.04] text-center">
                    <p className="text-zinc-400">Log in to post an answer.</p>
                </motion.div>
            )}
        </motion.div>
    );
}
