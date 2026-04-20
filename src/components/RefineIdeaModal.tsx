"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { doc, updateDoc, collection, addDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExecutionStatus } from "@/lib/geoUtils";
import { History, Rocket, Loader2, Sparkles } from "lucide-react";

interface RefineIdeaModalProps {
    isOpen: boolean;
    onClose: () => void;
    ideaId: string;
    currentTitle: string;
    currentIdea: string;
    currentStatus: ExecutionStatus;
    currentGithub: string;
    currentVersion: number;
    onSuccess: () => void;
}

export default function RefineIdeaModal({
    isOpen,
    onClose,
    ideaId,
    currentTitle,
    currentIdea,
    currentStatus,
    currentGithub,
    currentVersion,
    onSuccess
}: RefineIdeaModalProps) {
    const [title, setTitle] = useState(currentTitle);
    const [description, setDescription] = useState(currentIdea);
    const [status, setStatus] = useState<ExecutionStatus>(currentStatus);
    const [github, setGithub] = useState(currentGithub);
    const [changelog, setChangelog] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRefine = async () => {
        if (!changelog.trim()) {
            alert("Please provide a changelog for this version.");
            return;
        }

        setLoading(true);
        try {
            const ideaRef = doc(db, "ideas", ideaId);
            
            // 1. Create a snapshot in 'versions' subcollection
            await addDoc(collection(db, "ideas", ideaId, "versions"), {
                versionNumber: currentVersion,
                titleSnapshot: currentTitle,
                descriptionSnapshot: currentIdea,
                statusSnapshot: currentStatus,
                githubSnapshot: currentGithub,
                changelog: changelog,
                timestamp: serverTimestamp()
            });

            // 2. Update the main idea document
            await updateDoc(ideaRef, {
                title: title,
                idea: description,
                executionStatus: status,
                githubUrl: github,
                currentVersion: increment(1),
                updatedAt: serverTimestamp()
            });

            setChangelog("");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Refinement failed:", err);
            alert("Refinement failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0B0B0F] border border-white/10 text-white max-w-2xl rounded-[32px] p-0 overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse" />
                
                <DialogHeader className="p-8 pb-0">
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Refinement Portal</span>
                    </div>
                    <DialogTitle className="text-3xl font-bold tracking-tight">Propose v{currentVersion + 1}</DialogTitle>
                    <DialogDescription className="text-zinc-500 font-medium">
                        You are about to snapshot v{currentVersion} and propagate new changes to the ecosystem.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Refined Title</label>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Execution Status</label>
                        <Select value={status} onValueChange={(val: ExecutionStatus) => setStatus(val)}>
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0B0B0F] border-white/10 text-white">
                                <SelectItem value="Thinking">Thinking</SelectItem>
                                <SelectItem value="Refining">Refining</SelectItem>
                                <SelectItem value="Building">Building</SelectItem>
                                <SelectItem value="Launched">Launched</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Refined Execution Plan</label>
                        <Textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="bg-white/5 border-white/10 rounded-2xl p-4 focus:ring-indigo-500 text-sm leading-relaxed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">GitHub Artifact (Optional)</label>
                        <Input 
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                            placeholder="https://github.com/..."
                            className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Changelog (Required for Snapshot)</label>
                            <Input 
                                value={changelog}
                                onChange={(e) => setChangelog(e.target.value)}
                                placeholder="What changed in this version?"
                                className="bg-indigo-500/5 border-indigo-500/20 rounded-xl h-12 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-[10px]"
                    >
                        Abort
                    </Button>
                    <Button 
                        onClick={handleRefine}
                        disabled={loading}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] shadow-xl shadow-indigo-500/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                        Propagate v{currentVersion + 1}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
