export type UserMode = "explorer" | "sparker" | "builder" | "catalyst";


export interface User {
    id: string;
    email: string;
    username?: string;
    mode: UserMode;
    photoURL?: string;
    // Reputation fields
    trustScore?: number;
    reportsCount?: number;
    contributionActivity?: number;
}

export interface IdeaLocation {
    city: string;
    area?: string;
    lat: number;
    lng: number;
    geohash: string;
}

export interface Idea {
    id: string;
    title: string;
    idea: string;
    category: string;
    userId: string;
    authorUsername?: string;
    likesCount?: number;
    views?: number;
    githubUrl?: string;
    createdAt?: { toDate?: () => Date } | Date | number | string;
    // Map feature fields
    location?: IdeaLocation;
    visibility?: "public" | "restricted" | "investor";
    engagementScore?: number;
}
