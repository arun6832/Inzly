import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col relative w-full pt-32">
            {/* Background Orbs */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1400px] pointer-events-none z-0 opacity-40">
                <div className="absolute top-[30%] left-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"></div>
            </div>

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-32 relative z-10">
                <div className="space-y-16">
                    <header className="space-y-6">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md text-sm font-medium text-blue-200/80">
                            Careers
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                            Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300 font-light italic pr-2">Ecosystem</span>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            Join a team of obsessive craftsmen dedicated to accelerating the pace of human innovation.
                        </p>
                    </header>

                    <section className="space-y-8">
                        <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-md">
                            <h3 className="text-2xl font-medium text-white mb-4">No Open Roles</h3>
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                We are currently not actively hiring for full-time positions. However, we are always on the lookout for exceptional talent. If you believe your work belongs here, reach out.
                            </p>
                            <Button className="bg-white/10 text-white hover:bg-white/20 rounded-full px-8">
                                Send an Open Application
                            </Button>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
