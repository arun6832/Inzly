import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function CareersPage() {
    return (
        <div className="flex-1 min-h-screen bg-background nothing-grid w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[350px] pointer-events-none z-0 nothing-radial-glow opacity-30" />

            <main className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-36 pb-32">
                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Careers</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-dot tracking-tight text-foreground leading-[1.05]">
                        Build the{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Ecosystem
                        </span>
                    </h1>
                </div>

                <p className="text-xl text-foreground/80 font-medium leading-relaxed mb-16">
                    Join a team of obsessive craftsmen dedicated to accelerating the pace of human innovation.
                </p>

                {/* What we look for */}
                <div className="space-y-10 text-base text-muted-foreground leading-[1.9] mb-16">
                    <p>
                        We hire people who are relentlessly curious, who ship fast and iterate faster, and who hold themselves to standards that others consider unreasonably high. If you've ever stayed up past midnight debugging not because you had to, but because you genuinely couldn't let it go — you'll fit right in.
                    </p>
                    <p>
                        Our team is small and our ambition is large. Every person we bring on has direct ownership over a meaningful surface area of the product. There is no layer of abstraction between your work and the user experiencing it.
                    </p>
                </div>

                {/* Principles */}
                <div className="border-t border-border mb-16">
                    {[
                        { title: "Ownership over coordination", body: "Everyone owns their domain end-to-end. No hand-holding, no approval chains. High trust, high accountability." },
                        { title: "Ship, then refine", body: "We move fast and we are not afraid of imperfection. The fastest path to quality is through real usage." },
                        { title: "Builder empathy", body: "We build for founders because we are founders. Every feature is designed with deep respect for the builder's journey." },
                    ].map((p, i) => (
                        <div key={p.title} className={`py-8 ${i < 2 ? "border-b border-border" : ""}`}>
                            <div className="flex gap-8 md:gap-12">
                                <span className="text-xs font-mono text-muted-foreground/40 pt-1 shrink-0 w-8">0{i + 1}</span>
                                <div>
                                    <h3 className="font-bold font-dot tracking-tight text-foreground mb-2">{p.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No open roles */}
                <div className="p-8 bg-card border border-border rounded-2xl">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Open Roles</p>
                    <h3 className="text-2xl font-bold font-dot tracking-tight text-foreground mb-3">No current openings</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg text-sm">
                        We are not actively hiring right now. However, we are always interested in hearing from exceptional people. If you believe your work belongs here, send us a note.
                    </p>
                    <a href="mailto:hello@inzly.com">
                        <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-11 px-6 font-semibold inline-flex items-center gap-2 text-sm">
                            Get in Touch
                            <ArrowUpRight className="w-4 h-4" />
                        </Button>
                    </a>
                </div>
            </main>
        </div>
    );
}
