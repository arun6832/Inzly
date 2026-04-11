import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inzly Map — Explore Innovation Around You",
    description: "Discover startup ideas, local problems and hot zones of innovation happening near you on the Inzly live map.",
};

// Override root layout: map is full-screen, hide footer/nav padding
export default function MapLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 overflow-hidden">
            {children}
        </div>
    );
}
