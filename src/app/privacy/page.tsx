import Footer from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col relative w-full pt-32">
            <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-32 relative z-10">
                <div className="space-y-16">
                    <header className="space-y-6 border-b border-white/5 pb-10">
                        <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-zinc-500">Last updated: March 2026</p>
                    </header>

                    <article className="prose prose-invert prose-zinc max-w-none text-zinc-400 leading-relaxed font-medium">
                        <p>
                            At Inzly, we respect your privacy and are committed to protecting the personal information you share with us. This policy outlines our practices regarding data collection, use, and protection within our idea discovery ecosystem.
                        </p>
                        
                        <h3 className="text-xl font-semibold text-white mt-10 mb-4">1. Information We Collect</h3>
                        <p>
                            We collect information you provide directly to us when organizing an account, submitting an idea, or interacting with other founders on the platform. This includes your name, email address, and the creative content (ideas) you publish.
                        </p>

                        <h3 className="text-xl font-semibold text-white mt-10 mb-4">2. Intellectual Property & Ideas</h3>
                        <p>
                            Ideas posted on the public feed are visible to authenticated users. While we curate our community, we cannot guarantee strict confidentiality of public posts. We recommend sharing the "vision" and "problem statement" rather than proprietary code or deeply guarded trade secrets until you match with a co-founder.
                        </p>

                        <h3 className="text-xl font-semibold text-white mt-10 mb-4">3. How We Use Information</h3>
                        <p>
                            We use the information collected to operate and improve our platform, match you with relevant ideas and potential co-founders, and personalize your ecosystem experience. We do not sell your personal data to third-party data brokers.
                        </p>

                        <h3 className="text-xl font-semibold text-white mt-10 mb-4">4. Data Security</h3>
                        <p>
                            We implement commercially reasonable security measures to protect your account data. Your authentication is securely managed via standard encryption protocols.
                        </p>
                    </article>
                </div>
            </main>
            <Footer />
        </div>
    );
}
