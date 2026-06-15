export default function AboutPage() {
    return (
        <div className="flex-1 min-h-screen bg-background nothing-grid w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[350px] pointer-events-none z-0 nothing-radial-glow opacity-30" />

            <main className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-36 pb-32">
                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Our Origin</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-dot tracking-tight text-foreground leading-[1.05]">
                        Why{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Inzly?
                        </span>
                    </h1>
                </div>

                {/* Lead paragraph */}
                <p className="text-xl text-foreground/80 leading-relaxed mb-16 font-medium">
                    We believe that the most profound technological leaps are born in collaborative ecosystems, not isolated silos.
                </p>

                {/* Body content */}
                <div className="space-y-10 text-base text-muted-foreground leading-[1.9]">
                    <p>
                        The startup landscape has fundamentally changed. Building a product is no longer the hardest part — distributing it and finding the right people to build it with is. Inzly was created to solve the cold-start problem for visionary builders who know what they want to create, but lack the network to bring it to life.
                    </p>
                    <p>
                        Too many brilliant ideas die because their creators lack a sounding board. They build in the dark, launch to crickets, and assume the idea was flawed — when in reality, it just lacked the sunlight of early feedback and the right technical co-founder.
                    </p>

                    <div className="border-l-2 border-blue-500/40 pl-6 py-1">
                        <p className="text-foreground font-medium text-lg leading-relaxed">
                            Inzly is that root network. We provide the soil where you can safely plant your earliest, most fragile concepts.
                        </p>
                    </div>

                    <div className="border-t border-border pt-10 space-y-8">
                        <div>
                            <h3 className="text-foreground font-bold font-dot tracking-tight text-xl mb-4">The Ecosystem Approach</h3>
                            <p>
                                We view startups not as machines to be manufactured, but as organisms to be grown. Just as a forest requires a complex network of roots to share nutrients, a great platform requires a network of minds sharing insights, code, and vision.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-foreground font-bold font-dot tracking-tight text-xl mb-4">For Builders, By Builders</h3>
                            <p>
                                Through our swipe-based discovery engine, your idea is immediately placed in front of curated builders who provide rapid, intelligent validation. Innovation isn't manufactured — it grows organically when the right minds intersect. Find co-founders whose skills complement your own, people who share your conviction.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-foreground font-bold font-dot tracking-tight text-xl mb-4">A Global Stage</h3>
                            <p>
                                We are building a borderless community of innovators. Not just for founders — students deconstruct industry-grade projects, contribute to real-world codebases, and build a portfolio that speaks louder than any résumé. Every great idea deserves the right audience.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
