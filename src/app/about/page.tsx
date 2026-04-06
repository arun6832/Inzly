
export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col relative w-full pt-32">
            {/* Background Orbs */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1400px] pointer-events-none z-0 opacity-40">
                <div className="absolute top-[10%] left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]"></div>
                <div className="absolute bottom-[10%] right-[10%] w-[60vw] h-[40vw] max-w-[800px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_70%)]"></div>
            </div>

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-32 relative z-10">
                <div className="space-y-16">
                    <header className="space-y-6">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md text-sm font-medium text-indigo-200/80">
                            Our Origin
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 font-light italic pr-2">Inzly?</span>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            We believe that the most profound technological leaps are born in collaborative ecosystems, not isolated silos.
                        </p>
                    </header>

                    <section className="space-y-8 text-lg text-zinc-400/90 leading-relaxed">
                        <p>
                            The startup landscape has fundamentally changed. Building a product is no longer the hardest part; distributing it and finding the right people to build it with is. Inzly was created to solve the cold-start problem for visionary builders.
                        </p>
                        <p>
                            Too many brilliant ideas die because their creators lack a sounding board. They build in the dark, launch to crickets, and assume the idea was flawed, when in reality, it just lacked the sunlight of early feedback and the right technical co-founder.
                        </p>
                        <h3 className="text-2xl font-semibold text-white mt-12 mb-6">The Ecosystem Approach</h3>
                        <p>
                            We view startups not as machines to be manufactured, but as organisms to be grown. Just as a forest requires a complex network of roots to share nutrients, a great platform requires a network of minds sharing insights, code, and vision.
                        </p>
                        <p>
                            Inzly is that root network. We provide the soil where you can safely plant your earliest, most fragile concepts. Through our swipe-based discovery engine, your idea is immediately placed in front of curated builders who provide rapid, intelligent validation.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
